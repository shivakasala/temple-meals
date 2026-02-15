import axios from 'axios';
import { getAuthToken } from './auth';

// Determine API base URL
const getApiUrl = () => {
  // In development, use relative /api (proxied by Vite)
  if (import.meta.env.DEV) {
    console.log('[API] Using development proxy to /api');
    return '/api';
  }
  
  // In production, use the VITE_API_URL environment variable or fallback to relative path
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const finalUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    console.log('[API] Using production API URL:', finalUrl);
    return finalUrl;
  }
  
  // Fallback: use the current domain's /api endpoint
  console.log('[API] Using fallback /api endpoint');
  return '/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('[API-DEBUG] Request:', {
    method: config.method?.toUpperCase(),
    url: config.baseURL + config.url,
    data: config.data
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API-DEBUG] ✅ Response Success:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
      dataType: typeof response.data,
      hasUser: !!response.data?.user
    });
    return response;
  },
  (error) => {
    console.error('[API-DEBUG] ❌ Response Error:', {
      status: error.response?.status,
      url: error.response?.config?.url,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    return Promise.reject(error);
  }
);

export default api;

