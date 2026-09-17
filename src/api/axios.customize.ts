import axios from 'axios';
import { env } from '@/config/env';
import i18n from '@/i18n';
import { getInitialLanguage, normalizeLanguage } from '@/i18n/langStorage';

const instance = axios.create({
  baseURL: env.apiBaseUrl || undefined,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

function currentAcceptLanguage(): string {
  return normalizeLanguage(i18n.language) || getInitialLanguage();
}

instance.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('admin_access_token');
    const userToken = localStorage.getItem('access_token');
    const token = adminToken || userToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Backend localizes responses via Accept-Language: vi | en
    config.headers['Accept-Language'] = currentAcceptLanguage();

    // Let the browser set multipart boundary for FormData uploads
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
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
