import axios from 'axios';
import { env } from '@/config/env';
import i18n from '@/i18n';
import { getInitialLanguage, normalizeLanguage } from '@/i18n/langStorage';
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  clearAdminTokens,
} from '@/api/adminAuthTokens';

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

function isAdminAuthPath(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/admin/auth/login') || url.includes('/admin/auth/refresh')
  );
}

async function syncReduxAfterRefresh(session: {
  user: import('@/types/adminAuth').AdminSessionUser;
  accessToken: string;
  refreshToken: string;
}) {
  try {
    const { store } = await import('@/store');
    const { adminLogin } = await import('@/store/slices/adminAuthSlice');
    store.dispatch(
      adminLogin({
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      }),
    );
  } catch {
    // tokens already persisted in localStorage
  }
}

async function forceAdminLogoutAndRedirect() {
  clearAdminTokens();
  try {
    const { store } = await import('@/store');
    const { adminLogout } = await import('@/store/slices/adminAuthSlice');
    store.dispatch(adminLogout());
  } catch {
    // ignore
  }

  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '';
  if (path.includes('/admin/login')) return;

  const base = (env.basePath || '/').replace(/\/$/, '');
  const loginPath = `${base}/admin/login`.replace(/\/{2,}/g, '/');
  window.location.assign(loginPath.startsWith('/') ? loginPath : `/${loginPath}`);
}

instance.interceptors.request.use(
  (config) => {
    if (!config.headers) {
      config.headers = {} as typeof config.headers;
    }
    config.headers['Accept-Language'] = currentAcceptLanguage();

    if (!config.skipAuthRefresh) {
      const adminToken = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      const userToken = localStorage.getItem('access_token');
      const token = adminToken || userToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else if (config.headers.Authorization) {
      delete config.headers.Authorization;
    }

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete (config.headers as Record<string, unknown>)['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => {
    if (response && response.data !== undefined) {
      return response.data;
    }
    return response;
  },
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    if (
      status !== 401 ||
      !original ||
      original.skipAuthRefresh ||
      original._retry ||
      isAdminAuthPath(original.url)
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const { adminRefreshRequest } = await import('@/api/adminAuth');
      const session = await adminRefreshRequest(refreshToken);
      await syncReduxAfterRefresh(session);
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${session.accessToken}`;
      return instance(original);
    } catch (refreshError) {
      await forceAdminLogoutAndRedirect();
      return Promise.reject(refreshError);
    }
  },
);

export default instance;
