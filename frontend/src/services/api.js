import axios from 'axios';
import { getAuthToken } from './auth';

// Determine API base URL
const getApiUrl = () => {
  // In development with Vite, use relative path (proxied by vite.config.mts)
  if (import.meta.env.DEV) {
    console.log('[API] Development mode - using /api proxy');
    return '/api';
  }

  // In production, use environment variable or fallback to current domain
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const fullUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    console.log('[API] Production mode - using VITE_API_URL:', fullUrl);
    return fullUrl;
  }

  console.log('[API] Fallback - using relative /api');
  return '/api';
};

const baseURL = getApiUrl();
console.log('[API] Creating axios instance with baseURL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('[API] Request:', config.method?.toUpperCase(), baseURL + config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response OK:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('[API] Error:', error.message, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;

