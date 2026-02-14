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
    
    console.log('[LOGIN] Attempting login with:', { username, password: '***' });
    
    try {
      console.log('[LOGIN] Posting to /auth/login');
      const res = await api.post('/auth/login', { username, password });
      
      console.log('[LOGIN] Response status:', res.status);
      console.log('[LOGIN] Response data:', res.data);
      
      if (!res.data.user) {
        throw new Error('Invalid response: missing user data');
      }
      
      setStoredAuth(res.data);
      
      if (res.data.user.role === 'admin') {
        console.log('[LOGIN] Admin login successful, redirecting to /admin');
        navigate('/admin');
      } else {
        console.log('[LOGIN] User login successful, redirecting to /user');
        navigate('/user');
      }
    } catch (err) {
      console.error('[LOGIN] Error:', err);
      console.error('[LOGIN] Error response:', err.response?.data);
      console.error('[LOGIN] Error status:', err.response?.status);
      
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      console.log('[LOGIN] Showing error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏛️</div>
          <h1 className="text-2xl font-bold text-slate-800">Online Temple Prasadam Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Prasadam booking & management system</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
            <input
              type="text"
              autoFocus
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner"></span> Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
          Contact your admin for credentials
        </div>
      </div>
    </div>
  );
}

