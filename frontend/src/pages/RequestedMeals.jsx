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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Filter meals
  let filteredMeals = meals.filter(meal => {
    if (filter !== 'all' && meal.mealStatus !== filter) return false;
    if (searchName && !meal.userName.toLowerCase().includes(searchName.toLowerCase())) return false;
    
    const mealDate = new Date(meal.date);
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (mealDate < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      if (mealDate > toDate) return false;
    }
    
    return true;
  });

  // Calculate summary
  const summary = {
    morning: filteredMeals.reduce((sum, m) => sum + (m.morningPrasadam || 0), 0),
    evening: filteredMeals.reduce((sum, m) => sum + (m.eveningPrasadam || 0), 0),
    total: filteredMeals.reduce((sum, m) => sum + (m.billAmount || 0), 0)
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'requested': return 'text-yellow-600 font-semibold';
      case 'approved': return 'text-green-600 font-semibold';
      case 'rejected': return 'text-red-600 font-semibold';
      default: return 'text-slate-600';
    }
  };

  const getPaymentColor = (status) => {
    switch(status) {
      case 'paid': return 'text-green-600 font-semibold';
      case 'pending': return 'text-yellow-600 font-semibold';
      case 'payment-approved': return 'text-blue-600 font-semibold';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">📋 Your Prasadam Requests</h1>
            <p className="text-slate-600 mt-1">View and manage all your meal bookings</p>
          </div>
          <Link 
            to="/user" 
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            + New Request
          </Link>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
              <input
                type="text"
                placeholder="User name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setSearchName('');
                  setFilter('all');
                }}
                className="w-full px-4 py-2 rounded-lg bg-slate-300 text-slate-800 font-medium hover:bg-slate-400 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Table Section */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-emerald-500">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 border-r">Date</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 border-r">Name</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 border-r">Phone</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 border-r">Department</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 border-r">Category</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 border-r">9:00 AM Prasadam</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 border-r">4:30 PM Prasadam</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-700 border-r w-20">Amount</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 border-r">Meal Status</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeals.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                        <p className="text-lg">No requests found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMeals.map((meal, idx) => (
                      <tr key={meal._id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition`}>
                        <td className="px-4 py-3 border-r text-slate-900 font-medium">{formatDate(meal.date)}</td>
                        <td className="px-4 py-3 border-r text-slate-900">{meal.userName}</td>
                        <td className="px-4 py-3 border-r text-slate-700 font-mono text-xs">{meal.userPhone}</td>
                        <td className="px-4 py-3 border-r text-slate-700">{meal.userTemple}</td>
                        <td className="px-4 py-3 border-r text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            meal.category === 'IOS' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {meal.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-r text-center font-bold text-blue-600">{meal.morningPrasadam || 0}</td>
                        <td className="px-4 py-3 border-r text-center font-bold text-emerald-600">{meal.eveningPrasadam || 0}</td>
                        <td className="px-4 py-3 border-r text-right font-bold text-slate-900">₹{meal.billAmount || 0}</td>
                        <td className={`px-4 py-3 border-r font-semibold ${getStatusColor(meal.mealStatus)}`}>
                          {meal.mealStatus?.toUpperCase()}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${getPaymentColor(meal.paymentStatus)}`}>
                          {meal.paymentStatus?.toUpperCase()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Row */}
            {filteredMeals.length > 0 && (
              <div className="bg-gradient-to-r from-slate-50 to-white border-t-2 border-slate-300 p-4">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Summary:</span>
                  <span className="flex gap-8">
                    <span>9:00 AM: <span className="text-blue-600">{summary.morning}</span></span>
                    <span>4:30 PM: <span className="text-emerald-600">{summary.evening}</span></span>
                    <span>Total Amount: <span className="text-slate-900">₹{summary.total}</span></span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={loadMeals}
            className="px-6 py-3 rounded-lg bg-slate-600 text-white font-medium hover:bg-slate-700 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
