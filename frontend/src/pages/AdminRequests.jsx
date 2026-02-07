import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminRequests() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, requested, approved, rejected
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadMeals();
  }, [dateFilter]);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meals/admin', {
        params: dateFilter ? { date: dateFilter } : {}
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

  const getStatusBadge = (status) => {
    const statusStyles = {
      requested: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      approved: 'bg-green-100 text-green-800 border border-green-300',
      rejected: 'bg-red-100 text-red-800 border border-red-300',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const getPaymentBadge = (status) => {
    const statusStyles = {
      paid: 'bg-green-100 text-green-800 border border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      'payment-approved': 'bg-blue-100 text-blue-800 border border-blue-300',
      failed: 'bg-red-100 text-red-800 border border-red-300',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredMeals = meals.filter(meal => {
    if (filter === 'all') return true;
    return meal.mealStatus === filter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-100"></div>
        <div className="relative px-8 py-12 text-white">
          <h1 className="text-4xl font-bold mb-2">All Meal Requests</h1>
          <p className="text-purple-100">Review and manage all prasadam booking requests</p>
        </div>
      </div>

      {/* Navigation Back */}
      <div className="flex items-center gap-3">
        <Link 
          to="/admin" 
          className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-medium hover:bg-slate-300 transition inline-flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Status</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                All ({meals.length})
              </button>
              <button
                onClick={() => setFilter('requested')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'requested'
                    ? 'bg-yellow-600 text-white shadow-md'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Requested ({meals.filter(m => m.mealStatus === 'requested').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'approved'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Approved ({meals.filter(m => m.mealStatus === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'rejected'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Rejected ({meals.filter(m => m.mealStatus === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 transition font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMeals.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No requests found</h3>
          <p className="text-slate-500">
            {filter === 'all' 
              ? 'No meal requests at the moment.'
              : `No ${filter} requests at the moment.`}
          </p>
        </div>
      )}

      {/* Requests Table */}
      {!loading && filteredMeals.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">User</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Phone</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Department</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">Category</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">Morning</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">Evening</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">Bill</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-700">Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeals.map((meal, idx) => (
                  <tr key={meal._id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition`}>
                    <td className="px-6 py-4 font-medium text-slate-900">{formatDate(meal.date)}</td>
                    <td className="px-6 py-4 text-slate-700">{meal.userName}</td>
                    <td className="px-6 py-4 text-slate-700 font-mono text-xs">{meal.userPhone}</td>
                    <td className="px-6 py-4 text-slate-700">{meal.userTemple}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${
                        meal.category === 'IOS' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {meal.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-blue-600">{meal.morningPrasadam || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-emerald-600">{meal.eveningPrasadam || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-900">₹{meal.billAmount || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={meal.mealStatus}
                        onChange={(e) => updateMealStatus(meal._id, e.target.value)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getStatusBadge(meal.mealStatus)}`}
                      >
                        <option value="requested">Requested</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={meal.paymentStatus}
                        onChange={(e) => updatePaymentStatus(meal._id, e.target.value)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getPaymentBadge(meal.paymentStatus)}`}
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

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadMeals}
          className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
