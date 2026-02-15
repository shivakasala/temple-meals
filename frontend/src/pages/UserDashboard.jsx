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
    numDevotees: 1,
    category: 'IOS',
    fromDate: '',
    toDate: '',
    dayQuantities: {},
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [editForm, setEditForm] = useState({ morningPrasadam: 0, eveningPrasadam: 0 });
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
    // Initialize dateRangeDisplay with only next day
    const nextDay = getTomorrowDateString();
    setDateRangeDisplay([{ date: nextDay }]);
    setForm((f) => ({
      ...f,
      fromDate: nextDay,
      toDate: nextDay,
      dayQuantities: { [nextDay]: { morning: 0, evening: 0 } }
    }));
  }, []);

  // Check if it's past 4 PM in local time
  const isPastBookingCutoff = () => {
    const now = new Date();
    try {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata', // temple timezone
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = fmt.formatToParts(now);
      const get = (type) => parts.find((p) => p.type === type)?.value;
      const hour = Number(get('hour'));
      const minute = Number(get('minute'));
      // 4 PM = 16:00
      return hour > 16 || (hour === 16 && minute > 0);
    } catch {
      // Fallback: treat cutoff as 10:30 UTC (16:00 IST)
      const utcHour = now.getUTCHours();
      const utcMinute = now.getUTCMinutes();
      return utcHour > 10 || (utcHour === 10 && utcMinute > 30);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone input: only allow digits, limit to 10
    if (name === 'userPhone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm((f) => ({ ...f, [name]: digitsOnly }));
      return;
    }

    setForm((f) => ({
      ...f,
      [name]:
        name === 'morningPrasadam' || name === 'eveningPrasadam' || name === 'numDevotees'
          ? Number(value)
          : value,
    }));
  };

  // Get tomorrow's date as minimum/maximum (next-day-only booking)
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toggleMeal = (date, mealType) => {
    const currentValue = form.dayQuantities[date]?.[mealType] || 0;
    setForm((f) => ({
      ...f,
      dayQuantities: {
        ...f.dayQuantities,
        [date]: { ...f.dayQuantities[date], [mealType]: currentValue > 0 ? 0 : 1 },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check 4 PM cutoff
    if (isPastBookingCutoff()) {
      setError('Bookings are closed after 4:00 PM. Next day booking window will open tomorrow after 4:00 PM.');
      return;
    }

    if (!form.name || !form.userPhone || !form.userTemple) {
      setError('Please fill in name, phone, and temple/department');
      return;
    }

    // Validate phone: must be exactly 10 digits and start with 6, 7, 8, or 9
    if (form.userPhone.length !== 10 || !/^\d{10}$/.test(form.userPhone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (!/^[6789]/.test(form.userPhone)) {
      setError('Phone number must start with 6, 7, 8, or 9 (valid Indian mobile number)');
      return;
    }

    const hasMeals = Object.values(form.dayQuantities || {}).some(
      (day) => (day?.morning || 0) > 0 || (day?.evening || 0) > 0
    );
    if (!hasMeals) {
      setError('Please select at least one meal');
      return;
    }

    setSubmitting(true);
    try {
      const morningRate = rates.morningRate || 0;
      const eveningRate = rates.eveningRate || 0;
      const numDevotees = form.numDevotees || 1;
      const nextDayDate = getTomorrowDateString();

      // Single record for next day only
      const quantities = form.dayQuantities[nextDayDate] || { morning: 0, evening: 0 };
      const morningCount = quantities.morning || 0;
      const eveningCount = quantities.evening || 0;

      const dailyBillAmount =
        (morningCount * morningRate + eveningCount * eveningRate) * numDevotees;

      const record = {
        name: form.name,
        userPhone: form.userPhone,
        userTemple: form.userTemple,
        morningPrasadam: morningCount * numDevotees,
        eveningPrasadam: eveningCount * numDevotees,
        category: form.category,
        date: nextDayDate,
        fromDate: nextDayDate,
        toDate: nextDayDate,
        billAmount: dailyBillAmount,
      };

      await api.post('/meals', record);

      setForm({
        name: '',
        userPhone: '',
        userTemple: '',
        numDevotees: 1,
        category: 'IOS',
        fromDate: '',
        toDate: '',
        dayQuantities: {},
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
    setEditForm({ morningPrasadam: meal.morningPrasadam, eveningPrasadam: meal.eveningPrasadam });
  };

  const closeEditModal = () => setEditingMeal(null);

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
    const morning = rates.morningRate || 0;
    const evening = rates.eveningRate || 0;
    const numDevotees = form.numDevotees || 1;
    let totalCost = 0;
    Object.values(form.dayQuantities || {}).forEach((day) => {
      totalCost += ((day?.morning || 0) * morning + (day?.evening || 0) * evening) * numDevotees;
    });
    return totalCost;
  };

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getMealBadgeClass = (status) => {
    if (status === 'approved' || status === 'completed') return 'badge-success';
    if (status === 'rejected') return 'badge-danger';
    return 'badge-warning';
  };

  const getPaymentBadgeClass = (status) => {
    if (status === 'payment-approved') return 'badge-success';
    if (status === 'paid') return 'badge-info';
    return 'badge-warning';
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Book Your Prasadam</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your daily meal requests with ease</p>
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

      {/* Booking Form Card */}
      <section className="card">
        <h2 className="section-title mb-5">New Booking</h2>

        {loadingRates ? (
          <div className="flex items-center justify-center py-12">
            <span className="spinner"></span>
            <span className="ml-3 text-sm text-slate-500">Loading rates…</span>
          </div>
        ) : !rates ? (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            Rates not yet configured by admin.
          </div>
        ) : (
          <>
            {/* Current Rates */}
            <div className="mb-6 p-4 bg-saffron-50 rounded-lg border border-saffron-100">
              <p className="text-xs font-semibold text-saffron-700 uppercase tracking-wider mb-2">
                Current Rates
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-saffron-600 mb-0.5">9:00 AM Prasadam</p>
                  <p className="text-xl font-bold text-saffron-800">₹{rates.morningRate}</p>
                </div>
                <div>
                  <p className="text-xs text-saffron-600 mb-0.5">4:30 PM Prasadam</p>
                  <p className="text-xl font-bold text-saffron-800">₹{rates.eveningRate}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Details */}
              <fieldset className="space-y-3">
                <legend className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <span className="w-5 h-5 rounded-full bg-saffron-500 text-white flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  Personal Details
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="userPhone"
                      placeholder="10 digits (start with 6,7,8,9)"
                      maxLength="10"
                      value={form.userPhone}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {form.userPhone.length}/10 digits
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      name="userTemple"
                      placeholder="e.g., Main Hall"
                      value={form.userTemple}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              {/* Step 2: Devotees */}
              <fieldset className="space-y-3">
                <legend className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <span className="w-5 h-5 rounded-full bg-saffron-500 text-white flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  Number of Devotees
                </legend>
                <div className="max-w-[200px]">
                  <input
                    type="number"
                    name="numDevotees"
                    min="1"
                    max="1000"
                    value={form.numDevotees}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Meal quantities are multiplied by this number
                  </p>
                </div>
              </fieldset>

              {/* Step 3: Next Day Booking */}
              <fieldset className="space-y-3">
                <legend className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <span className="w-5 h-5 rounded-full bg-saffron-500 text-white flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                  Booking (Next Day Only)
                </legend>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium">
                    📅 Bookings available until <strong>4:00 PM today</strong> for <strong>tomorrow's</strong> meal.
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    ⏰ After 4:00 PM, booking window closes and will reopen the next day.
                  </p>
                </div>
              </fieldset>

              {/* Step 4: Category */}
              <fieldset className="space-y-3">
                <legend className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <span className="w-5 h-5 rounded-full bg-saffron-500 text-white flex items-center justify-center text-[10px] font-bold">
                    4
                  </span>
                  Prasadam Category
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'IOS', label: 'Individual' },
                    { value: 'COMMUNITY', label: 'Community' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                        form.category === opt.value
                          ? 'border-saffron-400 bg-saffron-50 ring-1 ring-saffron-400'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={opt.value}
                        checked={form.category === opt.value}
                        onChange={handleChange}
                        className="w-4 h-4 text-saffron-500 accent-saffron-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Day-wise Meal Selection */}
              {dateRangeDisplay.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Select Meals for Each Day
                  </p>
                  <div className="space-y-2">
                    {dateRangeDisplay.map((item) => {
                      const date = item.date;
                      const morningChecked = (form.dayQuantities[date]?.morning || 0) > 0;
                      const eveningChecked = (form.dayQuantities[date]?.evening || 0) > 0;
                      return (
                        <div
                          key={date}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 border border-slate-100 rounded-lg bg-slate-50/50"
                        >
                          <span className="text-sm font-medium text-slate-700 sm:w-36 shrink-0">
                            {formatDisplayDate(date)}
                          </span>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={morningChecked}
                                onChange={() => toggleMeal(date, 'morning')}
                                className="w-4 h-4 rounded accent-saffron-500"
                              />
                              <span className="text-sm text-slate-600">9:00 AM</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={eveningChecked}
                                onChange={() => toggleMeal(date, 'evening')}
                                className="w-4 h-4 rounded accent-saffron-500"
                              />
                              <span className="text-sm text-slate-600">4:30 PM</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Total Cost */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Total Amount</span>
                <span className="text-2xl font-bold text-saffron-600">₹{calculateCost()}</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || calculateCost() === 0}
                className="w-full btn btn-primary !py-3 !text-base"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner !w-4 !h-4 !border-t-white !border-saffron-300"></span>
                    Processing…
                  </span>
                ) : (
                  'Confirm Booking for Tomorrow'
                )}
              </button>
            </form>
          </>
        )}
      </section>

      {/* Recent Requests */}
      <section className="card">
        <h2 className="section-title mb-4">Recent Requests</h2>
        {meals.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">📋</p>
            <p className="empty-state-text">
              No meal requests yet. Submit your first request above!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((m) => {
              const editable = m.editingAllowed;
              const canMarkPaid = m.paymentStatus !== 'payment-approved';

              return (
                <div key={m._id} className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{m.date}</p>
                      <p className="text-xs text-slate-400 mt-0.5">₹{m.billAmount}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`badge ${getMealBadgeClass(m.mealStatus)}`}>
                        {m.mealStatus}
                      </span>
                      <span className={`badge ${getPaymentBadgeClass(m.paymentStatus)}`}>
                        {m.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-blue-50/60 p-2.5 rounded-lg text-sm">
                      <span className="text-slate-500">9:00 AM:</span>{' '}
                      <span className="font-semibold text-blue-600">{m.morningPrasadam}</span>
                    </div>
                    <div className="bg-emerald-50/60 p-2.5 rounded-lg text-sm">
                      <span className="text-slate-500">4:30 PM:</span>{' '}
                      <span className="font-semibold text-emerald-600">{m.eveningPrasadam}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={!editable}
                      onClick={() => openEditModal(m)}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      disabled={!canMarkPaid}
                      onClick={() => handleMarkPaid(m)}
                      className="btn btn-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      Mark Paid
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
        title="Edit Meal Request"
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        submitText="Update"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              9:00 AM Prasadam
            </label>
            <input
              type="number"
              min="0"
              name="morningPrasadam"
              value={editForm.morningPrasadam}
              onChange={handleEditChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              4:30 PM Prasadam
            </label>
            <input
              type="number"
              min="0"
              name="eveningPrasadam"
              value={editForm.eveningPrasadam}
              onChange={handleEditChange}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
