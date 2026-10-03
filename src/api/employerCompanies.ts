import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import type { ApiResponse } from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import type {
  AdminCompanyIndustry,
  AdminCompanyMember,
  AdminCompanyMemberRole,
  AdminCompanyStatus,
  Company,
  CompanyJoinRequest,
  CompanyJoinRequestListParams,
  CompanyJoinRequestStatus,
  CreateCompanyJoinRequestPayload,
  CreateEmployerCompanyPayload,
  EmployerCompany,
  EmployerCompanyListParams,
  UpdateCompanyJoinRequestPayload,
  UpdateEmployerCompanyPayload,
} from "@/types/company";

function throwEmployerCompanyError(
  fallbackKey: string,
  error: unknown,
): never {
  if (error instanceof AdminAuthError) throw error;

  if (isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const key =
      error.code === "ERR_NETWORK" ? "apiErrors.networkError" : fallbackKey;
    throw new AdminAuthError(
      key,
      body?.statusCode ?? error.response?.status,
      typeof body?.message === "string" ? body.message : undefined,
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

function normalizeCompanyStatus(raw: unknown): AdminCompanyStatus {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (value === "APPROVED") return "APPROVED";
  if (value === "REJECTED") return "REJECTED";
  return "PENDING";
}

function normalizeJoinStatus(raw: unknown): CompanyJoinRequestStatus {
  return normalizeCompanyStatus(raw);
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
    name: String(record.name ?? record.nameVi ?? ""),
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

/** Normalize employer company list/detail payload. */
export function normalizeEmployerCompanyApi(
  raw: unknown,
): EmployerCompany | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  const province = asRecord(r.province);
  const industriesRaw = Array.isArray(r.industries) ? r.industries : [];
  const membersRaw = Array.isArray(r.members) ? r.members : [];

  return {
    id,
    name: String(r.name ?? ""),
    size: String(r.size ?? ""),
    provinceId: Number(r.provinceId ?? province.id) || 0,
    provinceName: String(r.provinceName ?? province.name ?? ""),
    industries: industriesRaw
      .map(normalizeIndustry)
      .filter((item): item is AdminCompanyIndustry => item != null),
    address: String(r.address ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    website: String(r.website ?? ""),
    logo: String(r.logo ?? ""),
    backgroundImage: String(r.backgroundImage ?? r.banner ?? ""),
    taxCode: String(r.taxCode ?? ""),
    description: String(r.description ?? ""),
    status: normalizeCompanyStatus(r.status),
    active: r.active !== false,
    members: membersRaw
      .map(normalizeMember)
      .filter((item): item is AdminCompanyMember => item != null),
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? ""),
  };
}

function companyStatusUi(raw: unknown): Company["status"] {
  const value = String(raw ?? "pending").toLowerCase();
  if (value === "approved") return "approved";
  if (value === "rejected") return "rejected";
  if (value === "needs_revision" || value === "needsrevision") {
    return "needs_revision";
  }
  return "pending";
}

/** Normalize create-company response into the legacy app Company model. */
export function normalizeEmployerCompany(
  raw: unknown,
  fallbackCreatedBy = "",
): Company | null {
  const api = normalizeEmployerCompanyApi(raw);
  if (!api) return null;

  return {
    id: String(api.id),
    name: api.name,
    nameEn: api.name,
    logo: api.logo,
    banner: api.backgroundImage,
    description: api.description,
    industry: api.industries.map((item) => item.name).filter(Boolean).join(", "),
    size: api.size,
    location: api.provinceName,
    address: api.address,
    website: api.website,
    contactEmail: api.email,
    contactPhone: api.phone,
    taxCode: api.taxCode,
    status: companyStatusUi(api.status),
    createdBy: fallbackCreatedBy,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    isActive: api.active,
  };
}

export function normalizeCompanyJoinRequest(
  raw: unknown,
): CompanyJoinRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    companyId: Number(r.companyId) || 0,
    companyName: String(r.companyName ?? ""),
    companyLogo: String(r.companyLogo ?? ""),
    companyStatus: normalizeCompanyStatus(r.companyStatus),
    userId: Number(r.userId) || 0,
    userName: String(r.userName ?? ""),
    userEmail: String(r.userEmail ?? ""),
    userAvatar: String(r.userAvatar ?? ""),
    message: String(r.message ?? ""),
    status: normalizeJoinStatus(r.status),
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? ""),
  };
}

function assertJoinRequest(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): CompanyJoinRequest {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }
  const item = normalizeCompanyJoinRequest(res.data);
  if (!item) {
    throw new AdminAuthError(
      "apiErrors.invalidResponse",
      res.statusCode,
      res.message,
    );
  }
  return item;
}

function assertEmployerCompany(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): EmployerCompany {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }
  const raw = res.data;
  const nested =
    raw && typeof raw === "object" && "data" in (raw as object)
      ? (raw as { data?: unknown }).data
      : undefined;
  const company =
    normalizeEmployerCompanyApi(raw) ?? normalizeEmployerCompanyApi(nested);
  if (!company) {
    throw new AdminAuthError(
      "apiErrors.invalidResponse",
      res.statusCode,
      res.message,
    );
  }
  return company;
}

function buildCreateFormData(payload: CreateEmployerCompanyPayload): FormData {
  const body = new FormData();
  body.append("name", payload.name.trim());
  for (const id of payload.industryIds) {
    body.append("industryIds", String(id));
  }
  body.append("size", payload.size);
  body.append("provinceId", String(payload.provinceId));
  body.append("address", payload.address.trim());
  body.append("email", payload.email.trim());
  body.append("phone", payload.phone.trim());
  body.append("taxCode", payload.taxCode.trim());
  body.append("description", payload.description.trim());
  if (payload.website?.trim()) {
    body.append("website", payload.website.trim());
  }
  if (payload.logoFile) {
    body.append("logoFile", payload.logoFile);
  } else if (payload.logo?.trim()) {
    body.append("logo", payload.logo.trim());
  }
  if (payload.backgroundImageFile) {
    body.append("backgroundImageFile", payload.backgroundImageFile);
  } else if (payload.backgroundImage?.trim()) {
    body.append("backgroundImage", payload.backgroundImage.trim());
  }
  return body;
}

export interface CreateEmployerCompanyResult {
  company: Company;
  message: string;
}

export interface UpdateEmployerCompanyResult {
  company: EmployerCompany;
  message: string;
}

/** GET /employer/companies */
export async function fetchEmployerCompanies(
  params: EmployerCompanyListParams = {},
): Promise<PaginatedList<EmployerCompany>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.mine != null) query.mine = params.mine;
    if (params.status) query.status = params.status;
    if (params.active != null) query.active = params.active;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/employer/companies", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.employerCompanyLoadFailed",
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
      .map(normalizeEmployerCompanyApi)
      .filter((item): item is EmployerCompany => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwEmployerCompanyError("apiErrors.employerCompanyLoadFailed", error);
  }
}

/** GET /employer/companies/:id */
export async function fetchEmployerCompanyById(
  id: number,
): Promise<EmployerCompany> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/employer/companies/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertEmployerCompany(res, "apiErrors.employerCompanyLoadFailed");
  } catch (error) {
    throwEmployerCompanyError("apiErrors.employerCompanyLoadFailed", error);
  }
}

/** PUT /employer/companies/:id — multipart/form-data. */
export async function updateEmployerCompany(
  id: number,
  payload: UpdateEmployerCompanyPayload,
): Promise<UpdateEmployerCompanyResult> {
  requireBackend();

  try {
    const res = (await axios.put(
      `/employer/companies/${id}`,
      buildCreateFormData(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    const company = assertEmployerCompany(
      res,
      "apiErrors.employerCompanyUpdateFailed",
    );
    return {
      company,
      message: typeof res.message === "string" ? res.message.trim() : "",
    };
  } catch (error) {
    throwEmployerCompanyError("apiErrors.employerCompanyUpdateFailed", error);
  }
}

/** POST /employer/companies — multipart/form-data. */
export async function createEmployerCompany(
  payload: CreateEmployerCompanyPayload,
  createdBy = "",
): Promise<CreateEmployerCompanyResult> {
  requireBackend();

  try {
    const res = (await axios.post(
      "/employer/companies",
      buildCreateFormData(payload),
    )) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.employerCompanyCreateFailed",
        res.statusCode,
        res.message,
      );
    }

    const company = normalizeEmployerCompany(res.data, createdBy);
    if (!company) {
      throw new AdminAuthError(
        "apiErrors.employerCompanyMissingData",
        res.statusCode,
        res.message,
      );
    }

    return {
      company,
      message: typeof res.message === "string" ? res.message.trim() : "",
    };
  } catch (error) {
    throwEmployerCompanyError("apiErrors.employerCompanyCreateFailed", error);
  }
}

/** GET /employer/companies/join-requests/mine */
export async function fetchMyCompanyJoinRequests(
  params: CompanyJoinRequestListParams = {},
): Promise<PaginatedList<CompanyJoinRequest>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.status) query.status = params.status;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/employer/companies/join-requests/mine", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.companyJoinRequestLoadFailed",
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
      .map(normalizeCompanyJoinRequest)
      .filter((item): item is CompanyJoinRequest => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwEmployerCompanyError("apiErrors.companyJoinRequestLoadFailed", error);
  }
}

/** GET /employer/companies/:id/join-requests */
export async function fetchCompanyJoinRequests(
  companyId: number,
  params: CompanyJoinRequestListParams = {},
): Promise<PaginatedList<CompanyJoinRequest>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.status) query.status = params.status;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get(
      `/employer/companies/${companyId}/join-requests`,
      { params: query },
    )) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.companyJoinRequestLoadFailed",
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
      .map(normalizeCompanyJoinRequest)
      .filter((item): item is CompanyJoinRequest => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwEmployerCompanyError("apiErrors.companyJoinRequestLoadFailed", error);
  }
}

/** POST /employer/companies/:id/join-requests */
export async function createCompanyJoinRequest(
  companyId: number,
  payload: CreateCompanyJoinRequestPayload = {},
): Promise<CompanyJoinRequest> {
  requireBackend();

  try {
    const res = (await axios.post(
      `/employer/companies/${companyId}/join-requests`,
      { message: payload.message?.trim() || "" },
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertJoinRequest(res, "apiErrors.companyJoinRequestCreateFailed");
  } catch (error) {
    throwEmployerCompanyError(
      "apiErrors.companyJoinRequestCreateFailed",
      error,
    );
  }
}

/** PUT /employer/companies/:id/join-requests/:requestId */
export async function updateCompanyJoinRequest(
  companyId: number,
  requestId: number,
  payload: UpdateCompanyJoinRequestPayload,
): Promise<CompanyJoinRequest> {
  requireBackend();

  try {
    const res = (await axios.put(
      `/employer/companies/${companyId}/join-requests/${requestId}`,
      { status: payload.status },
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertJoinRequest(res, "apiErrors.companyJoinRequestUpdateFailed");
  } catch (error) {
    throwEmployerCompanyError(
      "apiErrors.companyJoinRequestUpdateFailed",
      error,
    );
  }
}
