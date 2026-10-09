import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import type {
  EmployerJob,
  EmployerJobCreatePayload,
  EmployerJobListParams,
  EmployerJobStatus,
  EmployerJobUpdatePayload,
  JobNamedRef,
} from "@/types/job";
import { isAxiosError } from "axios";

function throwEmployerJobError(fallbackKey: string, error: unknown): never {
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

function normalizeJobStatus(raw: unknown): EmployerJobStatus {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (value === "APPROVED") return "APPROVED";
  if (value === "REJECTED") return "REJECTED";
  return "PENDING";
}

function normalizeNamedRefs(raw: unknown): JobNamedRef[] {
  if (!Array.isArray(raw)) return [];
  const refs: JobNamedRef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = asRecord(item);
    const id = Number(row.id) || 0;
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    refs.push({ id, name });
  }
  return refs;
}

function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export function joinJobRefNames(items: JobNamedRef[]): string {
  return items
    .map((item) => item.name.trim())
    .filter(Boolean)
    .join(", ");
}

export function normalizeEmployerJob(raw: unknown): EmployerJob | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  const id = Number(r.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    slug: String(r.slug ?? "").trim(),
    companyId: Number(r.companyId) || 0,
    companySlug: String(r.companySlug ?? "").trim(),
    companyName: String(r.companyName ?? ""),
    companyLogo: String(r.companyLogo ?? ""),
    companyAddress: String(r.companyAddress ?? ""),
    createdByUserId: Number(r.createdByUserId) || 0,
    createdByUserName: String(r.createdByUserName ?? ""),
    title: String(r.title ?? ""),
    industries: normalizeNamedRefs(r.industries),
    educationLevels: normalizeNamedRefs(r.educationLevels),
    provinces: normalizeNamedRefs(r.provinces),
    employmentTypes: normalizeStringList(r.employmentTypes),
    experienceLevels: normalizeStringList(r.experienceLevels),
    experienceYears: (() => {
      if (r.experienceYears == null || r.experienceYears === "") return null;
      const years = Number(r.experienceYears);
      if (!Number.isFinite(years)) return null;
      return Math.min(50, Math.max(0, Math.trunc(years)));
    })(),
    salaryMin: Number(r.salaryMin) || 0,
    salaryMax: Number(r.salaryMax) || 0,
    salaryNegotiable: r.salaryNegotiable === true,
    deadline: String(r.deadline ?? "").slice(0, 10),
    workLocation: String(r.workLocation ?? ""),
    workingTime: String(r.workingTime ?? ""),
    description: String(r.description ?? ""),
    requirements: String(r.requirements ?? ""),
    benefits: String(r.benefits ?? ""),
    applicantQuestion: String(r.applicantQuestion ?? ""),
    hot: r.hot === true,
    applied: r.applied === true,
    saved: r.saved === true,
    applicationCount: Math.max(0, Math.trunc(Number(r.applicationCount) || 0)),
    status: normalizeJobStatus(r.status),
    rejectionReason: String(r.rejectionReason ?? ""),
    rejectedAt: String(r.rejectedAt ?? ""),
    approvedAt: String(r.approvedAt ?? ""),
    active: r.active !== false,
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? ""),
  };
}

function assertEmployerJob(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): EmployerJob {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }
  const job = normalizeEmployerJob(res.data);
  if (!job) {
    throw new AdminAuthError(
      "apiErrors.employerJobMissingData",
      res.statusCode,
      res.message,
    );
  }
  return job;
}

function buildListQuery(
  params: EmployerJobListParams,
): Record<string, unknown> {
  const query: Record<string, unknown> = {
    page: params.page ?? 1,
    size: params.size ?? 10,
  };
  if (params.keyword?.trim()) query.keyword = params.keyword.trim();
  if (params.companyId != null && Number.isFinite(params.companyId)) {
    query.companyId = params.companyId;
  }
  if (params.status) query.status = params.status;
  if (params.industryId != null && Number.isFinite(params.industryId)) {
    query.industryId = params.industryId;
  }
  if (params.provinceId != null && Number.isFinite(params.provinceId)) {
    query.provinceId = params.provinceId;
  }
  if (params.employmentType?.trim()) {
    query.employmentType = params.employmentType.trim();
  }
  if (params.experienceLevel?.trim()) {
    query.experienceLevel = params.experienceLevel.trim();
  }
  if (typeof params.active === "boolean") query.active = params.active;
  if (typeof params.hot === "boolean") query.hot = params.hot;
  if (params.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params.toDate?.trim()) query.toDate = params.toDate.trim();
  if (params.salaryFrom != null && Number.isFinite(params.salaryFrom)) {
    query.salaryFrom = Math.trunc(params.salaryFrom);
  }
  if (params.salaryTo != null && Number.isFinite(params.salaryTo)) {
    query.salaryTo = Math.trunc(params.salaryTo);
  }
  if (typeof params.deleted === "boolean") query.deleted = params.deleted;
  if (params.sort?.trim()) query.sort = params.sort.trim();
  return query;
}

/** GET /employer/jobs */
export async function fetchEmployerJobs(
  params: EmployerJobListParams = {},
): Promise<PaginatedList<EmployerJob>> {
  requireBackend();

  try {
    const res = (await axios.get("/employer/jobs", {
      params: buildListQuery(params),
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.employerJobLoadFailed",
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
      .filter((item): item is EmployerJob => item != null);

    return {
      data,
      pagination: normalizePagination(
        envelope.pagination ?? {
          current_page: Number(envelope.number) + 1 || 1,
          last_page: Number(envelope.totalPages) || 1,
          per_page: Number(envelope.size) || params.size || 10,
          total: Number(envelope.totalElements) || data.length,
          from: 0,
          to: 0,
        },
      ),
    };
  } catch (error) {
    throwEmployerJobError("apiErrors.employerJobLoadFailed", error);
  }
}

/** GET /employer/jobs/:id */
export async function fetchEmployerJobById(id: number): Promise<EmployerJob> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/employer/jobs/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertEmployerJob(res, "apiErrors.employerJobLoadFailed");
  } catch (error) {
    throwEmployerJobError("apiErrors.employerJobLoadFailed", error);
  }
}

/** POST /employer/jobs */
export async function createEmployerJob(
  payload: EmployerJobCreatePayload,
): Promise<{ job: EmployerJob; message: string }> {
  requireBackend();

  try {
    const res = (await axios.post(
      "/employer/jobs",
      payload,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    const job = assertEmployerJob(res, "apiErrors.employerJobCreateFailed");
    return {
      job,
      message: typeof res.message === "string" ? res.message.trim() : "",
    };
  } catch (error) {
    throwEmployerJobError("apiErrors.employerJobCreateFailed", error);
  }
}

/** PUT /employer/jobs/:id */
export async function updateEmployerJob(
  id: number,
  payload: EmployerJobUpdatePayload,
): Promise<{ job: EmployerJob; message: string }> {
  requireBackend();

  try {
    const res = (await axios.put(
      `/employer/jobs/${id}`,
      payload,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    const job = assertEmployerJob(res, "apiErrors.employerJobUpdateFailed");
    return {
      job,
      message: typeof res.message === "string" ? res.message.trim() : "",
    };
  } catch (error) {
    throwEmployerJobError("apiErrors.employerJobUpdateFailed", error);
  }
}

/** DELETE /employer/jobs/:id — soft delete */
export async function deleteEmployerJob(id: number): Promise<string> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/employer/jobs/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.employerJobDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
    return typeof res.message === "string" ? res.message.trim() : "";
  } catch (error) {
    throwEmployerJobError("apiErrors.employerJobDeleteFailed", error);
  }
}

/** PATCH /employer/jobs/:id/restore */
export async function restoreEmployerJob(
  id: number,
): Promise<{ job: EmployerJob | null; message: string }> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/employer/jobs/${id}/restore`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.employerJobRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
    return {
      job: normalizeEmployerJob(res.data),
      message: typeof res.message === "string" ? res.message.trim() : "",
    };
  } catch (error) {
    throwEmployerJobError("apiErrors.employerJobRestoreFailed", error);
  }
}
