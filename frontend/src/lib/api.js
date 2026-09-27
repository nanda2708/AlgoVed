import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const isCancel = (error) => axios.isCancel(error) || error?.code === 'ERR_CANCELED';

export const errorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || (error?.code === 'ECONNABORTED' ? 'The request timed out' : null) || fallback;

// Judging can take a while for problems with many tests.
export const JUDGE_TIMEOUT = 120000;

export default api;
