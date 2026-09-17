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

export const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token";
export const ADMIN_REFRESH_TOKEN_KEY = "admin_refresh_token";

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

function persistAdminTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  }
}

export function clearAdminTokens() {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
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

/** POST /admin/auth/login — body `{ userName, password }` */
export async function adminLoginRequest(
  payload: AdminLoginPayload,
): Promise<AdminLoginResult> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  clearAdminTokens();

  try {
    const res = (await axios.post("/admin/auth/login", {
      userName: payload.userName.trim(),
      password: payload.password,
    })) as ApiResponse<AdminLoginData | Record<string, unknown>>;

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

    const user = normalizeAdminSessionUser(data.user);
    const accessToken = pickToken(data, "accessToken", "access_token", "token");
    const refreshToken = pickToken(data, "refreshToken", "refresh_token");

    if (!user || !accessToken) {
      throw new AdminAuthError(
        "apiErrors.loginMissingData",
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

    persistAdminTokens(accessToken, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
      message: res.message || "",
    };
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
