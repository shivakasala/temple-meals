import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function UserDashboard() {
  const [rates, setRates] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [error, setError] = useState('');
  const [meals, setMeals] = useState([]);
  const [form, setForm] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [submitting, setSubmitting] = useState(false);

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
    setForm((f) => ({ ...f, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/meals', form);
      await loadMine();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit meal request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (meal) => {
    const breakfast = Number(prompt('New breakfast count', meal.breakfast));
    if (Number.isNaN(breakfast) || breakfast < 0) return;
    const lunch = Number(prompt('New lunch count', meal.lunch));
    if (Number.isNaN(lunch) || lunch < 0) return;
    const dinner = Number(prompt('New dinner count', meal.dinner));
    if (Number.isNaN(dinner) || dinner < 0) return;

    try {
      await api.put(`/meals/${meal._id}`, { breakfast, lunch, dinner });
      await loadMine();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit request');
    }
  };

  const handleMarkPaid = async (meal) => {
    try {
      await api.post(`/meals/${meal._id}/mark-paid`);
      await loadMine();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payment');
    }
  };

  const latest = meals[0];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">My Meal Requests</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-medium text-slate-700 mb-2">Submit Next-Day Request</h2>
        {loadingRates ? (
          <div className="text-sm text-slate-500">Loading rates...</div>
        ) : !rates ? (
          <div className="text-sm text-red-600">Rates not configured by admin yet.</div>
        ) : (
          <>
            <div className="text-xs text-slate-500 mb-3">
              Current rates: Breakfast ₹{rates.breakfastRate}, Lunch ₹{rates.lunchRate}, Dinner ₹
              {rates.dinnerRate}. Requests allowed only for next day and only before 4:00 PM.
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Breakfast</label>
                <input
                  type="number"
                  min="0"
                  name="breakfast"
                  value={form.breakfast}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Lunch</label>
                <input
                  type="number"
                  min="0"
                  name="lunch"
                  value={form.lunch}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Dinner</label>
                <input
                  type="number"
                  min="0"
                  name="dinner"
                  value={form.dinner}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="col-span-3 md:col-span-1 mt-2 md:mt-0 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit for Next Day'}
              </button>
            </form>
          </>
        )}
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-medium text-slate-700 mb-2">Recent Requests</h2>
        {meals.length === 0 ? (
          <div className="text-sm text-slate-500">No requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-right">Breakfast</th>
                  <th className="px-2 py-1 text-right">Lunch</th>
                  <th className="px-2 py-1 text-right">Dinner</th>
                  <th className="px-2 py-1 text-right">Bill</th>
                  <th className="px-2 py-1">Meal Status</th>
                  <th className="px-2 py-1">Payment Status</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meals.map((m) => {
                  const editable = m.editingAllowed;
                  const canMarkPaid = m.paymentStatus !== 'payment-approved';
                  return (
                    <tr key={m._id} className="border-t">
                      <td className="px-2 py-1">{m.date}</td>
                      <td className="px-2 py-1 text-right">{m.breakfast}</td>
                      <td className="px-2 py-1 text-right">{m.lunch}</td>
                      <td className="px-2 py-1 text-right">{m.dinner}</td>
                      <td className="px-2 py-1 text-right">₹{m.billAmount}</td>
                      <td className="px-2 py-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100">
                          {m.mealStatus}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100">
                          {m.paymentStatus}
                        </span>
                      </td>
                      <td className="px-2 py-1 space-x-1">
                        <button
                          disabled={!editable}
                          onClick={() => handleEdit(m)}
                          className="px-2 py-0.5 text-xs rounded border border-slate-300 disabled:opacity-40"
                        >
                          Edit
                        </button>
                        <button
                          disabled={!canMarkPaid}
                          onClick={() => handleMarkPaid(m)}
                          className="px-2 py-0.5 text-xs rounded border border-green-500 text-green-700 disabled:opacity-40"
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

