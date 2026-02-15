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

    if (loading) {
      return;
    }

    setError('');
    setLoading(true);

    console.log('[LOGIN] Starting login attempt for:', username);

    try {
      console.log('[LOGIN] Sending login request...');
      const res = await api.post('/auth/login', { username, password });

      console.log('[LOGIN] Got response:', {
        status: res.status,
        data: res.data,
        hasToken: !!res.data?.token,
        hasUser: !!res.data?.user,
        userData: res.data?.user
      });

      if (!res.data) {
        console.error('[LOGIN] Response data is missing/null:', res.data);
        throw new Error('Server returned empty response');
      }
      if (!res.data.user) {
        console.error('[LOGIN] User object missing in response:', res.data);
        throw new Error('Server response missing user data. Got: ' + JSON.stringify(res.data));
      }
      if (!res.data.token) {
        console.error('[LOGIN] Token missing in response:', res.data);
        throw new Error('Server response missing authentication token');
      }

      console.log('[LOGIN] Validation passed, storing auth...');
      setStoredAuth(res.data);

      console.log('[LOGIN] Login successful, redirecting to:', res.data.user.role);
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err) {
      console.error('[LOGIN] Error caught:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        data: err.response?.data
      });

      let errorMsg = 'Login failed';

      if (err.response?.status === 401) {
        errorMsg = 'Invalid username or password';
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data?.message || 'Please provide username and password';
      } else if (err.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Cannot connect to server. Check if backend is running on http://localhost:4000';
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout. Server is not responding.';
      } else if (err.message) {
        errorMsg = err.message;
      }

      console.error('[LOGIN] Setting error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 text-3xl shadow-lg shadow-saffron-500/20 mb-4">
            &#127974;
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Prasadam Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage your bookings</p>
        </div>

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
                    Signing in
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
