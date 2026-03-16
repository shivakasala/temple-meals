import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function DailySummary() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, reportRes] = await Promise.all([
        api.get('/meals/admin-summary', { params: { date } }),
        api.get('/meals/admin-report', { params: { date } }),
      ]);
      setSummary(summaryRes.data);
      setItems(reportRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load daily summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) loadData();
  }, [date]);

  const dayTotals = summary?.daily?.[0] || {};
  const totalMorning = dayTotals.totalMorning || 0;
  const totalEvening = dayTotals.totalEvening || 0;
  const totalAmount = dayTotals.totalAmount || 0;
  const totalCollected = summary?.totalCollected || 0;

  const approvedItems = items.filter((m) => m.mealStatus === 'approved');
  const pendingItems = items.filter((m) => m.mealStatus === 'requested');
  const rejectedItems = items.filter((m) => m.mealStatus === 'rejected');

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryLabel = (cat) => (cat === 'IOS' ? 'IYS' : cat);

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

  const navigateDay = (offset) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDate(`${y}-${m}-${day}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daily Summary</h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of all prasadam bookings for a single day
        </p>
      </div>

      {/* Date Picker */}
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigateDay(-1)}
            className="btn btn-secondary btn-sm"
          >
            &larr; Previous
          </button>
          <div className="text-center flex-1">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="!w-auto !text-center"
            />
            <p className="text-sm text-slate-500 mt-1">{formatDate(date)}</p>
          </div>
          <button
            onClick={() => navigateDay(1)}
            className="btn btn-secondary btn-sm"
          >
            Next &rarr;
          </button>
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

      {!loading && (
        <>
          {/* Totals Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card !p-5">
              <p className="stat-label">Morning Prasadam</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalMorning}</p>
              <p className="text-xs text-slate-400 mt-0.5">9:00 AM servings</p>
            </div>
            <div className="card !p-5">
              <p className="stat-label">Evening Prasadam</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalEvening}</p>
              <p className="text-xs text-slate-400 mt-0.5">4:30 PM servings</p>
            </div>
            <div className="card !p-5">
              <p className="stat-label">Total Bill</p>
              <p className="text-2xl font-bold text-saffron-600 mt-1">&#8377;{totalAmount}</p>
              <p className="text-xs text-slate-400 mt-0.5">All bookings</p>
            </div>
            <div className="card !p-5">
              <p className="stat-label">Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-1">&#8377;{totalCollected}</p>
              <p className="text-xs text-slate-400 mt-0.5">Payment approved</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card !p-4 text-center">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">{approvedItems.length}</p>
            </div>
            <div className="card !p-4 text-center">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{pendingItems.length}</p>
            </div>
            <div className="card !p-4 text-center">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Rejected</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{rejectedItems.length}</p>
            </div>
          </div>

          {/* User-wise Breakdown */}
          {items.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p className="empty-state-icon">📋</p>
                <p className="empty-state-title">No bookings</p>
                <p className="empty-state-text">No prasadam bookings found for this date.</p>
              </div>
            </div>
          ) : (
            <div className="card !p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-800">
                  Booking Details
                  <span className="ml-1.5 text-sm font-normal text-slate-400">({items.length})</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th>#</th>
                      <th>Name</th>
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
                    {items.map((meal, idx) => (
                      <tr key={meal._id}>
                        <td className="text-slate-400 text-xs">{idx + 1}</td>
                        <td className="font-medium text-slate-800">{meal.userName}</td>
                        <td className="text-slate-500 font-mono text-xs">{meal.userPhone}</td>
                        <td className="text-slate-600">{meal.userTemple}</td>
                        <td className="text-center">
                          <span className={`badge ${meal.category === 'IOS' ? 'badge-info' : 'badge-neutral'}`}>
                            {getCategoryLabel(meal.category)}
                          </span>
                        </td>
                        <td className="text-center font-semibold text-blue-600">
                          {meal.morningPrasadam || 0}
                        </td>
                        <td className="text-center font-semibold text-emerald-600">
                          {meal.eveningPrasadam || 0}
                        </td>
                        <td className="text-center font-semibold text-slate-800">
                          &#8377;{meal.billAmount || 0}
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
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan="5" className="text-right text-slate-600">Totals</td>
                      <td className="text-center text-blue-700">{totalMorning}</td>
                      <td className="text-center text-emerald-700">{totalEvening}</td>
                      <td className="text-center text-saffron-700">&#8377;{totalAmount}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
