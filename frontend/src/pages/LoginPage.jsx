import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import { setStoredAuth } from '../services/auth';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { token: credentialResponse.credential });
      if (!res || !res.data || !res.data.token || !res.data.user) {
        throw new Error('Invalid server response');
      }
      setStoredAuth(res.data);
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err) {
      console.error('Google login failed:', err);
      setError(err.response?.data?.message || 'Google login failed');
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
          <p className="text-slate-500 text-sm mt-1">Sign in with Google to manage your bookings</p>
        </div>

        <div className="card !p-0 overflow-hidden">
          <div className="p-6 flex flex-col items-center space-y-6">
            {error && (
              <div className="alert-error w-full">
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

            {loading && (
              <div className="flex items-center justify-center gap-2 text-saffron-600 font-medium">
                <span className="spinner !w-5 !h-5 !border-t-saffron-600 !border-saffron-200"></span>
                Signing in...
              </div>
            )}

            <div className={`w-full flex justify-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('Google Sign-In failed. Please try again.');
                }}
                useOneTap
              />
            </div>
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Only authorized users can access the portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
