import axios from 'axios';
import { getAuthToken } from './auth';

const baseURL = 'https://temple-meals-api.onrender.com';

const api = axios.create({
  baseURL: `${baseURL}/api`
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

