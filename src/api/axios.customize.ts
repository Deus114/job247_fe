import axios from "axios";
import { env } from "@/config/env";
import i18n from "@/i18n";
import { getInitialLanguage, normalizeLanguage } from "@/i18n/langStorage";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  clearAdminTokens,
} from "@/api/adminAuthTokens";
import {
  USER_ACCESS_TOKEN_KEY,
  USER_REFRESH_TOKEN_KEY,
  clearPublicTokens,
} from "@/api/publicAuthTokens";

const instance = axios.create({
  baseURL: env.apiBaseUrl || undefined,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function currentAcceptLanguage(): string {
  return normalizeLanguage(i18n.language) || getInitialLanguage();
}

function isAdminRequest(url?: string): boolean {
  return Boolean(url?.includes("/admin/"));
}

function skipsAuthRefresh(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes("/admin/auth/login") ||
    url.includes("/admin/auth/refresh") ||
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/register") ||
    url.includes("/auth/otp/")
  );
}

async function syncReduxAfterRefresh(session: {
  user: import("@/types/adminAuth").AdminSessionUser;
  accessToken: string;
  refreshToken: string;
}) {
  try {
    const { store } = await import("@/store");
    const { adminLogin } = await import("@/store/slices/adminAuthSlice");
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

async function syncPublicSession(session: {
  user: import("@/types/user").AuthUser;
  accessToken: string;
  refreshToken: string;
}) {
  try {
    const { store } = await import("@/store");
    const { login } = await import("@/store/slices/authSlice");
    store.dispatch(login(session.user));
  } catch {
    // tokens already persisted in localStorage
  }
}

async function forcePublicLogoutAndRedirect() {
  clearPublicTokens();
  try {
    const { store } = await import("@/store");
    const { logout } = await import("@/store/slices/authSlice");
    store.dispatch(logout());
  } catch {
    // ignore
  }

  if (typeof window === "undefined") return;
  const path = window.location.pathname || "";
  if (
    path === "/login" ||
    path.startsWith("/login/") ||
    path.includes("/admin")
  ) {
    return;
  }

  const base = (env.basePath || "/").replace(/\/$/, "");
  const loginPath = `${base}/login`.replace(/\/{2,}/g, "/");
  window.location.assign(
    loginPath.startsWith("/") ? loginPath : `/${loginPath}`,
  );
}

async function forceAdminLogoutAndRedirect() {
  clearAdminTokens();
  try {
    const { store } = await import("@/store");
    const { adminLogout } = await import("@/store/slices/adminAuthSlice");
    store.dispatch(adminLogout());
  } catch {
    // ignore
  }

  if (typeof window === "undefined") return;
  const path = window.location.pathname || "";
  if (path.includes("/admin/login")) return;

  const base = (env.basePath || "/").replace(/\/$/, "");
  const loginPath = `${base}/admin/login`.replace(/\/{2,}/g, "/");
  window.location.assign(
    loginPath.startsWith("/") ? loginPath : `/${loginPath}`,
  );
}

instance.interceptors.request.use(
  (config) => {
    if (!config.headers) {
      config.headers = {} as typeof config.headers;
    }
    config.headers["Accept-Language"] = currentAcceptLanguage();

    if (!config.skipAuthRefresh) {
      const token = isAdminRequest(config.url)
        ? localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
        : localStorage.getItem(USER_ACCESS_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete (config.headers as Record<string, unknown>)["Content-Type"];
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
      skipsAuthRefresh(original.url)
    ) {
      return Promise.reject(error);
    }

    const adminRefresh = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
    const userRefresh = localStorage.getItem(USER_REFRESH_TOKEN_KEY);
    const refreshAdmin = isAdminRequest(original.url) && Boolean(adminRefresh);
    const refreshUser = !refreshAdmin && Boolean(userRefresh);

    if (!refreshAdmin && !refreshUser) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (refreshUser && userRefresh) {
        const { refreshRequest } = await import("@/api/auth");
        const session = await refreshRequest(userRefresh);
        await syncPublicSession(session);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${session.accessToken}`;
        return instance(original);
      }

      const { adminRefreshRequest } = await import("@/api/adminAuth");
      const session = await adminRefreshRequest(adminRefresh || undefined);
      await syncReduxAfterRefresh(session);
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${session.accessToken}`;
      return instance(original);
    } catch (refreshError) {
      if (refreshUser) {
        await forcePublicLogoutAndRedirect();
      } else {
        await forceAdminLogoutAndRedirect();
      }
      return Promise.reject(refreshError);
    }
  },
);

export default instance;
