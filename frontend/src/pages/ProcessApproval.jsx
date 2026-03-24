import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getStoredAuth } from '../services/auth';

export default function ProcessApproval() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing your request...');

  const id = searchParams.get('id');
  const action = searchParams.get('action');

  useEffect(() => {
    const processAction = async () => {
      if (!id || !action) {
        setStatus('error');
        setMessage('Invalid link. Missing required parameters.');
        return;
      }

      const auth = getStoredAuth();
      if (!auth || !auth.user || auth.user.role !== 'admin') {
        setStatus('error');
        setMessage('Access Denied: You must be logged in as an admin to perform this action.');
        // Optionally redirect to login after a delay
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const mealStatus = action === 'approve' ? 'approved' : 'rejected';
        await api.post(`/meals/${id}/admin-meal-status`, { status: mealStatus });
        setStatus('success');
        setMessage(`Request has been successfully ${mealStatus}!`);
        
        setTimeout(() => navigate('/admin-requests'), 2000);
      } catch (err) {
        console.error('Failed to process approval:', err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to process the request. It may have already been handled.');
      }
    };

    processAction();
  }, [id, action, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="mb-6">
          {status === 'processing' && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-saffron-50 text-saffron-600 mb-4">
              <span className="spinner !w-8 !h-8 !border-t-saffron-600 !border-saffron-200"></span>
            </div>
          )}
          {status === 'success' && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <h2 className={`text-2xl font-bold mb-2 ${
          status === 'error' ? 'text-red-600' : 
          status === 'success' ? 'text-emerald-600' : 
          'text-slate-800'
        }`}>
          {status === 'error' ? 'Action Failed' : 
           status === 'success' ? 'Success!' : 
           'Processing...'}
        </h2>
        
        <p className="text-slate-600">
          {message}
        </p>

        {status === 'error' && (
          <button 
            onClick={() => navigate('/login')}
            className="mt-6 btn btn-primary w-full"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}