import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApartmentService from '../services/apartmentService';
import { 
  HiBuildingOffice2, 
  HiUserGroup, 
  HiCurrencyDollar,
  HiExclamationTriangle
} from 'react-icons/hi2';

const Dashboard = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApartments: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    expectedRent: 0,
    collectedRent: 0,
    overdueCount: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await ApartmentService.getApartments();
      setApartments(response.data.apartments || []);
      
      // Calculate overall stats
      const overallStats = response.data.apartments.reduce((acc, apt) => ({
        totalApartments: acc.totalApartments + 1,
        totalUnits: acc.totalUnits + (apt.total_units || 0),
        occupiedUnits: acc.occupiedUnits + (apt.occupied_units || 0),
        expectedRent: acc.expectedRent + (parseFloat(apt.expected_rent) || 0),
        collectedRent: acc.collectedRent, // This needs actual payment data
        overdueCount: acc.overdueCount // This needs actual overdue data
      }), {
        totalApartments: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        expectedRent: 0,
        collectedRent: 0,
        overdueCount: 0
      });
      
      setStats(overallStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: color }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/apartments/new"
          className="btn btn-primary"
        >
          Add New Apartment
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Apartments"
          value={stats.totalApartments}
          icon={HiBuildingOffice2}
          color="bg-blue-500"
        />
        <StatCard
          title="Occupied Units"
          value={`${stats.occupiedUnits}/${stats.totalUnits}`}
          icon={HiUserGroup}
          color="bg-green-500"
        />
        <StatCard
          title="Expected Rent"
          value={`₹${stats.expectedRent.toLocaleString()}`}
          icon={HiCurrencyDollar}
          color="bg-purple-500"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueCount}
          icon={HiExclamationTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Apartments List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Apartments</h2>
        {apartments.length === 0 ? (
          <div className="text-center py-12">
            <HiBuildingOffice2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No apartments</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new apartment.
            </p>
            <div className="mt-6">
              <Link
                to="/apartments/new"
                className="btn btn-primary"
              >
                Add Apartment
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map((apartment) => (
              <Link
                key={apartment.id}
                to={`/apartments/${apartment.id}`}
                className="block p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {apartment.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{apartment.address}</p>
                  </div>
                  <span className="badge badge-success">
                    {apartment.occupied_units || 0}/{apartment.total_units || 0} units
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Expected Rent</p>
                    <p className="text-lg font-semibold">
                      ₹{parseFloat(apartment.expected_rent || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Occupancy</p>
                    <p className="text-lg font-semibold">
                      {apartment.total_units ? 
                        Math.round((apartment.occupied_units / apartment.total_units) * 100) : 0
                      }%
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <HiBuildingOffice2 className="h-4 w-4 mr-1" />
                  {apartment.floors_count} floors
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/reports"
            className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100"
          >
            View Reports
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Print Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;