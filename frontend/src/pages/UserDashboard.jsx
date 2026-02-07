import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function UserDashboard() {
  const [rates, setRates] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [error, setError] = useState('');
  const [meals, setMeals] = useState([]);
  const [form, setForm] = useState({ 
    name: '',
    userPhone: '',
    userTemple: '',
    breakfast: 0, 
    lunch: 0, 
    dinner: 0,
    category: 'IOS',
    fromDate: '',
    toDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [editForm, setEditForm] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [dateRangeDisplay, setDateRangeDisplay] = useState([]);

  const loadRates = async () => {
    try {
      const res = await api.get('/settings');
      setRates(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rates');
    } finally {
      setLoadingRates(false);
    }
  };

  const loadMine = async () => {
    try {
      const res = await api.get('/meals/mine');
      setMeals(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your requests');
    }
  };

  useEffect(() => {
    loadRates();
    loadMine();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: (name === 'breakfast' || name === 'lunch' || name === 'dinner') ? Number(value) : value 
    }));
  };

  // Generate date range display
  const generateDateRange = (from, to) => {
    if (!from || !to) return [];
    const dates = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      dates.push({
        date: dateStr,
        morning: `${dateStr} - 9:00 AM Prasadam`,
        evening: `${dateStr} - 4:30 PM Prasadam`
      });
    }
    return dates;
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    
    if ((name === 'fromDate' || name === 'toDate') && form.fromDate && form.toDate) {
      const fromDate = name === 'fromDate' ? value : form.fromDate;
      const toDate = name === 'toDate' ? value : form.toDate;
      if (fromDate && toDate) {
        setDateRangeDisplay(generateDateRange(fromDate, toDate));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.name || !form.userPhone || !form.userTemple) {
      setError('Please fill in name, phone, and temple/department');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/meals', {
        name: form.name,
        userPhone: form.userPhone,
        userTemple: form.userTemple,
        breakfast: form.breakfast,
        lunch: form.lunch,
        dinner: form.dinner,
        category: form.category,
        fromDate: form.fromDate,
        toDate: form.toDate
      });
      setForm({ 
        name: '',
        userPhone: '',
        userTemple: '',
        breakfast: 0, 
        lunch: 0, 
        dinner: 0,
        category: 'IOS',
        fromDate: '',
        toDate: ''
      });
      setDateRangeDisplay([]);
      await loadMine();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit meal request');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (meal) => {
    setEditingMeal(meal);
    setEditForm({ breakfast: meal.breakfast, lunch: meal.lunch, dinner: meal.dinner });
  };

  const closeEditModal = () => {
    setEditingMeal(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: Number(value) }));
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/meals/${editingMeal._id}`, editForm);
      await loadMine();
      closeEditModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit request');
    }
  };

  const handleMarkPaid = async (meal) => {
    if (!window.confirm('Mark this request as paid?')) return;
    try {
      await api.post(`/meals/${meal._id}/mark-paid`);
      await loadMine();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payment');
    }
  };

  const calculateCost = () => {
    if (!rates) return 0;
    // breakfast + lunch -> 9:00 AM prasadam (morningRate)
    // dinner -> 4:30 PM prasadam (eveningRate)
    const morning = rates.morningRate || 0;
    const evening = rates.eveningRate || 0;
    const dayCost = (form.breakfast + form.lunch) * morning + form.dinner * evening;
    
    // If date range is selected, multiply by number of days
    if (form.fromDate && form.toDate) {
      const fromDate = new Date(form.fromDate);
      const toDate = new Date(form.toDate);
      const days = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
      return dayCost * days;
    }
    return dayCost;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">🍽️ My Meal Requests</h1>
        <p className="text-slate-500 mt-1">Submit and manage your daily meal requests</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit New Request Card */}
      <section className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">📝 Submit Meal Request</h2>
        {loadingRates ? (
          <div className="flex items-center gap-2 text-slate-500">
            <span className="spinner"></span> Loading rates...
          </div>
        ) : !rates ? (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <p className="text-sm text-orange-700">⚠️ Rates not yet configured by admin</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-slate-700">
              <strong>Current Prasadam Rates:</strong><br />
              ⏰ 9:00 AM: ₹{rates.morningRate} | ⏰ 4:30 PM: ₹{rates.eveningRate}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Info Section */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3">👤 Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="userPhone"
                      placeholder="10-digit number"
                      value={form.userPhone}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Temple/Department</label>
                    <input
                      type="text"
                      name="userTemple"
                      placeholder="e.g., Main Hall"
                      value={form.userTemple}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Date Range Section */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3">📅 Booking Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                    <input
                      type="date"
                      name="fromDate"
                      value={form.fromDate}
                      onChange={handleDateChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                    <input
                      type="date"
                      name="toDate"
                      value={form.toDate}
                      onChange={handleDateChange}
                      min={form.fromDate}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category Section */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3">🏷️ Prasadam Category</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value="IOS"
                      checked={form.category === 'IOS'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">Individual (IOS)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value="COMMUNITY"
                      checked={form.category === 'COMMUNITY'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">Community</span>
                  </label>
                </div>
              </div>

              {/* Meal Count Section */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3">🍽️ Daily Meal Count</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">🥐 Breakfast</label>
                    <input
                      type="number"
                      min="0"
                      name="breakfast"
                      value={form.breakfast}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">🍛 Lunch</label>
                    <input
                      type="number"
                      min="0"
                      name="lunch"
                      value={form.lunch}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">🍲 Dinner</label>
                    <input
                      type="number"
                      min="0"
                      name="dinner"
                      value={form.dinner}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range Display */}
              {dateRangeDisplay.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-slate-800 mb-2">📋 Prasadam Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {dateRangeDisplay.map((item, idx) => (
                      <div key={idx} className="text-sm text-slate-700">
                        <div>✓ {item.morning}</div>
                        <div>✓ {item.evening}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg">
                <span className="font-semibold text-slate-800">Total Cost:</span>
                <span className="text-2xl font-bold text-blue-600">₹{calculateCost()}</span>
              </div>

              <button
                type="submit"
                disabled={submitting || (form.breakfast + form.lunch + form.dinner === 0) || !form.fromDate || !form.toDate}
                className="w-full py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? '⏳ Submitting...' : '✓ Submit Request'}
              </button>
            </form>
          </>
        )}
      </section>

      {/* Recent Requests */}
      <section className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">📊 Recent Requests</h2>
        {meals.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-500">No meal requests yet. Submit your first request above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((m) => {
              const editable = m.editingAllowed;
              const canMarkPaid = m.paymentStatus !== 'payment-approved';
              const statusColor = m.mealStatus === 'completed' ? 'bg-green-50' : 'bg-yellow-50';
              const payColor = m.paymentStatus === 'payment-approved' ? 'bg-green-50' : 'bg-orange-50';
              
              return (
                <div key={m._id} className={`p-4 rounded-lg border ${statusColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">{m.date}</p>
                      <p className="text-sm text-slate-500">Total: ₹{m.billAmount}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${m.mealStatus === 'completed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                        {m.mealStatus}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${m.paymentStatus === 'payment-approved' ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                        {m.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                    <div className="bg-white p-2 rounded">🥐 {m.breakfast}</div>
                    <div className="bg-white p-2 rounded">🍛 {m.lunch}</div>
                    <div className="bg-white p-2 rounded">🍲 {m.dinner}</div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      disabled={!editable}
                      onClick={() => openEditModal(m)}
                      className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      disabled={!canMarkPaid}
                      onClick={() => handleMarkPaid(m)}
                      className="px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ✓ Mark Paid
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingMeal}
        title="✏️ Edit Meal Request"
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        submitText="Update"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">🥐 Breakfast</label>
            <input
              type="number"
              min="0"
              name="breakfast"
              value={editForm.breakfast}
              onChange={handleEditChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">🍛 Lunch</label>
            <input
              type="number"
              min="0"
              name="lunch"
              value={editForm.lunch}
              onChange={handleEditChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">🍲 Dinner</label>
            <input
              type="number"
              min="0"
              name="dinner"
              value={editForm.dinner}
              onChange={handleEditChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

