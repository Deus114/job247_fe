import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import { isAdminApiSuccess, AdminAuthError } from "@/api/adminAuth";
import { normalizeAdminPermission } from "@/api/permissions";
import type {
  AdminRole,
  AdminRoleListParams,
  AdminRoleWritePayload,
  ApiResponse,
} from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";

function throwRoleError(fallbackKey: string, error: unknown): never {
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

export function normalizeAdminRole(raw: unknown): AdminRole | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  const permissions = Array.isArray(r.permissions)
    ? r.permissions
        .map(normalizeAdminPermission)
        .filter((item) => item != null)
    : [];

  return {
    id,
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    fullAccess: Boolean(r.fullAccess),
    active: r.active !== false,
    permissions,
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? ""),
  };
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

function assertSuccessRole(res: ApiResponse<unknown>, fallbackKey: string): AdminRole {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }

  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const item = normalizeAdminRole(raw) ?? normalizeAdminRole(nested);
  if (!item) {
    throw new AdminAuthError("apiErrors.invalidResponse", res.statusCode, res.message);
  }
  return item;
}

function buildWriteBody(payload: AdminRoleWritePayload) {
  const permissionIds = [
    ...new Set(
      payload.permissionIds.filter((id) => Number.isFinite(id)).map(Number),
    ),
  ];
  return {
    name: payload.name.trim(),
    description: payload.description?.trim() ?? "",
    fullAccess: Boolean(payload.fullAccess),
    active: payload.active !== false,
    permissionIds,
  };
}

/** GET /admin/roles */
export async function fetchRoles(
  params: AdminRoleListParams = {},
): Promise<PaginatedList<AdminRole>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.fullAccess != null) query.fullAccess = params.fullAccess;
    if (params.active != null) query.active = params.active;
    if (params.deleted != null) query.deleted = params.deleted;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/admin/roles", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.roleLoadFailed",
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
      .map(normalizeAdminRole)
      .filter((item): item is AdminRole => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwRoleError("apiErrors.roleLoadFailed", error);
  }
}

/** GET /admin/roles/:id */
export async function fetchRoleById(id: number): Promise<AdminRole> {
  requireBackend();

  try {
    const res = (await axios.get(`/admin/roles/${id}`)) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessRole(res, "apiErrors.roleLoadFailed");
  } catch (error) {
    throwRoleError("apiErrors.roleLoadFailed", error);
  }
}

/** POST /admin/roles */
export async function createRole(
  payload: AdminRoleWritePayload,
): Promise<AdminRole> {
  requireBackend();
  if (!payload.name.trim()) {
    throw new AdminAuthError("apiErrors.roleNameRequired");
  }

  try {
    const res = (await axios.post(
      "/admin/roles",
      buildWriteBody(payload),
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessRole(res, "apiErrors.roleSaveFailed");
  } catch (error) {
    throwRoleError("apiErrors.roleSaveFailed", error);
  }
}

/** PUT /admin/roles/:id */
export async function updateRole(
  id: number,
  payload: AdminRoleWritePayload,
): Promise<AdminRole> {
  requireBackend();
  if (!payload.name.trim()) {
    throw new AdminAuthError("apiErrors.roleNameRequired");
  }

  try {
    const res = (await axios.put(
      `/admin/roles/${id}`,
      buildWriteBody(payload),
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessRole(res, "apiErrors.roleSaveFailed");
  } catch (error) {
    throwRoleError("apiErrors.roleSaveFailed", error);
  }
}

/** DELETE /admin/roles/:id — soft delete */
export async function softDeleteRole(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/roles/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.roleDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwRoleError("apiErrors.roleDeleteFailed", error);
  }
}

/** PATCH /admin/roles/:id/restore */
export async function restoreRole(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/roles/${id}/restore`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.roleRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwRoleError("apiErrors.roleRestoreFailed", error);
  }
}

/** DELETE /admin/roles/:id/permanent */
export async function permanentDeleteRole(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/roles/${id}/permanent`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.roleDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwRoleError("apiErrors.roleDeleteFailed", error);
  }
}
