import axios from 'axios';
import { getAuthToken } from './auth';

// Use relative `/api` so local Vite dev server proxies correctly
const api = axios.create({
  baseURL: '/api'
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

