import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setStoredAuth } from '../services/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });

      if (!res.data || !res.data.user) {
        throw new Error('Server returned invalid response');
      }

      setStoredAuth(res.data);

      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err) {
      let errorMsg = 'Login failed';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Cannot connect to server. Check if backend is running.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 text-3xl shadow-lg shadow-saffron-500/20 mb-4">
            🏛️
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Prasadam Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage your bookings</p>
        </div>

        {/* Login Card */}
        <div className="card !p-0 overflow-hidden">
          <div className="p-6 space-y-5">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full btn btn-primary !py-3">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner !w-4 !h-4 !border-t-white !border-saffron-300"></span>
                    Signing in…
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Contact your admin for credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}
