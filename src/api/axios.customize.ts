import axios from 'axios';
import { env } from '@/config/env';

const instance = axios.create({
  baseURL: env.apiBaseUrl || undefined,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('admin_access_token');
    const userToken = localStorage.getItem('access_token');
    const token = adminToken || userToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => {
    // Any status code in 2xx — return payload directly
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Keep AxiosError so callers can distinguish network vs HTTP errors
    return Promise.reject(error);
  },
);

export default instance;
