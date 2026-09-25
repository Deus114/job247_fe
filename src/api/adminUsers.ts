import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import {
  isAdminApiSuccess,
  AdminAuthError,
  normalizeAdminSessionUser,
} from "@/api/adminAuth";
import type { AdminSessionUser, ApiResponse } from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";

export interface AdminAccountListParams {
  keyword?: string;
  roleId?: number;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AdminAccountWritePayload {
  username: string;
  password?: string;
  name: string;
  roleId: number;
  active?: boolean;
  avatarFile?: File | null;
}

export interface AdminAccountUpdatePayload {
  username: string;
  name: string;
  roleId: number;
  active?: boolean;
  currentPassword?: string;
  newPassword?: string;
  avatarFile?: File | null;
}

function throwAccountError(fallbackKey: string, error: unknown): never {
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

function requireBackend(): void {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizePagination(raw: unknown): ApiPagination {
  const p = asRecord(raw);
  return {
    current_page: Number(p.current_page) || 1,
    last_page: Number(p.last_page) || 1,
    per_page: Number(p.per_page) || 10,
    total: Number(p.total) || 0,
    from: Number(p.from) || 0,
    to: Number(p.to) || 0,
  };
}

function assertAccount(res: ApiResponse<unknown>, fallbackKey: string): AdminSessionUser {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }
  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const user =
    normalizeAdminSessionUser(raw) ?? normalizeAdminSessionUser(nested);
  if (!user || !Number.isFinite(user.id)) {
    throw new AdminAuthError("apiErrors.invalidResponse", res.statusCode, res.message);
  }
  return user;
}

function appendAccountFields(
  body: FormData,
  payload: {
    username: string;
    name: string;
    roleId: number;
    active?: boolean;
    avatarFile?: File | null;
  },
) {
  body.append("username", payload.username.trim());
  body.append("name", payload.name.trim());
  body.append("roleId", String(payload.roleId));
  body.append("active", payload.active === false ? "false" : "true");
  if (payload.avatarFile) {
    body.append("avatar", payload.avatarFile);
  }
}

function buildCreateFormData(payload: AdminAccountWritePayload) {
  const body = new FormData();
  appendAccountFields(body, payload);
  body.append("password", payload.password?.trim() ?? "");
  return body;
}

function buildUpdateFormData(payload: AdminAccountUpdatePayload) {
  const body = new FormData();
  appendAccountFields(body, payload);
  const currentPassword = payload.currentPassword?.trim() ?? "";
  const newPassword = payload.newPassword?.trim() ?? "";
  if (currentPassword || newPassword) {
    if (!currentPassword || !newPassword) {
      throw new AdminAuthError("apiErrors.adminUserPasswordRequired");
    }
    body.append("currentPassword", currentPassword);
    body.append("newPassword", newPassword);
  }
  return body;
}

/** GET /admin/users */
export async function fetchAdminUsers(
  params: AdminAccountListParams = {},
): Promise<PaginatedList<AdminSessionUser>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.roleId != null && Number.isFinite(params.roleId)) {
      query.roleId = params.roleId;
    }
    if (params.active != null) query.active = params.active;
    if (params.deleted != null) query.deleted = params.deleted;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/admin/users", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminUserLoadFailed",
        res.statusCode,
        res.message,
      );
    }

    const envelope = asRecord(res.data);
    const rowsRaw = Array.isArray(res.data)
      ? res.data
      : Array.isArray(envelope.data)
        ? envelope.data
        : [];

    const data = rowsRaw
      .map(normalizeAdminSessionUser)
      .filter((item): item is AdminSessionUser => item != null && item.id > 0);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwAccountError("apiErrors.adminUserLoadFailed", error);
  }
}

/** GET /admin/users/:id */
export async function fetchAdminUserById(id: number): Promise<AdminSessionUser> {
  requireBackend();

  try {
    const res = (await axios.get(`/admin/users/${id}`)) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertAccount(res, "apiErrors.adminUserLoadFailed");
  } catch (error) {
    throwAccountError("apiErrors.adminUserLoadFailed", error);
  }
}

/** POST /admin/users — multipart/form-data */
export async function createAdminUser(
  payload: AdminAccountWritePayload,
): Promise<AdminSessionUser> {
  requireBackend();
  if (
    !payload.username.trim() ||
    !payload.password?.trim() ||
    !payload.name.trim() ||
    !Number.isFinite(payload.roleId)
  ) {
    throw new AdminAuthError("apiErrors.adminUserRequired");
  }

  try {
    const res = (await axios.post(
      "/admin/users",
      buildCreateFormData({ ...payload, password: payload.password.trim() }),
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertAccount(res, "apiErrors.adminUserSaveFailed");
  } catch (error) {
    throwAccountError("apiErrors.adminUserSaveFailed", error);
  }
}

/** PUT /admin/users/:id — multipart. Password fields are sent only when changing it. */
export async function updateAdminUser(
  id: number,
  payload: AdminAccountUpdatePayload,
): Promise<AdminSessionUser> {
  requireBackend();
  if (
    !payload.username.trim() ||
    !payload.name.trim() ||
    !Number.isFinite(payload.roleId)
  ) {
    throw new AdminAuthError("apiErrors.adminUserRequired");
  }

  try {
    const res = (await axios.put(
      `/admin/users/${id}`,
      buildUpdateFormData(payload),
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertAccount(res, "apiErrors.adminUserSaveFailed");
  } catch (error) {
    throwAccountError("apiErrors.adminUserSaveFailed", error);
  }
}

/** DELETE /admin/users/:id — soft delete */
export async function softDeleteAdminUser(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/users/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminUserDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwAccountError("apiErrors.adminUserDeleteFailed", error);
  }
}

/** PATCH /admin/users/:id/restore */
export async function restoreAdminUser(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/users/${id}/restore`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminUserRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwAccountError("apiErrors.adminUserRestoreFailed", error);
  }
}

/** DELETE /admin/users/:id/permanent */
export async function permanentDeleteAdminUser(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/users/${id}/permanent`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminUserDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwAccountError("apiErrors.adminUserDeleteFailed", error);
  }
}
