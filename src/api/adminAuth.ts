import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import type {
  AdminLoginData,
  AdminPermission,
  AdminRole,
  AdminSessionUser,
  ApiResponse,
} from "@/types/adminAuth";
import { isValidAdminSession } from "@/types/adminAuth";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  clearAdminTokens,
  persistAdminTokens,
} from "@/api/adminAuthTokens";

export {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  clearAdminTokens,
} from "@/api/adminAuthTokens";

export interface AdminLoginPayload {
  userName: string;
  password: string;
}

export interface AdminLoginResult {
  user: AdminSessionUser;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export class AdminAuthError extends Error {
  /** i18n key under `apiErrors.*` — resolve with `resolveAdminAuthErrorMessage` */
  messageKey: string;
  statusCode?: number;
  /** Prefer when backend already localized the message (via Accept-Language) */
  serverMessage?: string;

  constructor(messageKey: string, statusCode?: number, serverMessage?: string) {
    super(serverMessage || messageKey);
    this.name = "AdminAuthError";
    this.messageKey = messageKey;
    this.statusCode = statusCode;
    this.serverMessage = serverMessage;
  }
}

/** Resolve error text for UI: server message first, then i18n key. */
export function resolveAdminAuthErrorMessage(
  error: AdminAuthError,
  t: (key: string) => string,
): string {
  if (error.serverMessage?.trim()) return error.serverMessage.trim();
  return t(error.messageKey);
}

/** Backend may use 0 (app code), 200, or 201 (Created) for success. */
export function isAdminApiSuccess(
  statusCode: number | undefined | null,
): boolean {
  return statusCode === 0 || statusCode === 200 || statusCode === 201;
}

function normalizePermissions(raw: unknown): AdminPermission[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const p = (item && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    return {
      id: Number(p.id) || index,
      name: String(p.name ?? ""),
      description: String(p.description ?? ""),
      module: String(p.module ?? ""),
      path: String(p.path ?? ""),
      method: String(p.method ?? ""),
      type: String(p.type ?? "ACTION"),
      active: p.active !== false,
    };
  });
}

function normalizeRole(raw: unknown): AdminRole {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      name: "Admin",
      description: "",
      fullAccess: true,
      active: true,
      permissions: [],
    };
  }
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id) || 0,
    name: String(r.name ?? "Admin"),
    description: String(r.description ?? ""),
    fullAccess: Boolean(r.fullAccess),
    active: r.active !== false,
    permissions: normalizePermissions(r.permissions),
  };
}

/** Normalize backend user payload into AdminSessionUser for Redux/UI. */
export function normalizeAdminSessionUser(
  raw: unknown,
): AdminSessionUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  const username = String(u.username ?? u.userName ?? "");
  const name = String(u.name ?? u.fullName ?? username) || "Admin";

  return {
    id: Number(u.id) || 0,
    username,
    name,
    avatar: String(u.avatar ?? ""),
    role: normalizeRole(u.role),
    active: u.active !== false,
    createdAt: String(u.createdAt ?? ""),
    updatedAt: String(u.updatedAt ?? ""),
  };
}

function pickToken(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseAuthSessionData(
  data: Record<string, unknown>,
  statusCode: number | undefined,
  message: string,
): AdminLoginResult {
  const user = normalizeAdminSessionUser(data.user);
  const accessToken = pickToken(data, "accessToken", "access_token", "token");
  const refreshToken = pickToken(data, "refreshToken", "refresh_token");

  if (!user || !accessToken) {
    throw new AdminAuthError(
      "apiErrors.loginMissingData",
      statusCode,
      message,
    );
  }

  if (!isValidAdminSession(user)) {
    throw new AdminAuthError(
      "apiErrors.loginInactiveAccount",
      statusCode,
      message,
    );
  }

  persistAdminTokens(accessToken, refreshToken || undefined);

  return {
    user,
    accessToken,
    refreshToken: refreshToken || "",
    message: message || "",
  };
}

/** POST /admin/auth/login — body `{ userName, password }` */
export async function adminLoginRequest(
  payload: AdminLoginPayload,
): Promise<AdminLoginResult> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  clearAdminTokens();

  try {
    const res = (await axios.post(
      "/admin/auth/login",
      {
        userName: payload.userName.trim(),
        password: payload.password,
      },
      { skipAuthRefresh: true },
    )) as ApiResponse<AdminLoginData | Record<string, unknown>>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }

    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.loginFailed",
        res.statusCode,
        res.message,
      );
    }

    const data = (
      res.data && typeof res.data === "object" ? res.data : {}
    ) as Record<string, unknown>;

    return parseAuthSessionData(data, res.statusCode, res.message || "");
  } catch (error) {
    clearAdminTokens();
    if (error instanceof AdminAuthError) throw error;

    if (isAxiosError(error)) {
      const body = error.response?.data as ApiResponse<unknown> | undefined;
      const key =
        error.code === "ERR_NETWORK"
          ? "apiErrors.networkError"
          : "apiErrors.loginFailed";
      throw new AdminAuthError(
        key,
        body?.statusCode ?? error.response?.status,
        body?.message,
      );
    }

    throw new AdminAuthError("apiErrors.loginFailed");
  }
}

let refreshInFlight: Promise<AdminLoginResult> | null = null;

/**
 * POST /admin/auth/refresh — body `{ refreshToken }`.
 * Single-flight: concurrent callers share one request.
 */
export async function adminRefreshRequest(
  refreshTokenOverride?: string,
): Promise<AdminLoginResult> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  if (refreshInFlight) return refreshInFlight;

  const refreshToken =
    refreshTokenOverride?.trim() ||
    localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) ||
    "";

  if (!refreshToken) {
    clearAdminTokens();
    throw new AdminAuthError("apiErrors.sessionExpired");
  }

  refreshInFlight = (async () => {
    try {
      const res = (await axios.post(
        "/admin/auth/refresh",
        { refreshToken },
        { skipAuthRefresh: true },
      )) as ApiResponse<AdminLoginData | Record<string, unknown>>;

      if (!res || typeof res !== "object") {
        throw new AdminAuthError("apiErrors.invalidResponse");
      }

      if (!isAdminApiSuccess(res.statusCode)) {
        throw new AdminAuthError(
          "apiErrors.sessionExpired",
          res.statusCode,
          res.message,
        );
      }

      const data = (
        res.data && typeof res.data === "object" ? res.data : {}
      ) as Record<string, unknown>;

      return parseAuthSessionData(data, res.statusCode, res.message || "");
    } catch (error) {
      clearAdminTokens();
      if (error instanceof AdminAuthError) throw error;

      if (isAxiosError(error)) {
        const body = error.response?.data as ApiResponse<unknown> | undefined;
        const key =
          error.code === "ERR_NETWORK"
            ? "apiErrors.networkError"
            : "apiErrors.sessionExpired";
        throw new AdminAuthError(
          key,
          body?.statusCode ?? error.response?.status,
          body?.message,
        );
      }

      throw new AdminAuthError("apiErrors.sessionExpired");
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export type EnsureAdminSessionResult =
  | { ok: true; user: AdminSessionUser; refreshed: boolean }
  | { ok: false; reason: "unauthenticated" | "session_expired" | "network" };

function authErrorStatus(error: unknown): number | undefined {
  if (error instanceof AdminAuthError) return error.statusCode;
  if (isAxiosError(error)) return error.response?.status;
  return undefined;
}

function isNetworkAuthError(error: unknown): boolean {
  if (error instanceof AdminAuthError) {
    return error.messageKey === "apiErrors.networkError";
  }
  return isAxiosError(error) && error.code === "ERR_NETWORK";
}

/**
 * Bootstrap admin session when revisiting the app (server decides expiry):
 * 1) GET /admin/users/me with current access token
 * 2) On 401/403 (or missing access) → POST /admin/auth/refresh then retry /me
 * 3) On refresh failure → clear tokens
 */
export async function ensureAdminSession(): Promise<EnsureAdminSessionResult> {
  if (!env.apiBaseUrl) {
    return { ok: false, reason: "unauthenticated" };
  }

  const accessToken = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);

  if (!accessToken && !refreshToken) {
    return { ok: false, reason: "unauthenticated" };
  }

  let refreshed = false;
  let sessionUser: AdminSessionUser | null = null;

  try {
    // No access token but still have refresh → refresh first
    if (!accessToken && refreshToken) {
      const session = await adminRefreshRequest(refreshToken);
      sessionUser = session.user;
      refreshed = true;
    }

    try {
      const user = await fetchAdminMe();
      return { ok: true, user, refreshed };
    } catch (meError) {
      if (isNetworkAuthError(meError)) {
        if (sessionUser) return { ok: true, user: sessionUser, refreshed };
        return { ok: false, reason: "network" };
      }

      const status = authErrorStatus(meError);
      if (status !== 401 && status !== 403) {
        if (sessionUser) return { ok: true, user: sessionUser, refreshed };
        return { ok: false, reason: "network" };
      }

      if (!localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)) {
        clearAdminTokens();
        return { ok: false, reason: "session_expired" };
      }

      const session = await adminRefreshRequest();
      refreshed = true;
      try {
        const user = await fetchAdminMe();
        return { ok: true, user, refreshed };
      } catch {
        return { ok: true, user: session.user, refreshed };
      }
    }
  } catch (error) {
    clearAdminTokens();
    if (isNetworkAuthError(error)) {
      return { ok: false, reason: "network" };
    }
    return { ok: false, reason: "session_expired" };
  }
}

function throwAdminMeError(fallbackKey: string, error: unknown): never {
  if (error instanceof AdminAuthError) throw error;

  if (isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const key =
      error.code === "ERR_NETWORK" ? "apiErrors.networkError" : fallbackKey;
    throw new AdminAuthError(
      key,
      body?.statusCode ?? error.response?.status,
      body?.message,
    );
  }

  throw new AdminAuthError(fallbackKey);
}

/** GET /admin/users/me — current admin profile for session/UI. */
export async function fetchAdminMe(): Promise<AdminSessionUser> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  try {
    const res = (await axios.get(
      "/admin/users/me",
    )) as ApiResponse<AdminSessionUser | Record<string, unknown>>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }

    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminMeLoadFailed",
        res.statusCode,
        res.message,
      );
    }

    const user = normalizeAdminSessionUser(res.data);
    if (!user) {
      throw new AdminAuthError(
        "apiErrors.adminMeMissingData",
        res.statusCode,
        res.message,
      );
    }

    if (!isValidAdminSession(user)) {
      throw new AdminAuthError(
        "apiErrors.loginInactiveAccount",
        res.statusCode,
        res.message,
      );
    }

    return user;
  } catch (error) {
    throwAdminMeError("apiErrors.adminMeLoadFailed", error);
  }
}

export interface UpdateAdminMePayload {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
  avatarFile?: File;
}

/**
 * PUT /admin/users/me — multipart/form-data.
 * Password change requires both currentPassword and newPassword.
 */
export async function updateAdminMe(
  payload: UpdateAdminMePayload,
): Promise<AdminSessionUser> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  const body = new FormData();
  if (payload.name != null && payload.name.trim() !== "") {
    body.append("name", payload.name.trim());
  }
  if (payload.currentPassword) {
    body.append("currentPassword", payload.currentPassword);
  }
  if (payload.newPassword) {
    body.append("newPassword", payload.newPassword);
  }
  if (payload.avatarFile) {
    body.append("avatar", payload.avatarFile);
  }

  if ([...body.keys()].length === 0) {
    throw new AdminAuthError("apiErrors.adminMeNothingToUpdate");
  }

  try {
    const res = (await axios.put(
      "/admin/users/me",
      body,
    )) as ApiResponse<AdminSessionUser | Record<string, unknown>>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }

    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminMeUpdateFailed",
        res.statusCode,
        res.message,
      );
    }

    const user = normalizeAdminSessionUser(res.data);
    if (!user) {
      throw new AdminAuthError(
        "apiErrors.adminMeMissingData",
        res.statusCode,
        res.message,
      );
    }

    return user;
  } catch (error) {
    throwAdminMeError("apiErrors.adminMeUpdateFailed", error);
  }
}
