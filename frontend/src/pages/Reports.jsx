import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ReportService from '../services/reportService';
import ApartmentService from '../services/apartmentService';
import { toast } from 'react-hot-toast';
import { format, subMonths } from 'date-fns';
import {
  HiChartBar,
  HiArrowDownTray,
  HiCalendar,
  HiBuildingOffice2,
  HiCurrencyDollar,
  HiUserGroup,
  HiExclamationTriangle,
  HiCheckCircle 
} from 'react-icons/hi2';

const Reports = () => {
  const [apartments, setApartments] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [loading, setLoading] = useState({
    monthly: true,
    occupancy: true,
    overdue: true
  });

  const filterForm = useForm({
    defaultValues: {
      apartmentId: '',
      from: format(subMonths(new Date(), 6), 'yyyy-MM'),
      to: format(new Date(), 'yyyy-MM')
    }
  });

  useEffect(() => {
    loadApartments();
    loadMonthlyReports();
    loadOccupancyReport();
    loadOverdueReport();
  }, []);

  const loadApartments = async () => {
    try {
      const response = await ApartmentService.getApartments();
      setApartments(response.data.apartments || []);
    } catch (error) {
      console.error('Failed to load apartments:', error);
    }
  };

  const loadMonthlyReports = async (filters = {}) => {
    try {
      setLoading(prev => ({ ...prev, monthly: true }));
      const response = await ReportService.getMonthlyReport(filters);
      setMonthlyReports(response.data.reports || []);
    } catch (error) {
        console.error('Failed to load :', error);
      toast.error('Failed to load monthly reports');
    } finally {
      setLoading(prev => ({ ...prev, monthly: false }));
    }
  };

  const loadOccupancyReport = async () => {
    try {
      setLoading(prev => ({ ...prev, occupancy: true }));
      const response = await ReportService.getOccupancyReport();
      setOccupancyData(response.data.occupancy || []);
    } catch (error) {
        console.error('Failed to load :', error);
      toast.error('Failed to load occupancy report');
    } finally {
      setLoading(prev => ({ ...prev, occupancy: false }));
    }
  };

  const loadOverdueReport = async () => {
    try {
      setLoading(prev => ({ ...prev, overdue: true }));
      const response = await ReportService.getOverdueReport();
      setOverdueData(response.data.overdue || []);
    } catch (error) {
        console.error('Failed to load :', error);
      toast.error('Failed to load overdue report');
    } finally {
      setLoading(prev => ({ ...prev, overdue: false }));
    }
  };

  const handleFilterSubmit = (data) => {
    loadMonthlyReports(data);
  };

  const handleExport = async (type) => {
    try {
      const filters = filterForm.getValues();
      const response = await ReportService.exportData(type, filters);
      const filename = `${type}_${format(new Date(), 'yyyyMMdd')}.csv`;
      ReportService.downloadBlob(response, filename);
      toast.success(`Exported ${type} data successfully`);
    } catch (error) {
        console.error('Failed to load :', error);
      toast.error('Failed to export data');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('tenants')}
            className="btn btn-secondary"
          >
            <HiArrowDownTray className="h-5 w-5 mr-2" />
            Export Tenants
          </button>
          <button
            onClick={() => handleExport('payments')}
            className="btn btn-secondary"
          >
            <HiArrowDownTray className="h-5 w-5 mr-2" />
            Export Payments
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Expected"
          value={`₹${monthlyReports.reduce((sum, report) => sum + parseFloat(report.total_expected || 0), 0).toLocaleString()}`}
          icon={HiCurrencyDollar}
          color="bg-blue-500"
          subtitle="Last 6 months"
        />
        <StatCard
          title="Total Collected"
          value={`₹${monthlyReports.reduce((sum, report) => sum + parseFloat(report.total_collected || 0), 0).toLocaleString()}`}
          icon={HiCurrencyDollar}
          color="bg-green-500"
          subtitle="Last 6 months"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyData.length > 0 ? Math.round(occupancyData[0]?.occupancy_rate || 0) : 0}%`}
          icon={HiUserGroup}
          color="bg-purple-500"
          subtitle="Current month"
        />
        <StatCard
          title="Overdue"
          value={overdueData.length}
          icon={HiExclamationTriangle}
          color="bg-red-500"
          subtitle="Total overdue units"
        />
      </div>

      {/* Filter Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Reports</h2>
        <form onSubmit={filterForm.handleSubmit(handleFilterSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apartment
              </label>
              <select
                {...filterForm.register('apartmentId')}
                className="input"
              >
                <option value="">All Apartments</option>
                {apartments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Month
              </label>
              <input
                type="month"
                {...filterForm.register('from')}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Month
              </label>
              <input
                type="month"
                {...filterForm.register('to')}
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary">
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Monthly Reports */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Rent Reports</h2>
          <HiChartBar className="h-6 w-6 text-gray-400" />
        </div>
        
        {loading.monthly ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : monthlyReports.length === 0 ? (
          <div className="text-center py-12">
            <HiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apartment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyReports.map((report) => {
                  const collectionRate = report.total_expected > 0 
                    ? Math.round((report.total_collected / report.total_expected) * 100)
                    : 0;
                  
                  return (
                    <tr key={`${report.month}-${report.apartment_name}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {format(new Date(report.month + '-01'), 'MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.apartment_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₹{parseFloat(report.total_expected || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₹{parseFloat(report.total_collected || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          report.total_outstanding > 0 ? 'text-danger-600' : 'text-success-600'
                        }`}>
                          ₹{parseFloat(report.total_outstanding || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  collectionRate >= 90 ? 'bg-success-600' :
                                  collectionRate >= 70 ? 'bg-warning-600' :
                                  'bg-danger-600'
                                }`}
                                style={{ width: `${Math.min(collectionRate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              {collectionRate}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${
                          collectionRate >= 90 ? 'badge-success' :
                          collectionRate >= 70 ? 'badge-warning' :
                          'badge-danger'
                        }`}>
                          {collectionRate >= 90 ? 'Good' :
                           collectionRate >= 70 ? 'Average' :
                           'Poor'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overdue Report */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Overdue Rent Report</h2>
          <HiExclamationTriangle className="h-6 w-6 text-danger-500" />
        </div>
        
        {loading.overdue ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : overdueData.length === 0 ? (
          <div className="text-center py-12">
            <HiCheckCircle className="mx-auto h-12 w-12 text-success-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No overdue rent</h3>
            <p className="mt-1 text-sm text-gray-500">
              All rent payments are up to date
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueData.map((item) => {
                  const dueDate = new Date(item.due_date);
                  const today = new Date();
                  const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.tenant_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`tel:${item.tenant_phone}`}
                          className="text-sm text-primary-600 hover:text-primary-900"
                        >
                          {item.tenant_phone}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.apartment_name} - {item.unit_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(item.month + '-01'), 'MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(dueDate, 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₹{parseFloat(item.amount_due).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-danger-600">
                          ₹{parseFloat(item.remaining).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="badge badge-danger">
                            {daysOverdue} days
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;