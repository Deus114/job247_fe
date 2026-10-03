import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  ApiPagination,
  PaginatedList,
  Province,
  ProvinceListParams,
  ProvinceWritePayload,
  PublicProvince,
} from "@/types/catalog";
import { normalizeProvinceRegion } from "@/types/catalog";
import { isAxiosError } from "axios";

function throwProvinceError(fallbackKey: string, error: unknown): never {
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

export function normalizeProvince(raw: unknown): Province | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  const regionRaw = r.region;
  const regionText =
    regionRaw && typeof regionRaw === "object"
      ? String(
          (regionRaw as Record<string, unknown>).code ??
            (regionRaw as Record<string, unknown>).name ??
            (regionRaw as Record<string, unknown>).value ??
            "",
        )
      : String(regionRaw ?? "");

  return {
    id,
    name: String(r.name ?? ""),
    region: normalizeProvinceRegion(regionText),
    sortOrder: Number(r.sortOrder) || 0,
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
): Province {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }

  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const item = normalizeProvince(raw) ?? normalizeProvince(nested);

  if (!item) {
    return {
      id: 0,
      name: "",
      region: "",
      sortOrder: 0,
      active: true,
      createdAt: "",
      updatedAt: "",
    };
  }
  return item;
}

function buildWriteBody(payload: ProvinceWritePayload) {
  const region = normalizeProvinceRegion(payload.region);
  return {
    name: payload.name.trim(),
    region,
    sortOrder: Number(payload.sortOrder) || 0,
    active: payload.active !== false,
  };
}

/** GET /admin/provinces */
export async function fetchProvinces(
  params: ProvinceListParams = {},
): Promise<PaginatedList<Province>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.region?.trim())
      query.region = params.region.trim().toUpperCase();
    if (params.active != null) query.active = params.active;
    if (params.deleted != null) query.deleted = params.deleted;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/admin/provinces", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.provinceLoadFailed",
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
      .map(normalizeProvince)
      .filter((item): item is Province => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwProvinceError("apiErrors.provinceLoadFailed", error);
  }
}

/** GET /admin/provinces/:id */
export async function fetchProvinceById(id: number): Promise<Province> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/admin/provinces/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.provinceLoadFailed");
  } catch (error) {
    throwProvinceError("apiErrors.provinceLoadFailed", error);
  }
}

/** POST /admin/provinces */
export async function createProvince(
  payload: ProvinceWritePayload,
): Promise<Province> {
  requireBackend();

  if (!payload.name.trim() || !normalizeProvinceRegion(payload.region)) {
    throw new AdminAuthError("apiErrors.provinceNameRequired");
  }

  try {
    const res = (await axios.post(
      "/admin/provinces",
      buildWriteBody(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.provinceSaveFailed");
  } catch (error) {
    throwProvinceError("apiErrors.provinceSaveFailed", error);
  }
}

/** PUT /admin/provinces/:id */
export async function updateProvince(
  id: number,
  payload: ProvinceWritePayload,
): Promise<Province> {
  requireBackend();

  if (!payload.name.trim() || !normalizeProvinceRegion(payload.region)) {
    throw new AdminAuthError("apiErrors.provinceNameRequired");
  }

  try {
    const res = (await axios.put(
      `/admin/provinces/${id}`,
      buildWriteBody(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.provinceSaveFailed");
  } catch (error) {
    throwProvinceError("apiErrors.provinceSaveFailed", error);
  }
}

/** DELETE /admin/provinces/:id — soft delete */
export async function softDeleteProvince(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/provinces/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.provinceDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwProvinceError("apiErrors.provinceDeleteFailed", error);
  }
}

/** PATCH /admin/provinces/:id/restore */
export async function restoreProvince(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/provinces/${id}/restore`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.provinceRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwProvinceError("apiErrors.provinceRestoreFailed", error);
  }
}

/** DELETE /admin/provinces/:id/permanent */
export async function permanentDeleteProvince(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/provinces/${id}/permanent`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.provinceDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwProvinceError("apiErrors.provinceDeleteFailed", error);
  }
}

function normalizePublicProvince(raw: unknown): PublicProvince | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    name: String(r.name ?? ""),
    region: String(r.region ?? ""),
    sortOrder: Number(r.sortOrder) || 0,
  };
}

/** GET /provinces — public catalog for employer forms. */
export async function fetchPublicProvinces(
  params: { page?: number; size?: number; sort?: string } = {},
): Promise<PaginatedList<PublicProvince>> {
  requireBackend();

  try {
    const res = (await axios.get("/provinces", {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 100,
        sort: params.sort ?? "sortOrder,ASC",
      },
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.provinceLoadFailed",
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
      .map(normalizePublicProvince)
      .filter((item): item is PublicProvince => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwProvinceError("apiErrors.provinceLoadFailed", error);
  }
}
