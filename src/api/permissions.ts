import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import { isAdminApiSuccess, AdminAuthError } from "@/api/adminAuth";
import type {
  AdminPermission,
  AdminPermissionListParams,
  AdminPermissionWritePayload,
  ApiResponse,
} from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";

function throwPermissionError(fallbackKey: string, error: unknown): never {
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

export function normalizeAdminPermission(raw: unknown): AdminPermission | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    module: String(r.module ?? ""),
    path: String(r.path ?? ""),
    method: String(r.method ?? "").toUpperCase(),
    type: String(r.type ?? "ACTION").toUpperCase(),
    active: r.active !== false,
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

function assertSuccessData(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): AdminPermission {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }

  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const item =
    normalizeAdminPermission(raw) ?? normalizeAdminPermission(nested);

  if (!item) {
    return {
      id: 0,
      name: "",
      description: "",
      module: "",
      path: "",
      method: "",
      type: "ACTION",
      active: true,
    };
  }
  return item;
}

function buildWriteBody(payload: AdminPermissionWritePayload) {
  return {
    name: payload.name.trim(),
    description: payload.description?.trim() ?? "",
    module: payload.module.trim(),
    path: payload.path.trim(),
    method: payload.method.trim().toUpperCase(),
    type: payload.type.trim().toUpperCase(),
    active: payload.active !== false,
  };
}

/** GET /admin/permissions */
export async function fetchPermissions(
  params: AdminPermissionListParams = {},
): Promise<PaginatedList<AdminPermission>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.module?.trim()) query.module = params.module.trim();
    if (params.method?.trim())
      query.method = params.method.trim().toUpperCase();
    if (params.type?.trim()) query.type = params.type.trim().toUpperCase();
    if (params.active != null) query.active = params.active;
    if (params.deleted != null) query.deleted = params.deleted;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/admin/permissions", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.permissionLoadFailed",
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
      .map(normalizeAdminPermission)
      .filter((item): item is AdminPermission => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwPermissionError("apiErrors.permissionLoadFailed", error);
  }
}

/** GET /admin/permissions/:id */
export async function fetchPermissionById(
  id: number,
): Promise<AdminPermission> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/admin/permissions/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.permissionLoadFailed");
  } catch (error) {
    throwPermissionError("apiErrors.permissionLoadFailed", error);
  }
}

/** POST /admin/permissions */
export async function createPermission(
  payload: AdminPermissionWritePayload,
): Promise<AdminPermission> {
  requireBackend();
  if (!payload.name.trim() || !payload.module.trim() || !payload.path.trim()) {
    throw new AdminAuthError("apiErrors.permissionRequired");
  }

  try {
    const res = (await axios.post(
      "/admin/permissions",
      buildWriteBody(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.permissionSaveFailed");
  } catch (error) {
    throwPermissionError("apiErrors.permissionSaveFailed", error);
  }
}

/** PUT /admin/permissions/:id */
export async function updatePermission(
  id: number,
  payload: AdminPermissionWritePayload,
): Promise<AdminPermission> {
  requireBackend();
  if (!payload.name.trim() || !payload.module.trim() || !payload.path.trim()) {
    throw new AdminAuthError("apiErrors.permissionRequired");
  }

  try {
    const res = (await axios.put(
      `/admin/permissions/${id}`,
      buildWriteBody(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.permissionSaveFailed");
  } catch (error) {
    throwPermissionError("apiErrors.permissionSaveFailed", error);
  }
}

/** DELETE /admin/permissions/:id — soft delete */
export async function softDeletePermission(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/permissions/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.permissionDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwPermissionError("apiErrors.permissionDeleteFailed", error);
  }
}

/** PATCH /admin/permissions/:id/restore */
export async function restorePermission(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/permissions/${id}/restore`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.permissionRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwPermissionError("apiErrors.permissionRestoreFailed", error);
  }
}

/** DELETE /admin/permissions/:id/permanent */
export async function permanentDeletePermission(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/permissions/${id}/permanent`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.permissionDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwPermissionError("apiErrors.permissionDeleteFailed", error);
  }
}
