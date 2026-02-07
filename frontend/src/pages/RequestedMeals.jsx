import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function RequestedMeals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, completed

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

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      completed: 'bg-green-100 text-green-800 border border-green-300',
      cancelled: 'bg-red-100 text-red-800 border border-red-300',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const getPaymentBadge = (status) => {
    const statusStyles = {
      paid: 'bg-green-100 text-green-800 border border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
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
    if (filter === 'pending') return meal.mealStatus === 'pending';
    if (filter === 'completed') return meal.mealStatus === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 opacity-100"></div>
        <div className="relative px-8 py-12 text-white">
          <h1 className="text-4xl font-bold mb-2">Your Meal Requests</h1>
          <p className="text-blue-100">View all your prasadam bookings and their status</p>
        </div>
      </div>

      {/* Navigation Back */}
      <div className="flex items-center gap-3">
        <Link 
          to="/user" 
          className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-medium hover:bg-slate-300 transition inline-flex items-center gap-2"
        >
          ← Back to Booking
        </Link>
      </div>

      {/* Filter Tabs */}
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
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white shadow-md'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Pending ({meals.filter(m => m.mealStatus === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'completed'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Completed ({meals.filter(m => m.mealStatus === 'completed').length})
        </button>
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
          <div className="text-4xl mb-3">🍽️</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No meals found</h3>
          <p className="text-slate-500 mb-6">
            {filter === 'all' 
              ? 'You haven\'t requested any meals yet. Create your first booking!'
              : `No ${filter} meals at the moment.`}
          </p>
          <Link 
            to="/user" 
            className="inline-block px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Create Booking
          </Link>
        </div>
      )}

      {/* Meals Grid */}
      {!loading && filteredMeals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMeals.map((meal) => (
            <div 
              key={meal._id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className="h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
              
              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Date and Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Meal Date</p>
                    <p className="text-lg font-bold text-slate-900">{formatDate(meal.date)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(meal.mealStatus)}`}>
                      {meal.mealStatus?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* User Details */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{meal.userName}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    📱 <span className="font-mono">{meal.userPhone}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    🏛️ {meal.userTemple}
                  </p>
                </div>

                {/* Meal Details */}
                <div className="space-y-3">
                  {/* Category */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Category</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      meal.category === 'IOS' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}>
                      {meal.category}
                    </span>
                  </div>

                  {/* Prasadam Details */}
                  <div className="border-t border-slate-200 pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">9:00 AM Prasadam</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {meal.morningPrasadam || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">4:30 PM Prasadam</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {meal.eveningPrasadam || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill and Payment */}
                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 space-y-3 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 font-medium">Bill Amount</span>
                    <span className="text-xl font-bold text-slate-900">₹{meal.billAmount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 font-medium">Payment Status</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentBadge(meal.paymentStatus)}`}>
                      {meal.paymentStatus?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Booking Date */}
                <div className="text-xs text-slate-400 text-right">
                  Booked on {formatDate(meal.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadMeals}
          className="px-6 py-2 rounded-lg bg-slate-200 text-slate-800 font-medium hover:bg-slate-300 transition"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
