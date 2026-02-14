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
      [name]: (name === 'morningPrasadam' || name === 'eveningPrasadam' || name === 'numDevotees') ? Number(value) : value 
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
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    
    // Check if both dates are filled after update
    if (updatedForm.fromDate && updatedForm.toDate) {
      const fromDate = updatedForm.fromDate;
      const toDate = updatedForm.toDate;
      
      // Validate date range
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
      
      if (fromDateObj <= toDateObj) {
        const range = generateDateRange(fromDate, toDate);
        setDateRangeDisplay(range);
        // Auto-select all days and initialize quantities
        const newQuantities = {};
        range.forEach((item) => {
          newQuantities[item.date] = { morning: 0, evening: 0 };
        });
        setForm((f) => ({ ...f, dayQuantities: newQuantities }));
      }
    } else {
      setDateRangeDisplay([]);
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

    // Check if at least one meal is selected
    const hasMeals = Object.values(form.dayQuantities || {}).some(
      (day) => (day?.morning || 0) > 0 || (day?.evening || 0) > 0
    );
    if (!hasMeals) {
      setError('Please select at least one meal');
      return;
    }

    setSubmitting(true);
    try {
      // Create a single record for each selected day
      const records = [];
      const morningRate = rates.morningRate || 0;
      const eveningRate = rates.eveningRate || 0;
      const numDevotees = form.numDevotees || 1;

      Object.entries(form.dayQuantities).forEach(([date, quantities]) => {
        const morningCount = quantities?.morning || 0;
        const eveningCount = quantities?.evening || 0;

        if (morningCount > 0 || eveningCount > 0) {
          const dailyBillAmount = ((morningCount * morningRate) + (eveningCount * eveningRate)) * numDevotees;
          records.push({
            name: form.name,
            userPhone: form.userPhone,
            userTemple: form.userTemple,
            morningPrasadam: morningCount * numDevotees,
            eveningPrasadam: eveningCount * numDevotees,
            category: form.category,
            date: date,
            fromDate: date,
            toDate: date,
            billAmount: dailyBillAmount // Calculate bill amount per day
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
        numDevotees: 1,
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
    const numDevotees = form.numDevotees || 1;
    
    let totalCost = 0;
    Object.values(form.dayQuantities || {}).forEach((day) => {
      totalCost += (((day?.morning || 0) * morning) + ((day?.evening || 0) * evening)) * numDevotees;
    });
    
    return totalCost;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 py-8">
      <div className="space-y-6 max-w-xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">🍽️ Book Your Prasadam</h1>
          <p className="text-slate-600 mt-2 text-lg">Manage your daily meal requests with ease</p>
        </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500 shadow-sm">
          <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Submit New Request Card */}
      <section className="card shadow-xl bg-white rounded-xl border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-t-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📋</span> Book Prasadam
          </h2>
          <p className="text-blue-50 mt-2">Select dates and meals for your booking</p>
        </div>

        <div className="px-6 pb-6">

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
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💰</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Current Rates</p>
                  <div className="mt-2 grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-amber-700 mb-1">9:00 AM Prasadam</p>
                      <p className="text-2xl font-bold text-amber-900">₹{rates.morningRate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 mb-1">4:30 PM Prasadam</p>
                      <p className="text-2xl font-bold text-amber-900">₹{rates.eveningRate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Info Section */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Personal Details
                </label>
                <div className="flex flex-col md:flex-row gap-3">
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

              {/* Number of Devotees Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
                  <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm mr-2">2</span>
                  Number of Devotees
                </label>
                <div className="pl-12">
                  <input
                    type="number"
                    name="numDevotees"
                    min="1"
                    max="1000"
                    value={form.numDevotees}
                    onChange={handleChange}
                    className="w-full md:w-48 px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:bg-blue-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">All meal quantities will be multiplied by this number</p>
                </div>
              </div>

              {/* Booking Period Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
                  <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm mr-2">3</span>
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
                  <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm mr-2">4</span>
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
                    <span>📅</span> Select Meals for Each Day
                  </h4>
                  <div className="flex flex-col gap-3">
                    {dateRangeDisplay.map((item) => {
                      const date = item.date;
                      return (
                        <div key={date} className="border border-emerald-200 rounded-lg p-4 bg-white">
                          <div className="font-semibold text-emerald-900 mb-3">{date}</div>
                          <div className="ml-4 space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(form.dayQuantities[date]?.morning || 0) > 0}
                                onChange={() => {
                                  const currentValue = form.dayQuantities[date]?.morning || 0;
                                  setForm((f) => ({
                                    ...f,
                                    dayQuantities: {
                                      ...f.dayQuantities,
                                      [date]: { ...f.dayQuantities[date], morning: currentValue > 0 ? 0 : 1 }
                                    }
                                  }));
                                }}
                                className="w-4 h-4 cursor-pointer accent-emerald-600"
                              />
                              <span className="text-sm font-medium text-emerald-800">9:00 AM Prasadam</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(form.dayQuantities[date]?.evening || 0) > 0}
                                onChange={() => {
                                  const currentValue = form.dayQuantities[date]?.evening || 0;
                                  setForm((f) => ({
                                    ...f,
                                    dayQuantities: {
                                      ...f.dayQuantities,
                                      [date]: { ...f.dayQuantities[date], evening: currentValue > 0 ? 0 : 1 }
                                    }
                                  }));
                                }}
                                className="w-4 h-4 cursor-pointer accent-emerald-600"
                              />
                              <span className="text-sm font-medium text-emerald-800">4:30 PM Prasadam</span>
                            </label>
                          </div>
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
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white font-bold text-lg hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl border-2 border-emerald-400"
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
        </div>
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
    </div>
  );
}

