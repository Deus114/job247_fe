import axios from "axios";
import { env } from "@/config/env";
import i18n from "@/i18n";
import { getInitialLanguage, normalizeLanguage } from "@/i18n/langStorage";
import { clearAdminTokens, getAdminAccessToken } from "@/api/adminAuthTokens";
import {
  clearPublicTokens,
  getPublicAccessToken,
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
    url.includes("/admin/auth/logout") ||
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/register") ||
    url.includes("/auth/otp/")
  );
}

async function syncReduxAfterAdminRefresh(session: {
  user: import("@/types/adminAuth").AdminSessionUser;
  accessToken: string;
}) {
  try {
    const { store } = await import("@/store");
    const { adminLogin } = await import("@/store/slices/adminAuthSlice");
    store.dispatch(adminLogin({ user: session.user }));
  } catch {
    // access already in RAM
  }
}

async function syncPublicSession(session: {
  user: import("@/types/user").AuthUser;
  accessToken: string;
}) {
  try {
    const { store } = await import("@/store");
    const { login } = await import("@/store/slices/authSlice");
    store.dispatch(login(session.user));
  } catch {
    // access already in RAM
  }
}

/** Paths that require a public (job-seeker/employer) session. */
function isProtectedPublicPath(pathname: string): boolean {
  const base = (env.basePath || "/").replace(/\/$/, "");
  let path = pathname || "/";
  if (base && base !== "/" && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }
  if (!path.startsWith("/")) path = `/${path}`;

  return (
    path === "/settings" ||
    path.startsWith("/settings/") ||
    path === "/saved-jobs" ||
    path.startsWith("/saved-jobs/") ||
    path === "/my-applications" ||
    path.startsWith("/my-applications/") ||
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/employer" ||
    path.startsWith("/employer/") ||
    path === "/post-job" ||
    path.startsWith("/post-job/") ||
    path === "/companies/manage" ||
    path.startsWith("/companies/manage/") ||
    path === "/companies/create" ||
    path.startsWith("/companies/create/") ||
    path.startsWith("/companies/edit/")
  );
}

/**
 * Clear public session after failed refresh.
 * Only hard-redirect to /login on protected routes — public pages stay browseable as guest.
 */
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
    path.includes("/admin") ||
    !isProtectedPublicPath(path)
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
        ? getAdminAccessToken()
        : getPublicAccessToken();
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

    original._retry = true;
    const refreshAdmin = isAdminRequest(original.url);

    try {
      if (refreshAdmin) {
        const { adminRefreshRequest } = await import("@/api/adminAuth");
        const session = await adminRefreshRequest();
        await syncReduxAfterAdminRefresh(session);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${session.accessToken}`;
        return instance(original);
      }

      const { refreshRequest } = await import("@/api/auth");
      const session = await refreshRequest();
      await syncPublicSession(session);
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${session.accessToken}`;
      return instance(original);
    } catch (refreshError) {
      if (refreshAdmin) {
        await forceAdminLogoutAndRedirect();
      } else {
        await forcePublicLogoutAndRedirect();
      }
      return Promise.reject(refreshError);
    }
  },
);

export default instance;
