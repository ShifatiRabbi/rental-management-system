import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ApartmentService from '../services/apartmentService';
import { toast } from 'react-hot-toast';
import { 
  HiArrowLeft,
  HiBuildingOffice2,
  HiUserGroup,
  HiCurrencyDollar,
  HiExclamationTriangle,
  HiPhone,
  HiMapPin,
  HiCalendar,
  HiHome,
  HiPlus
} from 'react-icons/hi2';

const ApartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);

  useEffect(() => {
    loadApartmentDetails();
    loadApartmentStats();
  }, [id]);

  const loadApartmentDetails = async () => {
    try {
      setLoading(true);
      const response = await ApartmentService.getApartmentById(id);
      setApartment(response.data.apartment);
      if (response.data.apartment?.floors?.length > 0) {
        setSelectedFloor(response.data.apartment.floors[0]);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to load apartment details');
      navigate('/apartments');
    } finally {
      setLoading(false);
    }
  };

  const loadApartmentStats = async () => {
    try {
      const response = await ApartmentService.getApartmentStats(id);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load apartment stats:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'vacant': return 'bg-gray-100 text-gray-800';
      case 'occupied': return 'bg-success-100 text-success-800';
      case 'overdue': return 'bg-danger-100 text-danger-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUnitClick = (unit) => {
    navigate(`/units/${unit.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="text-center py-12">
        <HiBuildingOffice2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Apartment not found</h3>
        <div className="mt-6">
          <Link to="/apartments" className="btn btn-primary">
            <HiArrowLeft className="h-5 w-5 mr-2" />
            Back to Apartments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/apartments" className="text-gray-600 hover:text-gray-900">
            <HiArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{apartment.name}</h1>
            <div className="flex items-center text-sm text-gray-500">
              <HiMapPin className="h-4 w-4 mr-1" />
              <span>{apartment.address}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
        >
          Print Summary
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <HiHome className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Units</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.total_units || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <HiUserGroup className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Occupied</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.occupied_units || 0}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({stats?.occupancy_rate || 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <HiCurrencyDollar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expected Rent</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{parseFloat(stats?.expected_rent || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <HiExclamationTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.overdue_count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Apartment Info & Caretaker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Apartment Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Floors</p>
                <p className="text-lg font-medium">{apartment.floors_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Units per Floor</p>
                <p className="text-lg font-medium">{apartment.units_per_floor}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Rent Due Day</p>
                <p className="text-lg font-medium">{apartment.rent_due_day || 1} of each month</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue After</p>
                <p className="text-lg font-medium">{apartment.overdue_day || 10} days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Caretaker</h2>
          {apartment.caretaker_name ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-medium">{apartment.caretaker_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <a
                  href={`tel:${apartment.caretaker_phone}`}
                  className="text-lg font-medium text-primary-600 hover:text-primary-800 flex items-center"
                >
                  <HiPhone className="h-4 w-4 mr-2" />
                  {apartment.caretaker_phone}
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No caretaker assigned</p>
              <button className="mt-2 btn btn-secondary">
                <HiPlus className="h-4 w-4 mr-2" />
                Assign Caretaker
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floor Navigation */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Floors & Units</h2>
        
        {/* Floor Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-4">
          {apartment.floors?.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                selectedFloor?.id === floor.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Floor {floor.floor_number}
              <span className="ml-2 text-xs opacity-75">
                ({floor.units_count} units)
              </span>
            </button>
          ))}
        </div>

        {/* Units Grid */}
        {selectedFloor && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-700 mb-4">
              Floor {selectedFloor.floor_number} - Units
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedFloor.units?.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => handleUnitClick(unit)}
                  className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${
                    unit.status === 'vacant'
                      ? 'border-gray-300 bg-gray-50'
                      : unit.status === 'occupied'
                      ? 'border-success-300 bg-success-50'
                      : 'border-danger-300 bg-danger-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Unit {unit.unit_number}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ₹{parseFloat(unit.monthly_rent || 0).toLocaleString()}/month
                      </p>
                    </div>
                    <span className={`badge ${getStatusColor(unit.status)}`}>
                      {unit.status}
                    </span>
                  </div>
                  {unit.tenant && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {unit.tenant.name}
                      </p>
                      <p className="text-xs text-gray-500">{unit.tenant.phone}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentDetails;