import axios from 'axios';
import { getAuthToken } from './auth';

// Determine API base URL
const getApiUrl = () => {
  // In development, use relative /api (proxied by Vite)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use the VITE_API_URL environment variable or fallback to relative path
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  }
  
  // Fallback: use the current domain's /api endpoint
  return '/api';
};

const api = axios.create({
  baseURL: getApiUrl()
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('[API] Request:', config.method?.toUpperCase(), config.baseURL + config.url, { headers: config.headers });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('[API] Error response:', error.response?.status, error.response?.data, error.message);
    return Promise.reject(error);
  }
);

export default api;

