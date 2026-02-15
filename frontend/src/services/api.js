import axios from 'axios';
import { getAuthToken } from './auth';

// Determine API base URL
const getApiUrl = () => {
  // In development, use relative /api (proxied by Vite)
  if (import.meta.env.DEV) {
    console.log('[API] DEV mode: using Vite proxy /api');
    return '/api';
  }
  
  // In production, use the VITE_API_URL environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log('[API] Production mode - VITE_API_URL:', apiUrl);
  
  if (apiUrl) {
    const finalUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    console.log('[API] Using backend URL:', finalUrl);
    return finalUrl;
  }
  
  // Fallback: use the current domain's /api endpoint
  console.log('[API] No VITE_API_URL set, using current domain /api');
  return '/api';
};

const baseUrl = getApiUrl();
console.log('[API] Initialized with baseURL:', baseUrl);

const api = axios.create({
  baseURL: baseUrl
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('[API] Request:', config.method?.toUpperCase(), config.baseURL + config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[API] Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

