import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function RequestedMeals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meals/mine');
      setMeals(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter meals
  const filteredMeals = meals.filter((meal) => {
    if (filter !== 'all' && meal.mealStatus !== filter) return false;
    if (searchName && !meal.userName.toLowerCase().includes(searchName.toLowerCase())) return false;
    const mealDate = new Date(meal.date);
    if (dateFrom && mealDate < new Date(dateFrom)) return false;
    if (dateTo && mealDate > new Date(dateTo)) return false;
    return true;
  });

  // Calculate summary
  const summary = {
    morning: filteredMeals.reduce((sum, m) => sum + (m.morningPrasadam || 0), 0),
    evening: filteredMeals.reduce((sum, m) => sum + (m.eveningPrasadam || 0), 0),
    total: filteredMeals.reduce((sum, m) => sum + (m.billAmount || 0), 0),
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

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSearchName('');
    setFilter('all');
  };

  const hasActiveFilters = dateFrom || dateTo || searchName || filter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Your Prasadam Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">View and manage all your meal bookings</p>
        </div>
        <Link to="/user" className="btn btn-primary no-underline hover:no-underline shrink-0">
          + New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              type="text"
              placeholder="Search by name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-secondary w-full">
                Clear Filters
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

      {/* Table */}
      {!loading && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Date</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th className="text-center">Category</th>
                  <th className="text-center">9:00 AM</th>
                  <th className="text-center">4:30 PM</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeals.length === 0 ? (
                  <tr>
                    <td colSpan="10">
                      <div className="empty-state">
                        <p className="empty-state-icon">📭</p>
                        <p className="empty-state-title">No requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMeals.map((meal) => (
                    <tr key={meal._id}>
                      <td className="font-medium text-slate-800 whitespace-nowrap">
                        {formatDate(meal.date)}
                      </td>
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
                      <td className="text-right font-semibold text-slate-800">
                        ₹{meal.billAmount || 0}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${getMealBadgeClass(meal.mealStatus)}`}>
                          {meal.mealStatus}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${getPaymentBadgeClass(meal.paymentStatus)}`}>
                          {meal.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredMeals.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">
                  {filteredMeals.length} request{filteredMeals.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-6 text-slate-600">
                  <span>
                    9:00 AM: <span className="font-bold text-blue-600">{summary.morning}</span>
                  </span>
                  <span>
                    4:30 PM: <span className="font-bold text-emerald-600">{summary.evening}</span>
                  </span>
                  <span>
                    Total: <span className="font-bold text-slate-800">₹{summary.total}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
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
