import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminRequests() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadMeals();
  }, [dateFilter]);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meals/admin', {
        params: dateFilter ? { date: dateFilter } : {},
      });
      setMeals(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const updateMealStatus = async (mealId, status) => {
    try {
      await api.put(`/meals/${mealId}`, { mealStatus: status });
      await loadMeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const updatePaymentStatus = async (mealId, status) => {
    try {
      await api.put(`/meals/${mealId}`, { paymentStatus: status });
      await loadMeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment status');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredMeals = meals.filter((meal) => {
    if (filter === 'all') return true;
    return meal.mealStatus === filter;
  });

  const filterButtons = [
    { key: 'all', label: 'All', count: meals.length },
    { key: 'requested', label: 'Requested', count: meals.filter((m) => m.mealStatus === 'requested').length },
    { key: 'approved', label: 'Approved', count: meals.filter((m) => m.mealStatus === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: meals.filter((m) => m.mealStatus === 'rejected').length },
  ];

  const getFilterColor = (key) => {
    if (key === 'requested') return 'bg-amber-500';
    if (key === 'approved') return 'bg-emerald-500';
    if (key === 'rejected') return 'bg-red-500';
    return 'bg-saffron-500';
  };

  const getMealBadgeClass = (status) => {
    if (status === 'approved') return 'badge-success';
    if (status === 'rejected') return 'badge-danger';
    return 'badge-warning';
  };

  const getPaymentBadgeClass = (status) => {
    if (status === 'payment-approved') return 'badge-success';
    if (status === 'paid') return 'badge-info';
    return 'badge-warning';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">All Meal Requests</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review and manage all prasadam booking requests
        </p>
      </div>

      {/* Filters Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {filterButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === btn.key
                      ? `${getFilterColor(btn.key)} text-white shadow-sm`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                  <span
                    className={`ml-1.5 text-xs ${
                      filter === btn.key ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    {btn.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="!w-auto"
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="btn btn-secondary btn-sm mb-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-error">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <span className="spinner !w-8 !h-8"></span>
        </div>
      )}

      {/* Empty */}
      {!loading && filteredMeals.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-icon">📭</p>
            <p className="empty-state-title">No requests found</p>
            <p className="empty-state-text">
              {filter === 'all'
                ? 'No meal requests at the moment.'
                : `No ${filter} requests at the moment.`}
            </p>
          </div>
        </div>
      )}

      {/* Requests Table */}
      {!loading && filteredMeals.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Date</th>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th className="text-center">Category</th>
                  <th className="text-center">Morning</th>
                  <th className="text-center">Evening</th>
                  <th className="text-center">Bill</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeals.map((meal) => (
                  <tr key={meal._id}>
                    <td className="font-medium text-slate-800">{formatDate(meal.date)}</td>
                    <td className="text-slate-700">{meal.userName}</td>
                    <td className="text-slate-500 font-mono text-xs">{meal.userPhone}</td>
                    <td className="text-slate-600">{meal.userTemple}</td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          meal.category === 'IOS' ? 'badge-info' : 'badge-neutral'
                        }`}
                      >
                        {meal.category}
                      </span>
                    </td>
                    <td className="text-center font-semibold text-blue-600">
                      {meal.morningPrasadam || 0}
                    </td>
                    <td className="text-center font-semibold text-emerald-600">
                      {meal.eveningPrasadam || 0}
                    </td>
                    <td className="text-center font-semibold text-slate-800">
                      ₹{meal.billAmount || 0}
                    </td>
                    <td className="text-center">
                      <select
                        value={meal.mealStatus}
                        onChange={(e) => updateMealStatus(meal._id, e.target.value)}
                        className={`!w-auto !py-1 !px-2 !text-xs !font-semibold !rounded-full !border-0 cursor-pointer
                          ${getMealBadgeClass(meal.mealStatus) === 'badge-success' ? '!bg-emerald-50 !text-emerald-700' : ''}
                          ${getMealBadgeClass(meal.mealStatus) === 'badge-danger' ? '!bg-red-50 !text-red-700' : ''}
                          ${getMealBadgeClass(meal.mealStatus) === 'badge-warning' ? '!bg-amber-50 !text-amber-700' : ''}
                        `}
                      >
                        <option value="requested">Requested</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="text-center">
                      <select
                        value={meal.paymentStatus}
                        onChange={(e) => updatePaymentStatus(meal._id, e.target.value)}
                        className={`!w-auto !py-1 !px-2 !text-xs !font-semibold !rounded-full !border-0 cursor-pointer
                          ${getPaymentBadgeClass(meal.paymentStatus) === 'badge-success' ? '!bg-emerald-50 !text-emerald-700' : ''}
                          ${getPaymentBadgeClass(meal.paymentStatus) === 'badge-info' ? '!bg-blue-50 !text-blue-700' : ''}
                          ${getPaymentBadgeClass(meal.paymentStatus) === 'badge-warning' ? '!bg-amber-50 !text-amber-700' : ''}
                        `}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="payment-approved">Approved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refresh */}
      {!loading && (
        <div className="flex justify-center">
          <button onClick={loadMeals} className="btn btn-secondary">
            ↻ Refresh
          </button>
        </div>
      )}
    </div>
  );
}
