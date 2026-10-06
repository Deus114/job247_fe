import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import { isAdminApiSuccess, AdminAuthError } from "@/api/adminAuth";
import type { ApiResponse } from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import type {
  AdminCompany,
  AdminCompanyIndustry,
  AdminCompanyListParams,
  AdminCompanyMember,
  AdminCompanyMemberRole,
  AdminCompanyStatus,
  AdminCompanyUpdatePayload,
} from "@/types/company";

function throwCompanyError(fallbackKey: string, error: unknown): never {
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
  const page = asRecord(raw);
  return {
    current_page: Number(page.current_page) || 1,
    last_page: Number(page.last_page) || 1,
    per_page: Number(page.per_page) || 10,
    total: Number(page.total) || 0,
    from: Number(page.from) || 0,
    to: Number(page.to) || 0,
  };
}

function normalizeStatus(value: unknown): AdminCompanyStatus | null {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "PENDING" || raw === "APPROVED" || raw === "REJECTED") {
    return raw;
  }
  return null;
}

function normalizeMemberRole(value: unknown): AdminCompanyMemberRole {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  return raw === "ADMIN" ? "ADMIN" : "OWNER";
}

function normalizeIndustry(raw: unknown): AdminCompanyIndustry | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = Number(record.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    name: String(record.name ?? ""),
  };
}

function normalizeMember(raw: unknown): AdminCompanyMember | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = Number(record.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    userId: Number(record.userId) || 0,
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    phone: String(record.phone ?? ""),
    avatar: String(record.avatar ?? ""),
    role: normalizeMemberRole(record.role),
    active: record.active !== false,
    createdAt: String(record.createdAt ?? ""),
    updatedAt: String(record.updatedAt ?? ""),
  };
}

export function normalizeAdminCompany(raw: unknown): AdminCompany | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = Number(record.id);
  const status = normalizeStatus(record.status);
  if (!Number.isFinite(id) || !status) return null;

  const industriesRaw = Array.isArray(record.industries)
    ? record.industries
    : [];
  const membersRaw = Array.isArray(record.members) ? record.members : [];

  return {
    id,
    name: String(record.name ?? ""),
    size: String(record.size ?? ""),
    provinceId: Number(record.provinceId) || 0,
    provinceName: String(record.provinceName ?? ""),
    industries: industriesRaw
      .map(normalizeIndustry)
      .filter((item): item is AdminCompanyIndustry => item != null),
    address: String(record.address ?? ""),
    email: String(record.email ?? ""),
    phone: String(record.phone ?? ""),
    website: String(record.website ?? ""),
    logo: String(record.logo ?? ""),
    backgroundImage: String(record.backgroundImage ?? ""),
    taxCode: String(record.taxCode ?? ""),
    description: String(record.description ?? ""),
    status,
    rejectionReason: String(record.rejectionReason ?? ""),
    active: record.active !== false,
    members: membersRaw
      .map(normalizeMember)
      .filter((item): item is AdminCompanyMember => item != null),
    createdAt: String(record.createdAt ?? ""),
    updatedAt: String(record.updatedAt ?? ""),
  };
}

function assertCompany(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): AdminCompany {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }

  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const company = normalizeAdminCompany(raw) ?? normalizeAdminCompany(nested);

  if (!company) {
    throw new AdminAuthError(
      "apiErrors.invalidResponse",
      res.statusCode,
      res.message,
    );
  }
  return company;
}

/** GET /admin/companies */
export async function fetchAdminCompanies(
  params: AdminCompanyListParams = {},
): Promise<PaginatedList<AdminCompany>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.status) query.status = params.status;
    if (params.active != null) query.active = params.active;
    if (params.deleted != null) query.deleted = params.deleted;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/admin/companies", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminCompanyLoadFailed",
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
      .map(normalizeAdminCompany)
      .filter((item): item is AdminCompany => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwCompanyError("apiErrors.adminCompanyLoadFailed", error);
  }
}

/** GET /admin/companies/:id */
export async function fetchAdminCompanyById(id: number): Promise<AdminCompany> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/admin/companies/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertCompany(res, "apiErrors.adminCompanyLoadFailed");
  } catch (error) {
    throwCompanyError("apiErrors.adminCompanyLoadFailed", error);
  }
}

/** PUT /admin/companies/:id — body `{ active, status, rejectionReason? }`. */
export async function updateAdminCompany(
  id: number,
  payload: AdminCompanyUpdatePayload,
): Promise<AdminCompany> {
  requireBackend();

  try {
    const body: Record<string, unknown> = {
      active: payload.active,
      status: payload.status,
    };
    if (payload.status === "REJECTED") {
      body.rejectionReason = payload.rejectionReason?.trim() || "";
    }
    const res = (await axios.put(
      `/admin/companies/${id}`,
      body,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertCompany(res, "apiErrors.adminCompanyUpdateFailed");
  } catch (error) {
    throwCompanyError("apiErrors.adminCompanyUpdateFailed", error);
  }
}

/** DELETE /admin/companies/:id — soft delete */
export async function softDeleteAdminCompany(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/companies/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminCompanyDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwCompanyError("apiErrors.adminCompanyDeleteFailed", error);
  }
}

/** PATCH /admin/companies/:id/restore */
export async function restoreAdminCompany(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/companies/${id}/restore`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminCompanyRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwCompanyError("apiErrors.adminCompanyRestoreFailed", error);
  }
}
