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

  const getDerivedStatus = (statuses) => {
    if (!statuses.length) return 'pending';
    const unique = [...new Set(statuses)];
    if (unique.length === 1) return unique[0];
    return 'mixed';
  };

  const requestGroups = Object.values(
    meals.reduce((acc, meal) => {
      const fromDateValue = meal.fromDate || meal.date;
      const toDateValue = meal.toDate || meal.date;
      const key = [
        fromDateValue,
        toDateValue,
        meal.userName || '',
        meal.userPhone || '',
        meal.userTemple || '',
        meal.category || '',
      ].join('|');

      if (!acc[key]) {
        acc[key] = {
          _id: key,
          fromDate: fromDateValue,
          toDate: toDateValue,
          userName: meal.userName,
          userPhone: meal.userPhone,
          userTemple: meal.userTemple,
          category: meal.category,
          totalMorningPrasadam: 0,
          totalEveningPrasadam: 0,
          totalBillAmount: 0,
          mealStatuses: [],
          paymentStatuses: [],
          requestCount: 0,
        };
      }

      acc[key].totalMorningPrasadam += meal.morningPrasadam || 0;
      acc[key].totalEveningPrasadam += meal.eveningPrasadam || 0;
      acc[key].totalBillAmount += meal.billAmount || 0;
      acc[key].mealStatuses.push(meal.mealStatus);
      acc[key].paymentStatuses.push(meal.paymentStatus);
      acc[key].requestCount += 1;

      return acc;
    }, {})
  ).map((group) => ({
    ...group,
    mealStatus: getDerivedStatus(group.mealStatuses),
    paymentStatus: getDerivedStatus(group.paymentStatuses),
  }));

  // Filter grouped requests
  const filteredRequests = requestGroups.filter((request) => {
    const matchesStatus =
      filter === 'all' || request.mealStatus === filter || request.mealStatuses.includes(filter);
    if (!matchesStatus) return false;

    if (
      searchName &&
      !(request.userName || '').toLowerCase().includes(searchName.toLowerCase())
    ) {
      return false;
    }

    const requestFrom = new Date(request.fromDate);
    const requestTo = new Date(request.toDate);

    if (dateFrom && requestTo < new Date(dateFrom)) return false;
    if (dateTo && requestFrom > new Date(dateTo)) return false;
    return true;
  });

  // Calculate summary
  const summary = {
    morning: filteredRequests.reduce((sum, r) => sum + (r.totalMorningPrasadam || 0), 0),
    evening: filteredRequests.reduce((sum, r) => sum + (r.totalEveningPrasadam || 0), 0),
    total: filteredRequests.reduce((sum, r) => sum + (r.totalBillAmount || 0), 0),
  };

  const getMealBadgeClass = (status) => {
    if (status === 'approved') return 'badge-success';
    if (status === 'rejected') return 'badge-danger';
    if (status === 'mixed') return 'badge-neutral';
    return 'badge-warning';
  };

  const getPaymentBadgeClass = (status) => {
    if (status === 'payment-approved') return 'badge-success';
    if (status === 'paid') return 'badge-info';
    if (status === 'mixed') return 'badge-neutral';
    return 'badge-warning';
  };

  const getCategoryLabel = (category) => (category === 'IOS' ? 'IYS' : category);

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
                  <th>From</th>
                  <th>To</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th className="text-center">Category</th>
                  <th className="text-center">Total 9:00 AM</th>
                  <th className="text-center">Total 4:30 PM</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="10">
                      <div className="empty-state">
                        <p className="empty-state-icon">📭</p>
                        <p className="empty-state-title">No requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="font-medium text-slate-800 whitespace-nowrap">
                        {formatDate(request.fromDate)}
                      </td>
                      <td className="font-medium text-slate-800 whitespace-nowrap">
                        {formatDate(request.toDate)}
                      </td>
                      <td className="text-slate-700">{request.userName}</td>
                      <td className="text-slate-500 font-mono text-xs">{request.userPhone}</td>
                      <td className="text-slate-600">{request.userTemple}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            request.category === 'IOS' ? 'badge-info' : 'badge-neutral'
                          }`}
                        >
                          {getCategoryLabel(request.category)}
                        </span>
                      </td>
                      <td className="text-center font-semibold text-blue-600">
                        {request.totalMorningPrasadam || 0}
                      </td>
                      <td className="text-center font-semibold text-emerald-600">
                        {request.totalEveningPrasadam || 0}
                      </td>
                      <td className="text-right font-semibold text-slate-800">
                        ₹{request.totalBillAmount || 0}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${getMealBadgeClass(request.mealStatus)}`}>
                          {request.mealStatus}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${getPaymentBadgeClass(request.paymentStatus)}`}>
                          {request.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredRequests.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">
                  {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
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
