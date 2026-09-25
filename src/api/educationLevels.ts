import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import { isAdminApiSuccess, AdminAuthError } from "@/api/adminAuth";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  EducationLevel,
  EducationLevelListParams,
  EducationLevelWritePayload,
  PaginatedList,
  ApiPagination,
} from "@/types/catalog";

function throwEducationError(fallbackKey: string, error: unknown): never {
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

export function normalizeEducationLevel(raw: unknown): EducationLevel | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    nameVi: String(r.nameVi ?? ""),
    nameEn: String(r.nameEn ?? ""),
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
): EducationLevel {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }

  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const item = normalizeEducationLevel(raw) ?? normalizeEducationLevel(nested);

  if (!item) {
    return {
      id: 0,
      nameVi: "",
      nameEn: "",
      sortOrder: 0,
      active: true,
      createdAt: "",
      updatedAt: "",
    };
  }
  return item;
}

function buildWriteBody(payload: EducationLevelWritePayload) {
  return {
    nameVi: payload.nameVi.trim(),
    nameEn: payload.nameEn.trim(),
    sortOrder: Number(payload.sortOrder) || 0,
    active: payload.active !== false,
  };
}

/** GET /admin/education-levels */
export async function fetchEducationLevels(
  params: EducationLevelListParams = {},
): Promise<PaginatedList<EducationLevel>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.active != null) query.active = params.active;
    if (params.deleted != null) query.deleted = params.deleted;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/admin/education-levels", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.educationLoadFailed",
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
      .map(normalizeEducationLevel)
      .filter((item): item is EducationLevel => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwEducationError("apiErrors.educationLoadFailed", error);
  }
}

/** GET /admin/education-levels/:id */
export async function fetchEducationLevelById(
  id: number,
): Promise<EducationLevel> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/admin/education-levels/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.educationLoadFailed");
  } catch (error) {
    throwEducationError("apiErrors.educationLoadFailed", error);
  }
}

/** POST /admin/education-levels */
export async function createEducationLevel(
  payload: EducationLevelWritePayload,
): Promise<EducationLevel> {
  requireBackend();

  if (!payload.nameVi.trim() || !payload.nameEn.trim()) {
    throw new AdminAuthError("apiErrors.educationNameRequired");
  }

  try {
    const res = (await axios.post(
      "/admin/education-levels",
      buildWriteBody(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.educationSaveFailed");
  } catch (error) {
    throwEducationError("apiErrors.educationSaveFailed", error);
  }
}

/** PUT /admin/education-levels/:id */
export async function updateEducationLevel(
  id: number,
  payload: EducationLevelWritePayload,
): Promise<EducationLevel> {
  requireBackend();

  if (!payload.nameVi.trim() || !payload.nameEn.trim()) {
    throw new AdminAuthError("apiErrors.educationNameRequired");
  }

  try {
    const res = (await axios.put(
      `/admin/education-levels/${id}`,
      buildWriteBody(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.educationSaveFailed");
  } catch (error) {
    throwEducationError("apiErrors.educationSaveFailed", error);
  }
}

/** DELETE /admin/education-levels/:id — soft delete */
export async function softDeleteEducationLevel(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/education-levels/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.educationDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwEducationError("apiErrors.educationDeleteFailed", error);
  }
}

/** PATCH /admin/education-levels/:id/restore */
export async function restoreEducationLevel(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/education-levels/${id}/restore`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.educationRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwEducationError("apiErrors.educationRestoreFailed", error);
  }
}

/** DELETE /admin/education-levels/:id/permanent */
export async function permanentDeleteEducationLevel(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/education-levels/${id}/permanent`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.educationDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwEducationError("apiErrors.educationDeleteFailed", error);
  }
}
