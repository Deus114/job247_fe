import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { normalizeEmployerJob } from "@/api/employerJobs";
import { mapPublicJobToUi } from "@/api/jobs";
import { env } from "@/config/env";
import { resolveSlug } from "@/lib/paths";
import type { ApiResponse } from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import type { Company } from "@/types/company";
import type { EmployerJob, Job } from "@/types/job";
import { isAxiosError } from "axios";

export interface PublicCompanyListParams {
  keyword?: string;
  provinceId?: number;
  /** @deprecated Prefer industryGroupIds / industryIds. */
  industryId?: number;
  industryGroupIds?: number[];
  industryIds?: number[];
  companySize?: string;
  page?: number;
  size?: number;
  sort?: string;
}

function throwPublicCompanyError(fallbackKey: string, error: unknown): never {
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
  const current =
    Number(page.current_page) ||
    Number(page.page) ||
    Number(page.number) + 1 ||
    1;
  const perPage =
    Number(page.per_page) || Number(page.limit) || Number(page.size) || 10;
  const total =
    Number(page.total) ||
    Number(page.total_items) ||
    Number(page.totalElements) ||
    0;
  const lastPage =
    Number(page.last_page) ||
    Number(page.total_pages) ||
    Number(page.totalPages) ||
    Math.max(1, Math.ceil(total / perPage) || 1);
  return {
    current_page: current,
    last_page: lastPage,
    per_page: perPage,
    total,
    from: Number(page.from) || (total === 0 ? 0 : (current - 1) * perPage + 1),
    to: Number(page.to) || Math.min(current * perPage, total),
  };
}

function normalizeIndustryName(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const row = asRecord(item);
        return String(row.name ?? "").trim();
      })
      .filter(Boolean)
      .join(", ");
  }
  if (raw && typeof raw === "object") {
    return String(asRecord(raw).name ?? "").trim();
  }
  return String(raw ?? "").trim();
}

/** Normalize public company list/detail into UI Company model. */
export function normalizePublicCompany(raw: unknown): Company | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  const id = Number(r.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const province = asRecord(r.province);
  const statusRaw = String(r.status ?? "APPROVED")
    .trim()
    .toUpperCase();
  let status: Company["status"] = "approved";
  if (statusRaw === "PENDING") status = "pending";
  else if (statusRaw === "REJECTED") status = "rejected";
  else if (statusRaw === "NEEDS_REVISION") status = "needs_revision";

  // Public list may omit `active`; treat missing as active.
  const isActive =
    r.active == null ? true : r.active === true || r.active === "true";

  return {
    id: String(id),
    slug: String(r.slug ?? "").trim() || undefined,
    name: String(r.name ?? ""),
    nameEn: String(r.nameEn ?? r.name ?? ""),
    logo: String(r.logo ?? ""),
    banner: String(r.backgroundImage ?? r.banner ?? ""),
    description: String(r.description ?? ""),
    industry:
      normalizeIndustryName(r.industries) ||
      normalizeIndustryName(r.industry) ||
      "",
    size: String(r.size ?? ""),
    location: String(r.provinceName ?? province.name ?? r.location ?? ""),
    address: String(r.address ?? ""),
    website: r.website == null ? "" : String(r.website),
    contactEmail: String(r.email ?? r.contactEmail ?? ""),
    contactPhone: String(r.phone ?? r.contactPhone ?? ""),
    taxCode: String(r.taxCode ?? ""),
    status,
    createdBy: String(r.createdByUserId ?? r.createdBy ?? ""),
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? ""),
    isActive,
  };
}

/** GET /companies — public company list. */
export async function fetchPublicCompanies(
  params: PublicCompanyListParams = {},
): Promise<PaginatedList<Company>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 20,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.provinceId != null && Number.isFinite(params.provinceId)) {
      query.provinceId = params.provinceId;
    }
    if (params.industryGroupIds?.length) {
      query.industryGroupIds = params.industryGroupIds;
    }
    if (params.industryIds?.length) {
      query.industryIds = params.industryIds;
    }
    // Swagger still documents singular industryId — keep when exactly one industry.
    if (
      params.industryId != null &&
      Number.isFinite(params.industryId) &&
      !params.industryIds?.length &&
      !params.industryGroupIds?.length
    ) {
      query.industryId = params.industryId;
    } else if (
      params.industryIds?.length === 1 &&
      !params.industryGroupIds?.length
    ) {
      query.industryId = params.industryIds[0];
    }
    if (params.companySize?.trim()) {
      query.companySize = params.companySize.trim();
    }
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/companies", {
      params: query,
      paramsSerializer: {
        indexes: null,
      },
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.companyLoadFailed",
        res.statusCode,
        res.message,
      );
    }

    const envelope = asRecord(res.data);
    const rowsRaw = Array.isArray(res.data)
      ? res.data
      : Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(envelope.content)
          ? envelope.content
          : Array.isArray(envelope.items)
            ? envelope.items
            : [];
    const data = rowsRaw
      .map(normalizePublicCompany)
      .filter((item): item is Company => item != null);

    return {
      data,
      pagination: normalizePagination(
        envelope.pagination ?? {
          current_page: Number(envelope.number) + 1 || 1,
          last_page: Number(envelope.totalPages) || 1,
          per_page: Number(envelope.size) || params.size || 20,
          total: Number(envelope.totalElements) || data.length,
          from: 0,
          to: 0,
        },
      ),
    };
  } catch (error) {
    throwPublicCompanyError("apiErrors.companyLoadFailed", error);
  }
}

/** Compat wrapper used by catalog bootstrap. */
export async function fetchCompanies(): Promise<Company[]> {
  const res = await fetchPublicCompanies({
    page: 1,
    size: 50,
    sort: "createdAt,DESC",
  });
  return res.data;
}

/** GET /companies/:slug/:id */
export async function fetchPublicCompanyById(
  id: string | number,
  slug?: string,
): Promise<Company | null> {
  if (!env.apiBaseUrl) return null;
  const companyId = Number(id);
  if (!Number.isFinite(companyId) || companyId <= 0) return null;
  const pathSlug = resolveSlug(slug, "cong-ty", "cong-ty");

  try {
    const res = (await axios.get(
      `/companies/${encodeURIComponent(pathSlug)}/${companyId}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") return null;
    if (!isAdminApiSuccess(res.statusCode)) return null;
    return normalizePublicCompany(res.data);
  } catch {
    return null;
  }
}

/** GET /companies/:slug/:id/jobs */
export async function fetchPublicCompanyJobs(
  id: string | number,
  params: {
    page?: number;
    size?: number;
    sort?: string;
    slug?: string;
    salaryFrom?: number;
    salaryTo?: number;
  } = {},
): Promise<PaginatedList<Job>> {
  requireBackend();
  const companyId = Number(id);
  if (!Number.isFinite(companyId) || companyId <= 0) {
    throw new AdminAuthError("apiErrors.invalidResponse");
  }
  const pathSlug = resolveSlug(params.slug, "cong-ty", "cong-ty");

  try {
    const res = (await axios.get(
      `/companies/${encodeURIComponent(pathSlug)}/${companyId}/jobs`,
      {
        params: {
          page: params.page ?? 1,
          size: params.size ?? 20,
          sort: params.sort ?? "createdAt,DESC",
          ...(params.salaryFrom != null && Number.isFinite(params.salaryFrom)
            ? { salaryFrom: Math.trunc(params.salaryFrom) }
            : {}),
          ...(params.salaryTo != null && Number.isFinite(params.salaryTo)
            ? { salaryTo: Math.trunc(params.salaryTo) }
            : {}),
        },
      },
    )) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.jobLoadFailed",
        res.statusCode,
        res.message,
      );
    }

    const envelope = asRecord(res.data);
    const rowsRaw = Array.isArray(res.data)
      ? res.data
      : Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(envelope.content)
          ? envelope.content
          : [];
    const data = rowsRaw
      .map(normalizeEmployerJob)
      .filter((item): item is EmployerJob => item != null)
      .map(mapPublicJobToUi);

    return {
      data,
      pagination: normalizePagination(envelope.pagination),
    };
  } catch (error) {
    throwPublicCompanyError("apiErrors.jobLoadFailed", error);
  }
}
