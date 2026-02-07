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
    category: 'IOS',
    fromDate: '',
    toDate: '',
    dayQuantities: {}
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [editForm, setEditForm] = useState({ morningPrasadam: 0, eveningPrasadam: 0 });
  const [dateRangeDisplay, setDateRangeDisplay] = useState([]);
  const [selectedDays, setSelectedDays] = useState({});

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
      [name]: (name === 'morningPrasadam' || name === 'eveningPrasadam') ? Number(value) : value 
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
        const range = generateDateRange(fromDate, toDate);
        setDateRangeDisplay(range);
        // Auto-select all days and initialize quantities
        const newSelected = {};
        const newQuantities = {};
        range.forEach((item) => {
          newSelected[item.date] = true;
          if (!newQuantities[item.date]) {
            newQuantities[item.date] = { morning: 0, evening: 0 };
          }
        });
        setSelectedDays(newSelected);
        setForm((f) => ({ ...f, dayQuantities: newQuantities }));
      }
    }
  };

  const handleDayToggle = (date) => {
    setSelectedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.name || !form.userPhone || !form.userTemple) {
      setError('Please fill in name, phone, and temple/department');
      return;
    }

    const selectedCount = Object.values(selectedDays).filter(Boolean).length;
    if (selectedCount === 0) {
      setError('Please select at least one day');
      return;
    }

    setSubmitting(true);
    try {
      // Get selected dates array
      const selectedDatesArray = dateRangeDisplay
        .filter((item) => selectedDays[item.date])
        .map((item) => item.date);

      // Create records for each selected day and time slot
      const records = [];
      selectedDatesArray.forEach((date) => {
        const quantities = form.dayQuantities[date];
        if (quantities?.morning > 0) {
          records.push({
            name: form.name,
            userPhone: form.userPhone,
            userTemple: form.userTemple,
            morningPrasadam: quantities.morning,
            eveningPrasadam: 0,
            category: form.category,
            date: date,
            fromDate: date,
            toDate: date
          });
        }
        if (quantities?.evening > 0) {
          records.push({
            name: form.name,
            userPhone: form.userPhone,
            userTemple: form.userTemple,
            morningPrasadam: 0,
            eveningPrasadam: quantities.evening,
            category: form.category,
            date: date,
            fromDate: date,
            toDate: date
          });
        }
      });

      // Submit all records
      for (const record of records) {
        await api.post('/meals', record);
      }

      setForm({ 
        name: '',
        userPhone: '',
        userTemple: '',
        category: 'IOS',
        fromDate: '',
        toDate: '',
        dayQuantities: {}
      });
      setDateRangeDisplay([]);
      setSelectedDays({});
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
    const morning = rates.morningRate || 0;
    const evening = rates.eveningRate || 0;
    const dayCost = form.morningPrasadam * morning + form.eveningPrasadam * evening;
    
    // Count only selected days
    if (Object.keys(selectedDays).length > 0) {
      const selectedCount = Object.values(selectedDays).filter(Boolean).length;
      return dayCost * selectedCount;
    }
    
    // Fallback: if date range is selected but no checkboxes (shouldn't happen), multiply by number of days
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
      <section className="card shadow-lg">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">📋 Book Prasadam</h2>
            <p className="text-sm text-slate-500 mt-1">Fill in your details and select your booking period</p>
          </div>
        </div>

        {loadingRates ? (
          <div className="flex items-center justify-center py-12">
            <span className="spinner"></span>
            <span className="ml-2 text-slate-600">Loading rates...</span>
          </div>
        ) : !rates ? (
          <div className="p-4 rounded-lg bg-amber-50 border-l-4 border-amber-400">
            <p className="text-sm text-amber-900 font-medium">⚠️ Rates not yet configured by admin</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Current Rates</p>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-blue-700">9:00 AM:</span>
                      <span className="text-lg font-bold text-blue-900">₹{rates.morningRate}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-blue-700">4:30 PM:</span>
                      <span className="text-lg font-bold text-blue-900">₹{rates.eveningRate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
                  <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm mr-2">1</span>
                  Personal Details
                </label>
                <div className="flex flex-col md:flex-row gap-4 pl-12">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:bg-blue-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="userPhone"
                      placeholder="+91 XXXXX XXXXX"
                      value={form.userPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:bg-blue-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department/Location</label>
                    <input
                      type="text"
                      name="userTemple"
                      placeholder="e.g., Main Hall, Kitchen"
                      value={form.userTemple}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:bg-blue-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Booking Period Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
                  <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm mr-2">2</span>
                  Booking Period
                </label>
                <div className="flex flex-col md:flex-row gap-4 pl-12">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      name="fromDate"
                      value={form.fromDate}
                      onChange={handleDateChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:bg-blue-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                    <input
                      type="date"
                      name="toDate"
                      value={form.toDate}
                      onChange={handleDateChange}
                      min={form.fromDate}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:bg-blue-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
                  <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm mr-2">3</span>
                  Prasadam Category
                </label>
                <div className="flex gap-4 pl-12">
                  <label className="flex items-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg cursor-pointer hover:bg-blue-50 transition" style={{ flex: 1 }}>
                    <input
                      type="radio"
                      name="category"
                      value="IOS"
                      checked={form.category === 'IOS'}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Individual</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg cursor-pointer hover:bg-blue-50 transition" style={{ flex: 1 }}>
                    <input
                      type="radio"
                      name="category"
                      value="COMMUNITY"
                      checked={form.category === 'COMMUNITY'}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Community</span>
                  </label>
                </div>
              </div>

              {/* Date Range Display with Daywise Prasadam Selection */}
              {dateRangeDisplay.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-300">
                  <h4 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                    <span>📅</span> Select Prasadam for Each Day ({Object.values(selectedDays).filter(Boolean).length} of {dateRangeDisplay.length} days)
                  </h4>
                  <div className="flex flex-col gap-4">
                    {dateRangeDisplay.map((item) => {
                      const date = item.date;
                      const isSelected = selectedDays[date];
                      return (
                        <div key={date} className="border border-emerald-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center mb-4">
                            <input
                              type="checkbox"
                              checked={isSelected || false}
                              onChange={() => handleDayToggle(date)}
                              className="w-5 h-5 cursor-pointer accent-emerald-600 mr-3"
                            />
                            <span className="font-semibold text-emerald-900">{date}</span>
                          </div>
                          
                          {isSelected && (
                            <div className="ml-8 space-y-3">
                              {/* 9:00 AM Prasadam */}
                              <div>
                                <label className="text-sm font-medium text-emerald-800 mb-2 block">9:00 AM Prasadam</label>
                                <div className="flex gap-3">
                                  {[1, 2, 3, 4].map((qty) => (
                                    <label key={`${date}-morning-${qty}`} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`morning-${date}`}
                                        value={qty}
                                        checked={(form.dayQuantities[date]?.morning || 0) === qty}
                                        onChange={() => {
                                          setForm((f) => ({
                                            ...f,
                                            dayQuantities: {
                                              ...f.dayQuantities,
                                              [date]: { ...f.dayQuantities[date], morning: qty }
                                            }
                                          }));
                                        }}
                                        className="w-4 h-4 accent-emerald-600"
                                      />
                                      <span className="text-sm text-emerald-700">{qty}</span>
                                    </label>
                                  ))}
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`morning-${date}`}
                                      value={0}
                                      checked={(form.dayQuantities[date]?.morning || 0) === 0}
                                      onChange={() => {
                                        setForm((f) => ({
                                          ...f,
                                          dayQuantities: {
                                            ...f.dayQuantities,
                                            [date]: { ...f.dayQuantities[date], morning: 0 }
                                          }
                                        }));
                                      }}
                                      className="w-4 h-4 accent-emerald-600"
                                    />
                                    <span className="text-sm text-emerald-700">None</span>
                                  </label>
                                </div>
                              </div>

                              {/* 4:30 PM Prasadam */}
                              <div>
                                <label className="text-sm font-medium text-emerald-800 mb-2 block">4:30 PM Prasadam</label>
                                <div className="flex gap-3">
                                  {[1, 2, 3, 4].map((qty) => (
                                    <label key={`${date}-evening-${qty}`} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`evening-${date}`}
                                        value={qty}
                                        checked={(form.dayQuantities[date]?.evening || 0) === qty}
                                        onChange={() => {
                                          setForm((f) => ({
                                            ...f,
                                            dayQuantities: {
                                              ...f.dayQuantities,
                                              [date]: { ...f.dayQuantities[date], evening: qty }
                                            }
                                          }));
                                        }}
                                        className="w-4 h-4 accent-emerald-600"
                                      />
                                      <span className="text-sm text-emerald-700">{qty}</span>
                                    </label>
                                  ))}
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`evening-${date}`}
                                      value={0}
                                      checked={(form.dayQuantities[date]?.evening || 0) === 0}
                                      onChange={() => {
                                        setForm((f) => ({
                                          ...f,
                                          dayQuantities: {
                                            ...f.dayQuantities,
                                            [date]: { ...f.dayQuantities[date], evening: 0 }
                                          }
                                        }));
                                      }}
                                      className="w-4 h-4 accent-emerald-600"
                                    />
                                    <span className="text-sm text-emerald-700">None</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Total Cost Summary */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-2 border-blue-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Total Amount:</span>
                  <div className="text-right">
                    <p className="text-xs text-slate-600 mb-1">Per day × No. of days</p>
                    <p className="text-3xl font-bold text-blue-700">₹{calculateCost()}</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || calculateCost() === 0 || !form.fromDate || !form.toDate}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105 active:scale-95 shadow-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner"></span> Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>✓</span> Confirm Booking
                  </span>
                )}
              </button>

              <p className="text-xs text-center text-slate-500 mt-4">
                By submitting, you agree to the booking terms and conditions
              </p>
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

                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="bg-white p-2 rounded">⏰ 9:00 AM: {m.morningPrasadam}</div>
                    <div className="bg-white p-2 rounded">⏰ 4:30 PM: {m.eveningPrasadam}</div>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">⏰ 9:00 AM Prasadam</label>
            <input
              type="number"
              min="0"
              name="morningPrasadam"
              value={editForm.morningPrasadam}
              onChange={handleEditChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">⏰ 4:30 PM Prasadam</label>
            <input
              type="number"
              min="0"
              name="eveningPrasadam"
              value={editForm.eveningPrasadam}
              onChange={handleEditChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

