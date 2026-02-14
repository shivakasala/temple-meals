import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rates, setRates] = useState(null);
  const [summary, setSummary] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [meals, setMeals] = useState([]);
  const [error, setError] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    templeName: '',
    role: 'user'
  });
  const [rateForm, setRateForm] = useState({
    morningRate: '',
    eveningRate: ''
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 py-8">
      <div className="space-y-6 max-w-xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">📊 Admin Dashboard</h1>
          <p className="text-slate-600 mt-2 text-lg">Manage users, rates, and meal requests</p>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Link 
            to="/admin"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/admin-requests"
            className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
          >
            📋 All Requests
          </Link>
        </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500 shadow-sm">
          <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Summary Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card card-stat bg-blue-50">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value text-blue-600">₹{summary.totalCollected}</div>
          </div>
          <div className="card card-stat bg-green-50">
            <div className="stat-label">Total Users</div>
            <div className="stat-value text-green-600">{users.length}</div>
          </div>
          <div className="card card-stat bg-orange-50">
            <div className="stat-label">Pending Requests</div>
            <div className="stat-value text-orange-600">{meals.filter(m => m.mealStatus === 'requested').length}</div>
          </div>
          <div className="card card-stat bg-purple-50">
            <div className="stat-label">Unpaid Bills</div>
            <div className="stat-value text-purple-600">{meals.filter(m => m.paymentStatus !== 'payment-approved').length}</div>
          </div>
        </div>
      )}

      {/* Meal Rates Section */}
      <section className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">💰 Prasadam Rates</h2>
        <form onSubmit={handleRatesSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">⏰ 9:00 AM Prasadam Rate (₹)</label>
            <input
              type="number"
              min="0"
              name="morningRate"
              value={rateForm.morningRate ?? ''}
              onChange={handleRatesChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">⏰ 4:30 PM Prasadam Rate (₹)</label>
            <input
              type="number"
              min="0"
              name="eveningRate"
              value={rateForm.eveningRate ?? ''}
              onChange={handleRatesChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              ✓ Save Rates
            </button>
          </div>
        </form>
      </section>

      {/* Users Section */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">👥 Users ({users.length})</h2>
          <button
            onClick={() => setShowUserModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            + Add User
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <p>No users yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Username</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Temple</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3">{u.username}</td>
                    <td className="px-4 py-3">{u.templeName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Meal Requests Section */}
      <section className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">🍽️ Meal Requests ({meals.length})</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Filter by date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <p>No meal requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((m) => (
              <div key={m._id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">{m.userName}</p>
                    <p className="text-xs text-slate-500">{m.date}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${m.mealStatus === 'approved' ? 'bg-green-100 text-green-800' : m.mealStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {m.mealStatus}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${m.paymentStatus === 'payment-approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {m.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded">
                    <div className="text-xs text-slate-600">🌅 9:00 AM Prasadam</div>
                    <div className="font-semibold">{m.morningPrasadam || 0}</div>
                  </div>
                  <div className="bg-emerald-100 p-2 rounded">
                    <div className="text-xs text-slate-600">🌇 4:30 PM Prasadam</div>
                    <div className="font-semibold">{m.eveningPrasadam || 0}</div>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded">
                    <div className="text-xs text-slate-600">💰 Bill</div>
                    <div className="font-semibold text-yellow-700">₹{m.billAmount}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">Meal Status</label>
                    <select
                      value={m.mealStatus}
                      onChange={(e) => updateMealStatus(m._id, e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="requested">requested</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">Payment Status</label>
                    <select
                      value={m.paymentStatus}
                      onChange={(e) => updatePaymentStatus(m._id, e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="payment-approved">payment-approved</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Daily Summary Section */}
      {summary && summary.daily?.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">📈 Daily Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">🌅 9:00 AM Prasadam</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">🌇 4:30 PM Prasadam</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">💰 Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.daily.map((d) => (
                  <tr key={d._id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{d._id}</td>
                    <td className="px-4 py-3 text-right">{d.totalMorning || d.totalBreakfast || 0}</td>
                    <td className="px-4 py-3 text-right">{d.totalEvening || d.totalDinner || 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">₹{d.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        title="➕ Create New User"
        onClose={() => setShowUserModal(false)}
        onSubmit={handleUserCreate}
        submitText="Create"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={userForm.username}
              onChange={handleUserFormChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={userForm.password}
              onChange={handleUserFormChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Temple / Department</label>
            <input
              type="text"
              name="templeName"
              value={userForm.templeName}
              onChange={handleUserFormChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              name="role"
              value={userForm.role}
              onChange={handleUserFormChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}

