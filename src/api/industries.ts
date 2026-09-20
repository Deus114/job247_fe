import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import { isAdminApiSuccess, AdminAuthError } from "@/api/adminAuth";
import { normalizeIndustryGroup } from "@/api/industryGroups";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  Industry,
  IndustryListParams,
  IndustryWritePayload,
  PaginatedList,
  ApiPagination,
} from "@/types/catalog";

function throwIndustryError(fallbackKey: string, error: unknown): never {
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

export function normalizeIndustry(raw: unknown): Industry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  const group = normalizeIndustryGroup(r.industryGroup);
  const industryGroupId =
    Number(r.industryGroupId) ||
    group?.id ||
    Number(asRecord(r.industryGroup).id) ||
    0;

  return {
    id,
    industryGroup: group,
    industryGroupId,
    nameVi: String(r.nameVi ?? ""),
    nameEn: String(r.nameEn ?? ""),
    descriptionVi: String(r.descriptionVi ?? ""),
    descriptionEn: String(r.descriptionEn ?? ""),
    sortOrder: Number(r.sortOrder) || 0,
    image: String(r.image ?? ""),
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

function buildWriteFormData(payload: IndustryWritePayload): FormData {
  const body = new FormData();
  body.append("industryGroupId", String(payload.industryGroupId));
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

  // Exclusive: imageFile XOR image
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
): Industry {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }

  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const item = normalizeIndustry(raw) ?? normalizeIndustry(nested);

  if (!item) {
    return {
      id: 0,
      industryGroup: null,
      industryGroupId: 0,
      nameVi: "",
      nameEn: "",
      descriptionVi: "",
      descriptionEn: "",
      sortOrder: 0,
      image: "",
      active: true,
      createdAt: "",
      updatedAt: "",
    };
  }
  return item;
}

/** GET /admin/industries */
export async function fetchIndustries(
  params: IndustryListParams = {},
): Promise<PaginatedList<Industry>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.active != null) query.active = params.active;
    if (params.deleted != null) query.deleted = params.deleted;
    if (params.industryGroupId != null) {
      query.industryGroupId = params.industryGroupId;
    }
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/admin/industries", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.industryLoadFailed",
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
      .map(normalizeIndustry)
      .filter((item): item is Industry => item != null);

    const pagination = normalizePagination(envelope.pagination);

    return { data, pagination };
  } catch (error) {
    throwIndustryError("apiErrors.industryLoadFailed", error);
  }
}

/** GET /admin/industries/:id */
export async function fetchIndustryById(id: number): Promise<Industry> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/admin/industries/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.industryLoadFailed");
  } catch (error) {
    throwIndustryError("apiErrors.industryLoadFailed", error);
  }
}

/** POST /admin/industries — multipart/form-data */
export async function createIndustry(
  payload: IndustryWritePayload,
): Promise<Industry> {
  requireBackend();

  if (!payload.industryGroupId || !payload.nameVi.trim() || !payload.nameEn.trim()) {
    throw new AdminAuthError("apiErrors.industryNameRequired");
  }

  try {
    const res = (await axios.post(
      "/admin/industries",
      buildWriteFormData(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.industrySaveFailed");
  } catch (error) {
    throwIndustryError("apiErrors.industrySaveFailed", error);
  }
}

/** PUT /admin/industries/:id — multipart/form-data */
export async function updateIndustry(
  id: number,
  payload: IndustryWritePayload,
): Promise<Industry> {
  requireBackend();

  if (!payload.industryGroupId || !payload.nameVi.trim() || !payload.nameEn.trim()) {
    throw new AdminAuthError("apiErrors.industryNameRequired");
  }

  try {
    const res = (await axios.put(
      `/admin/industries/${id}`,
      buildWriteFormData(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertSuccessData(res, "apiErrors.industrySaveFailed");
  } catch (error) {
    throwIndustryError("apiErrors.industrySaveFailed", error);
  }
}

/** DELETE /admin/industries/:id — soft delete */
export async function softDeleteIndustry(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/industries/${id}`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.industryDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwIndustryError("apiErrors.industryDeleteFailed", error);
  }
}

/** PATCH /admin/industries/:id/restore */
export async function restoreIndustry(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/industries/${id}/restore`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.industryRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwIndustryError("apiErrors.industryRestoreFailed", error);
  }
}

/** DELETE /admin/industries/:id/permanent */
export async function permanentDeleteIndustry(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/industries/${id}/permanent`,
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.industryDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwIndustryError("apiErrors.industryDeleteFailed", error);
  }
}
