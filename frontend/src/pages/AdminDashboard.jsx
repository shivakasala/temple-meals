import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rates, setRates] = useState(null);
  const [summary, setSummary] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [meals, setMeals] = useState([]);
  const [error, setError] = useState('');

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    templeName: '',
    role: 'user'
  });
  const [rateForm, setRateForm] = useState({
    breakfastRate: '',
    lunchRate: '',
    dinnerRate: ''
  });

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    }
  };

  const loadRates = async () => {
    try {
      const res = await api.get('/settings');
      setRates(res.data);
      setRateForm(res.data);
    } catch {
      // ignore if not configured yet
    }
  };

  const loadMeals = async () => {
    try {
      const res = await api.get('/meals/admin', {
        params: dateFilter ? { date: dateFilter } : {}
      });
      setMeals(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meal requests');
    }
  };

  const loadSummary = async () => {
    try {
      const res = await api.get('/meals/admin-summary', {
        params: dateFilter ? { date: dateFilter } : {}
      });
      setSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load summary');
    }
  };

  useEffect(() => {
    loadUsers();
    loadRates();
  }, []);

  useEffect(() => {
    loadMeals();
    loadSummary();
  }, [dateFilter]);

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm((f) => ({ ...f, [name]: value }));
  };

  const handleUserCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', userForm);
      setUserForm({ username: '', password: '', templeName: '', role: 'user' });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRatesChange = (e) => {
    const { name, value } = e.target;
    setRateForm((f) => ({ ...f, [name]: Number(value) }));
  };

  const handleRatesSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/settings', rateForm);
      await loadRates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save rates');
    }
  };

  const updateMealStatus = async (mealId, status) => {
    try {
      await api.post(`/meals/${mealId}/admin-meal-status`, { status });
      await loadMeals();
      await loadSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update meal status');
    }
  };

  const updatePaymentStatus = async (mealId, status) => {
    try {
      await api.post(`/meals/${mealId}/admin-payment-status`, { status });
      await loadMeals();
      await loadSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payment status');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Admin Dashboard</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-medium text-slate-700 mb-2">Rates</h2>
        <form onSubmit={handleRatesSave} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Breakfast Rate</label>
            <input
              type="number"
              min="0"
              name="breakfastRate"
              value={rateForm.breakfastRate ?? ''}
              onChange={handleRatesChange}
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Lunch Rate</label>
            <input
              type="number"
              min="0"
              name="lunchRate"
              value={rateForm.lunchRate ?? ''}
              onChange={handleRatesChange}
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Dinner Rate</label>
            <input
              type="number"
              min="0"
              name="dinnerRate"
              value={rateForm.dinnerRate ?? ''}
              onChange={handleRatesChange}
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-2 md:mt-0 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Save Rates
          </button>
        </form>
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-medium text-slate-700 mb-2">Create User</h2>
        <form
          onSubmit={handleUserCreate}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs text-slate-600 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={userForm.username}
              onChange={handleUserFormChange}
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={userForm.password}
              onChange={handleUserFormChange}
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Temple / Department</label>
            <input
              type="text"
              name="templeName"
              value={userForm.templeName}
              onChange={handleUserFormChange}
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <div className="flex gap-2 items-end">
            <select
              name="role"
              value={userForm.role}
              onChange={handleUserFormChange}
              className="border rounded px-2 py-1 text-sm flex-1"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="py-2 px-3 rounded bg-slate-800 text-white text-sm hover:bg-slate-900"
            >
              Add
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-2 py-1 text-left">Username</th>
                <th className="px-2 py-1 text-left">Temple</th>
                <th className="px-2 py-1 text-left">Role</th>
                <th className="px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-2 py-1">{u.username}</td>
                  <td className="px-2 py-1">{u.templeName}</td>
                  <td className="px-2 py-1">{u.role}</td>
                  <td className="px-2 py-1">
                    <button
                      className="px-2 py-0.5 text-xs rounded border border-red-500 text-red-600"
                      onClick={() => handleDeleteUser(u._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white shadow rounded p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h2 className="font-medium text-slate-700">Meal Requests</h2>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600">Filter by date (YYYY-MM-DD)</label>
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded px-2 py-1 text-xs"
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">User</th>
                <th className="px-2 py-1 text-right">B</th>
                <th className="px-2 py-1 text-right">L</th>
                <th className="px-2 py-1 text-right">D</th>
                <th className="px-2 py-1 text-right">Bill</th>
                <th className="px-2 py-1">Meal Status</th>
                <th className="px-2 py-1">Payment Status</th>
                <th className="px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((m) => (
                <tr key={m._id} className="border-t">
                  <td className="px-2 py-1">{m.date}</td>
                  <td className="px-2 py-1">{m.userName}</td>
                  <td className="px-2 py-1 text-right">{m.breakfast}</td>
                  <td className="px-2 py-1 text-right">{m.lunch}</td>
                  <td className="px-2 py-1 text-right">{m.dinner}</td>
                  <td className="px-2 py-1 text-right">₹{m.billAmount}</td>
                  <td className="px-2 py-1">
                    <select
                      value={m.mealStatus}
                      onChange={(e) => updateMealStatus(m._id, e.target.value)}
                      className="border rounded px-1 py-0.5 text-xs"
                    >
                      <option value="requested">requested</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={m.paymentStatus}
                      onChange={(e) => updatePaymentStatus(m._id, e.target.value)}
                      className="border rounded px-1 py-0.5 text-xs"
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="payment-approved">payment-approved</option>
                    </select>
                  </td>
                  <td className="px-2 py-1 text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-medium text-slate-700 mb-2">Summary</h2>
        {!summary ? (
          <div className="text-xs text-slate-500">No data yet.</div>
        ) : (
          <div className="space-y-2 text-xs">
            <div>Total amount collected (payment-approved): ₹{summary.totalCollected}</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-right">Total Breakfast</th>
                    <th className="px-2 py-1 text-right">Total Lunch</th>
                    <th className="px-2 py-1 text-right">Total Dinner</th>
                    <th className="px-2 py-1 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.daily.map((d) => (
                    <tr key={d._id} className="border-t">
                      <td className="px-2 py-1">{d._id}</td>
                      <td className="px-2 py-1 text-right">{d.totalBreakfast}</td>
                      <td className="px-2 py-1 text-right">{d.totalLunch}</td>
                      <td className="px-2 py-1 text-right">{d.totalDinner}</td>
                      <td className="px-2 py-1 text-right">₹{d.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

