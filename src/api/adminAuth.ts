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
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "AdminAuthError";
    this.statusCode = statusCode;
  }
}

/** Backend may use 0 (app code) or 200 (HTTP-style) for success. */
export function isAdminApiSuccess(
  statusCode: number | undefined | null,
): boolean {
  return statusCode === 0 || statusCode === 200;
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
    throw new AdminAuthError("Chưa cấu hình VITE_BACKEND_URL", undefined);
  }

  clearAdminTokens();

  try {
    const res = (await axios.post("/admin/auth/login", {
      userName: payload.userName.trim(),
      password: payload.password,
    })) as ApiResponse<AdminLoginData | Record<string, unknown>>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("Phản hồi không hợp lệ");
    }

    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        res.message || "Đăng nhập thất bại",
        res.statusCode,
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
        res.message || "Thiếu dữ liệu đăng nhập",
        res.statusCode,
      );
    }

    if (!isValidAdminSession(user)) {
      throw new AdminAuthError(
        res.message || "Tài khoản hoặc vai trò không còn hoạt động",
        res.statusCode,
      );
    }

    persistAdminTokens(accessToken, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
      message: res.message || "Đăng nhập thành công",
    };
  } catch (error) {
    clearAdminTokens();
    if (error instanceof AdminAuthError) throw error;

    if (isAxiosError(error)) {
      const body = error.response?.data as ApiResponse<unknown> | undefined;
      throw new AdminAuthError(
        body?.message ||
          (error.code === "ERR_NETWORK"
            ? "Không kết nối được máy chủ"
            : "Đăng nhập thất bại"),
        body?.statusCode ?? error.response?.status,
      );
    }

    throw new AdminAuthError("Đăng nhập thất bại");
  }
}
