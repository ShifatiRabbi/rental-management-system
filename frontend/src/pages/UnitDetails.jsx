import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import ApartmentService from "../services/apartmentService";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  HiArrowLeft,
  HiPhone,
  HiCalendar,
  HiCurrencyDollar,
  HiUser,
  HiDocumentText,
  HiCheckCircle,
  HiExclamationCircle,
  HiClock,
  HiPlus,
  HiPencil,
  HiTrash,
} from "react-icons/hi2";

const UnitDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedRentLog, setSelectedRentLog] = useState(null);

  const tenantForm = useForm({
    defaultValues: {
      name: "",
      phone: "",
      national_id: "",
      move_in_date: format(new Date(), "yyyy-MM-dd"),
      monthly_rent: unit?.monthly_rent || "",
      notes: "",
    },
  });

  const paymentForm = useForm({
    defaultValues: {
      amount: "",
      payment_method: "cash",
      note: "",
    },
  });

  useEffect(() => {
    loadUnitDetails();
  }, [id]);

  useEffect(() => {
    if (unit) {
      tenantForm.setValue("monthly_rent", unit.monthly_rent || "");
    }
  }, [unit]);

  const loadUnitDetails = async () => {
    try {
      setLoading(true);
      const response = await ApartmentService.getUnitDetails(id);
      setUnit(response.data.unit);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load unit details");
      navigate("/apartments");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTenant = async (data) => {
    try {
      await ApartmentService.assignTenant(id, {
        ...data,
        monthly_rent: parseFloat(data.monthly_rent),
      });
      toast.success("Tenant assigned successfully");
      setShowTenantForm(false);
      tenantForm.reset();
      loadUnitDetails();
    } catch (error) {
      toast.error(error.message || "Failed to assign tenant");
    }
  };

  const handleMakePayment = async (data) => {
    try {
      if (!selectedRentLog) return;

      await ApartmentService.makePayment(selectedRentLog.id, {
        ...data,
        amount: parseFloat(data.amount),
      });
      toast.success("Payment recorded successfully");
      setShowPaymentForm(false);
      paymentForm.reset();
      loadUnitDetails();
    } catch (error) {
      toast.error(error.message || "Failed to record payment");
    }
  };

  const handleMoveOutTenant = async () => {
    if (!window.confirm("Are you sure you want to move out this tenant?")) {
      return;
    }

    try {
      const moveOutDate = format(new Date(), "yyyy-MM-dd");
      await ApartmentService.moveOutTenant(id, moveOutDate);
      toast.success("Tenant moved out successfully");
      loadUnitDetails();
    } catch (error) {
        console.log(error);
      toast.error("Failed to move out tenant");
    }
  };

  const handleCallTenant = (phone) => {
    window.open(`tel:${phone}`, "_blank");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <HiCheckCircle className="h-5 w-5 text-success-500" />;
      case "partial":
        return <HiClock className="h-5 w-5 text-warning-500" />;
      case "overdue":
        return <HiExclamationCircle className="h-5 w-5 text-danger-500" />;
      default:
        return <HiClock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "badge-success";
      case "partial":
        return "badge-warning";
      case "overdue":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Unit not found
        </h3>
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
          <Link
            to={`/apartments/${unit.apartment_id}`}
            className="text-gray-600 hover:text-gray-900"
          >
            <HiArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Unit {unit.unit_number}
            </h1>
            <div className="text-sm text-gray-500">
              {unit.apartment_name} • Floor {unit.floor_number}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <span className={`badge ${getStatusColor(unit.status)}`}>
            {unit.status}
          </span>
          {unit.tenant && (
            <button
              onClick={() => handleCallTenant(unit.tenant.phone)}
              className="btn btn-success"
            >
              <HiPhone className="h-5 w-5 mr-2" />
              Call Tenant
            </button>
          )}
        </div>
      </div>

      {/* Unit Info Card */}
      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Unit Information
            </h2>
            <p className="text-sm text-gray-600">
              Monthly Rent: ₹
              {parseFloat(unit.monthly_rent || 0).toLocaleString()}
            </p>
          </div>
          {!unit.tenant && (
            <button
              onClick={() => setShowTenantForm(true)}
              className="btn btn-primary"
            >
              <HiPlus className="h-5 w-5 mr-2" />
              Assign Tenant
            </button>
          )}
        </div>
      </div>

      {/* Tenant Information */}
      {unit.tenant ? (
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Current Tenant
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <HiUser className="h-4 w-4 mr-2" />
                    Name
                  </p>
                  <p className="text-lg font-medium mt-1">{unit.tenant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <HiPhone className="h-4 w-4 mr-2" />
                    Phone
                  </p>
                  <a
                    href={`tel:${unit.tenant.phone}`}
                    className="text-lg font-medium text-primary-600 hover:text-primary-800 mt-1 block"
                  >
                    {unit.tenant.phone}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <HiCalendar className="h-4 w-4 mr-2" />
                    Move-in Date
                  </p>
                  <p className="text-lg font-medium mt-1">
                    {format(new Date(unit.tenant.move_in_date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">National ID</p>
                  <p className="text-lg font-medium mt-1">
                    {unit.tenant.national_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <HiCurrencyDollar className="h-4 w-4 mr-2" />
                    Monthly Rent
                  </p>
                  <p className="text-lg font-medium mt-1">
                    ₹
                    {parseFloat(unit.tenant.monthly_rent || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-lg font-medium mt-1">
                    {unit.tenant.notes || "No notes"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleMoveOutTenant} className="btn btn-danger">
                <HiTrash className="h-5 w-5 mr-2" />
                Move Out
              </button>
              <button className="btn btn-secondary">
                <HiPencil className="h-5 w-5 mr-2" />
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <HiUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No tenant assigned
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Assign a tenant to start tracking rent payments
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowTenantForm(true)}
                className="btn btn-primary"
              >
                <HiPlus className="h-5 w-5 mr-2" />
                Assign Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Assignment Form */}
      {showTenantForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Assign New Tenant
          </h2>
          <form
            onSubmit={tenantForm.handleSubmit(handleAssignTenant)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...tenantForm.register("name", {
                    required: "Name is required",
                  })}
                  className="input"
                />
                {tenantForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-danger-600">
                    {tenantForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...tenantForm.register("phone", {
                    required: "Phone is required",
                  })}
                  className="input"
                />
                {tenantForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-danger-600">
                    {tenantForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National ID
                </label>
                <input
                  type="text"
                  {...tenantForm.register("national_id")}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move-in Date *
                </label>
                <input
                  type="date"
                  {...tenantForm.register("move_in_date", {
                    required: "Move-in date is required",
                  })}
                  className="input"
                />
                {tenantForm.formState.errors.move_in_date && (
                  <p className="mt-1 text-sm text-danger-600">
                    {tenantForm.formState.errors.move_in_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...tenantForm.register("monthly_rent", {
                    required: "Monthly rent is required",
                    min: { value: 0, message: "Rent must be positive" },
                  })}
                  className="input"
                />
                {tenantForm.formState.errors.monthly_rent && (
                  <p className="mt-1 text-sm text-danger-600">
                    {tenantForm.formState.errors.monthly_rent.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...tenantForm.register("notes")}
                  className="input"
                  rows="2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowTenantForm(false);
                  tenantForm.reset();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Assign Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rent Payment History */}
      {unit.tenant && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Rent Payment History
            </h2>
            <button
              onClick={() => {
                // Find current month's rent log
                const currentMonth = format(new Date(), "yyyy-MM");
                const currentRentLog = unit.rent_logs?.find(
                  (log) => log.month === currentMonth
                );
                if (currentRentLog) {
                  setSelectedRentLog(currentRentLog);
                  paymentForm.setValue(
                    "amount",
                    currentRentLog.amount_due - currentRentLog.amount_paid
                  );
                  setShowPaymentForm(true);
                }
              }}
              className="btn btn-success"
              disabled={!unit.rent_logs?.length}
            >
              Record Payment
            </button>
          </div>

          {unit.rent_logs?.length === 0 ? (
            <div className="text-center py-12">
              <HiDocumentText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No payment history
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Record the first payment for this tenant
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
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unit.rent_logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {format(new Date(log.month + "-01"), "MMM yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(log.due_date), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₹{parseFloat(log.amount_due).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₹{parseFloat(log.amount_paid).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            log.amount_due - log.amount_paid > 0
                              ? "text-danger-600"
                              : "text-success-600"
                          }`}
                        >
                          ₹{(log.amount_due - log.amount_paid).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <span
                            className={`ml-2 badge ${getStatusColor(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {log.amount_due - log.amount_paid > 0 && (
                          <button
                            onClick={() => {
                              setSelectedRentLog(log);
                              paymentForm.setValue(
                                "amount",
                                log.amount_due - log.amount_paid
                              );
                              setShowPaymentForm(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Form */}
      {showPaymentForm && selectedRentLog && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Record Payment -{" "}
            {format(new Date(selectedRentLog.month + "-01"), "MMM yyyy")}
          </h2>
          <form
            onSubmit={paymentForm.handleSubmit(handleMakePayment)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...paymentForm.register("amount", {
                    required: "Amount is required",
                    min: {
                      value: 0.01,
                      message: "Amount must be greater than 0",
                    },
                    max: {
                      value:
                        selectedRentLog.amount_due -
                        selectedRentLog.amount_paid,
                      message: "Amount cannot exceed balance",
                    },
                  })}
                  className="input"
                />
                {paymentForm.formState.errors.amount && (
                  <p className="mt-1 text-sm text-danger-600">
                    {paymentForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  {...paymentForm.register("payment_method")}
                  className="input"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                {...paymentForm.register("note")}
                className="input"
                rows="3"
                placeholder="Optional payment note"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentForm(false);
                  setSelectedRentLog(null);
                  paymentForm.reset();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Previous Tenants */}
      {unit.previous_tenants?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Previous Tenants
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Move-in Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Move-out Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Rent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unit.previous_tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tenant.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tenant.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(tenant.move_in_date), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tenant.move_out_date
                          ? format(
                              new Date(tenant.move_out_date),
                              "MMM dd, yyyy"
                            )
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ₹{parseFloat(tenant.monthly_rent).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitDetails;
