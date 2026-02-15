import React, { useEffect, useState } from 'react';
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
    email: '',
    role: 'user',
  });
  const [rateForm, setRateForm] = useState({
    morningRate: '',
    eveningRate: '',
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
        params: dateFilter ? { date: dateFilter } : {},
      });
      setMeals(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meal requests');
    }
  };

  const loadSummary = async () => {
    try {
      const res = await api.get('/meals/admin-summary', {
        params: dateFilter ? { date: dateFilter } : {},
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
      setShowUserModal(false);
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

  const pendingCount = meals.filter((m) => m.mealStatus === 'requested').length;
  const unpaidCount = meals.filter((m) => m.paymentStatus !== 'payment-approved').length;

  const getMealBadgeClass = (status) => {
    if (status === 'approved') return 'badge-success';
    if (status === 'rejected') return 'badge-danger';
    return 'badge-warning';
  };

  const getPaymentBadgeClass = (status) => {
    if (status === 'payment-approved') return 'badge-success';
    return 'badge-warning';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage users, rates, and meal requests
        </p>
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

      {/* Stats Grid */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Collected', value: `₹${summary.totalCollected}`, color: 'text-saffron-600', bg: 'bg-saffron-50', icon: '💰' },
            { label: 'Total Users', value: users.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: '👥' },
            { label: 'Pending Requests', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: '⏳' },
            { label: 'Unpaid Bills', value: unpaidCount, color: 'text-red-500', bg: 'bg-red-50', icon: '📋' },
          ].map((stat) => (
            <div key={stat.label} className="card !p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <span className={`text-xl ${stat.bg} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  {stat.icon}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two‑Column Layout: Rates + Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prasadam Rates */}
        <section className="card">
          <h2 className="section-title mb-4">Prasadam Rates</h2>
          <form onSubmit={handleRatesSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Morning Prasadam (₹)
              </label>
              <input
                type="number"
                min="0"
                name="morningRate"
                value={rateForm.morningRate ?? ''}
                onChange={handleRatesChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Evening Prasadam (₹)
              </label>
              <input
                type="number"
                min="0"
                name="eveningRate"
                value={rateForm.eveningRate ?? ''}
                onChange={handleRatesChange}
                required
              />
            </div>
            <button type="submit" className="w-full btn btn-primary">
              Save Rates
            </button>
          </form>
        </section>

        {/* Users */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Users ({users.length})</h2>
            <button
              onClick={() => setShowUserModal(true)}
              className="btn btn-primary btn-sm"
            >
              + Add User
            </button>
          </div>

          {users.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">👤</p>
              <p className="empty-state-text">No users yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Temple</th>
                    <th>Role</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="font-medium text-slate-800">{u.username}</td>
                      <td className="text-slate-600">{u.templeName}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-saffron' : 'badge-info'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-xs text-slate-400 hover:text-red-600 transition-colors font-medium"
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
      </div>

      {/* Meal Requests */}
      <section className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="section-title">
            Meal Requests
            <span className="ml-1.5 text-sm font-normal text-slate-400">({meals.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="!w-auto"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {meals.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">📭</p>
            <p className="empty-state-text">No meal requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((m) => (
              <div
                key={m._id}
                className="border border-slate-100 rounded-lg p-4 hover:border-slate-200 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{m.userName}</p>
                    <p className="text-xs text-slate-400">{m.date}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`badge ${getMealBadgeClass(m.mealStatus)}`}>{m.mealStatus}</span>
                    <span className={`badge ${getPaymentBadgeClass(m.paymentStatus)}`}>
                      {m.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-blue-50/60 p-2.5 rounded-lg">
                    <p className="text-[11px] text-slate-500 font-medium">Morning</p>
                    <p className="text-lg font-bold text-blue-600">{m.morningPrasadam || 0}</p>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg">
                    <p className="text-[11px] text-slate-500 font-medium">Evening</p>
                    <p className="text-lg font-bold text-emerald-600">{m.eveningPrasadam || 0}</p>
                  </div>
                  <div className="bg-saffron-50 p-2.5 rounded-lg">
                    <p className="text-[11px] text-slate-500 font-medium">Bill</p>
                    <p className="text-lg font-bold text-saffron-700">₹{m.billAmount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">
                      Meal Status
                    </label>
                    <select
                      value={m.mealStatus}
                      onChange={(e) => updateMealStatus(m._id, e.target.value)}
                    >
                      <option value="requested">Requested</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">
                      Payment Status
                    </label>
                    <select
                      value={m.paymentStatus}
                      onChange={(e) => updatePaymentStatus(m._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="payment-approved">Approved</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Daily Summary */}
      {summary && summary.daily?.length > 0 && (
        <section className="card">
          <h2 className="section-title mb-4">Daily Summary</h2>
          <div className="table-container">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">Morning</th>
                  <th className="text-right">Evening</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.daily.map((d) => (
                  <tr key={d._id}>
                    <td className="font-medium text-slate-800">{d._id}</td>
                    <td className="text-right text-slate-600">
                      {d.totalMorning || d.totalBreakfast || 0}
                    </td>
                    <td className="text-right text-slate-600">
                      {d.totalEvening || d.totalDinner || 0}
                    </td>
                    <td className="text-right font-semibold text-saffron-700">₹{d.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showUserModal}
        title="Create New User"
        onClose={() => setShowUserModal(false)}
        onSubmit={handleUserCreate}
        submitText="Create User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              name="username"
              value={userForm.username}
              onChange={handleUserFormChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={userForm.password}
              onChange={handleUserFormChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={userForm.email}
              onChange={handleUserFormChange}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Temple / Department
            </label>
            <input
              type="text"
              name="templeName"
              value={userForm.templeName}
              onChange={handleUserFormChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select name="role" value={userForm.role} onChange={handleUserFormChange}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
