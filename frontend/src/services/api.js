import axios from 'axios';

// Use relative `/api` so local Vite dev server proxies correctly
const api = axios.create({
  baseURL: '/api'
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

