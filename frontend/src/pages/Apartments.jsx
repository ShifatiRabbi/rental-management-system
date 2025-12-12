import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import ApartmentService from '../services/apartmentService';
import { toast } from 'react-hot-toast';
import { HiPlus, HiTrash, HiPencil, HiEye } from 'react-icons/hi2';

const Apartments = () => {
  const [showForm, setShowForm] = useState(false);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      address: '',
      caretaker_name: '',
      caretaker_phone: '',
      floors_count: 1,
      units_per_floor: 1,
      rent_due_day: 1,
      overdue_day: 10
    }
  });

  useEffect(() => {
    loadApartments();
  }, []);

  const loadApartments = async () => {
    try {
      setLoading(true);
      const response = await ApartmentService.getApartments();
      setApartments(response.data.apartments || []);
    } catch (error) {
      toast.error('Failed to load apartments' + error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const response = await ApartmentService.createApartment(data);
      toast.success('Apartment created successfully!');
      setShowForm(false);
      reset();
      // Navigate to the new apartment
      navigate(`/apartments/${response.data.apartment.id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create apartment');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will delete all associated floors, units, and tenant data.`)) {
      return;
    }

    try {
      await ApartmentService.deleteApartment(id);
      toast.success('Apartment deleted successfully');
      loadApartments();
    } catch (error) {
      toast.error('Failed to delete apartment' + error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Apartments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <HiPlus className="h-5 w-5 mr-2" />
          Add Apartment
        </button>
      </div>

      {/* Apartment Creation Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Apartment</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apartment Name *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="input"
                  placeholder="e.g., Sunshine Apartments"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caretaker Name
                </label>
                <input
                  type="text"
                  {...register('caretaker_name')}
                  className="input"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                {...register('address', { required: 'Address is required' })}
                className="input"
                rows="3"
                placeholder="Full address including city, state, and zip code"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-danger-600">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caretaker Phone
                </label>
                <input
                  type="tel"
                  {...register('caretaker_phone')}
                  className="input"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rent Due Day
                  </label>
                  <select {...register('rent_due_day')} className="input">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overdue After (days)
                  </label>
                  <input
                    type="number"
                    {...register('overdue_day', { min: 1, max: 31 })}
                    className="input"
                    defaultValue={10}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Floors *
                </label>
                <input
                  type="number"
                  {...register('floors_count', { 
                    required: 'Required',
                    min: { value: 1, message: 'Minimum 1 floor' },
                    max: { value: 50, message: 'Maximum 50 floors' }
                  })}
                  className="input"
                  min="1"
                  max="50"
                />
                {errors.floors_count && (
                  <p className="mt-1 text-sm text-danger-600">{errors.floors_count.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units per Floor *
                </label>
                <input
                  type="number"
                  {...register('units_per_floor', { 
                    required: 'Required',
                    min: { value: 1, message: 'Minimum 1 unit per floor' },
                    max: { value: 100, message: 'Maximum 100 units per floor' }
                  })}
                  className="input"
                  min="1"
                  max="100"
                />
                {errors.units_per_floor && (
                  <p className="mt-1 text-sm text-danger-600">{errors.units_per_floor.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Apartment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Apartments List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Apartments</h2>
        {apartments.length === 0 ? (
          <div className="text-center py-12">
            <HiBuildingOffice2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No apartments</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first apartment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Rent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apartments.map((apartment) => (
                  <tr key={apartment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {apartment.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {apartment.floors_count} floors
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {apartment.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge badge-success">
                        {apartment.occupied_units || 0}/{apartment.total_units || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{parseFloat(apartment.expected_rent || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/apartments/${apartment.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <HiEye className="h-5 w-5 inline" />
                      </Link>
                      <button
                        onClick={() => handleDelete(apartment.id, apartment.name)}
                        className="text-danger-600 hover:text-danger-900"
                      >
                        <HiTrash className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Apartments;