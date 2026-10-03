import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import { isAdminApiSuccess, AdminAuthError } from "@/api/adminAuth";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  IndustryGroup,
  IndustryGroupListParams,
  IndustryGroupWritePayload,
  PublicIndustry,
  PublicIndustryGroup,
  PaginatedList,
  ApiPagination,
} from "@/types/catalog";

function throwIndustryGroupError(fallbackKey: string, error: unknown): never {
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

export function normalizeIndustryGroup(raw: unknown): IndustryGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    nameVi: String(r.nameVi ?? ""),
    nameEn: String(r.nameEn ?? ""),
    descriptionVi: String(r.descriptionVi ?? ""),
    descriptionEn: String(r.descriptionEn ?? ""),
    sortOrder: Number(r.sortOrder) || 0,
    image: String(r.image ?? ""),
    active: r.active !== false,
    industryCount: Number(r.industryCount) || 0,
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

function buildWriteFormData(payload: IndustryGroupWritePayload): FormData {
  const body = new FormData();
  body.append("nameVi", payload.nameVi.trim());
  body.append("nameEn", payload.nameEn.trim());
  if (payload.descriptionVi != null) {
    body.append("descriptionVi", payload.descriptionVi.trim());
  }
  if (payload.descriptionEn != null) {
    body.append("descriptionEn", payload.descriptionEn.trim());
  }
  if (payload.sortOrder != null && Number.isFinite(payload.sortOrder)) {
    body.append("sortOrder", String(payload.sortOrder));
  }
  if (payload.active != null) {
    body.append("active", String(payload.active));
  }

  // Exclusive: imageFile XOR image (same rule as business-config banners)
  if (payload.imageFile) {
    body.append("imageFile", payload.imageFile);
  } else if (payload.image != null && payload.image.trim() !== "") {
    body.append("image", payload.image.trim());
  }

  return body;
}

function assertSuccessData(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): IndustryGroup {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }

  // Accept entity at data, or nested data.data (some list-style envelopes).
  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const item = normalizeIndustryGroup(raw) ?? normalizeIndustryGroup(nested);

  // Write APIs sometimes return success with empty/partial body — treat as OK.
  if (!item) {
    return {
      id: 0,
      nameVi: "",
      nameEn: "",
      descriptionVi: "",
      descriptionEn: "",
      sortOrder: 0,
      image: "",
      active: true,
      industryCount: 0,
      createdAt: "",
      updatedAt: "",
    };
  }
  return item;
}

/** GET /admin/industry-groups */
export async function fetchIndustryGroups(
  params: IndustryGroupListParams = {},
): Promise<PaginatedList<IndustryGroup>> {
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

    const res = (await axios.get("/admin/industry-groups", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.industryGroupLoadFailed",
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
      .map(normalizeIndustryGroup)
      .filter((g): g is IndustryGroup => g != null);

    const pagination = normalizePagination(envelope.pagination);

    return { data, pagination };
  } catch (error) {
    throwIndustryGroupError("apiErrors.industryGroupLoadFailed", error);
  }
}

/** GET /admin/industry-groups/:id */
export async function fetchIndustryGroupById(
  id: number,
): Promise<IndustryGroup> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/admin/industry-groups/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.industryGroupLoadFailed");
  } catch (error) {
    throwIndustryGroupError("apiErrors.industryGroupLoadFailed", error);
  }
}

/** POST /admin/industry-groups — multipart/form-data */
export async function createIndustryGroup(
  payload: IndustryGroupWritePayload,
): Promise<IndustryGroup> {
  requireBackend();

  if (!payload.nameVi.trim() || !payload.nameEn.trim()) {
    throw new AdminAuthError("apiErrors.industryGroupNameRequired");
  }

  try {
    const res = (await axios.post(
      "/admin/industry-groups",
      buildWriteFormData(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.industryGroupSaveFailed");
  } catch (error) {
    throwIndustryGroupError("apiErrors.industryGroupSaveFailed", error);
  }
}

/** PUT /admin/industry-groups/:id — multipart/form-data */
export async function updateIndustryGroup(
  id: number,
  payload: IndustryGroupWritePayload,
): Promise<IndustryGroup> {
  requireBackend();

  if (!payload.nameVi.trim() || !payload.nameEn.trim()) {
    throw new AdminAuthError("apiErrors.industryGroupNameRequired");
  }

  try {
    const res = (await axios.put(
      `/admin/industry-groups/${id}`,
      buildWriteFormData(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.industryGroupSaveFailed");
  } catch (error) {
    throwIndustryGroupError("apiErrors.industryGroupSaveFailed", error);
  }
}

/** DELETE /admin/industry-groups/:id — soft delete */
export async function softDeleteIndustryGroup(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/industry-groups/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.industryGroupDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwIndustryGroupError("apiErrors.industryGroupDeleteFailed", error);
  }
}

/** PATCH /admin/industry-groups/:id/restore */
export async function restoreIndustryGroup(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/industry-groups/${id}/restore`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.industryGroupRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwIndustryGroupError("apiErrors.industryGroupRestoreFailed", error);
  }
}

/** DELETE /admin/industry-groups/:id/permanent */
export async function permanentDeleteIndustryGroup(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/industry-groups/${id}/permanent`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.industryGroupDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwIndustryGroupError("apiErrors.industryGroupDeleteFailed", error);
  }
}

function normalizePublicIndustry(raw: unknown): PublicIndustry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    sortOrder: Number(r.sortOrder) || 0,
    image: String(r.image ?? ""),
  };
}

function normalizePublicIndustryGroup(
  raw: unknown,
): PublicIndustryGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  const industries = Array.isArray(r.industries)
    ? r.industries
        .map(normalizePublicIndustry)
        .filter((item): item is PublicIndustry => item != null)
    : [];
  return {
    id,
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    sortOrder: Number(r.sortOrder) || 0,
    image: String(r.image ?? ""),
    industries,
  };
}

/** GET /industry-groups — public catalog with nested industries. */
export async function fetchPublicIndustryGroups(
  params: { page?: number; size?: number; sort?: string } = {},
): Promise<PaginatedList<PublicIndustryGroup>> {
  requireBackend();

  try {
    const res = (await axios.get("/industry-groups", {
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
        "apiErrors.industryGroupLoadFailed",
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
      .map(normalizePublicIndustryGroup)
      .filter((item): item is PublicIndustryGroup => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwIndustryGroupError("apiErrors.industryGroupLoadFailed", error);
  }
}
