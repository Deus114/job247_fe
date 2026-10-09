import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { normalizeEmployerJob } from "@/api/employerJobs";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import type {
  AdminJob,
  AdminJobListParams,
  AdminJobUpdatePayload,
  EmployerJobStatus,
} from "@/types/job";
import { isAxiosError } from "axios";

function throwAdminJobError(fallbackKey: string, error: unknown): never {
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

function assertAdminJob(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): AdminJob {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }
  const job = normalizeEmployerJob(res.data);
  if (!job) {
    throw new AdminAuthError(
      "apiErrors.adminJobMissingData",
      res.statusCode,
      res.message,
    );
  }
  return job;
}

function buildListQuery(params: AdminJobListParams): Record<string, unknown> {
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

/** GET /admin/jobs */
export async function fetchAdminJobs(
  params: AdminJobListParams = {},
): Promise<PaginatedList<AdminJob>> {
  requireBackend();

  try {
    const res = (await axios.get("/admin/jobs", {
      params: buildListQuery(params),
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminJobLoadFailed",
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
      .map(normalizeEmployerJob)
      .filter((item): item is AdminJob => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwAdminJobError("apiErrors.adminJobLoadFailed", error);
  }
}

/** GET /admin/jobs/:id */
export async function fetchAdminJobById(id: number): Promise<AdminJob> {
  requireBackend();

  try {
    const res = (await axios.get(`/admin/jobs/${id}`)) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertAdminJob(res, "apiErrors.adminJobLoadFailed");
  } catch (error) {
    throwAdminJobError("apiErrors.adminJobLoadFailed", error);
  }
}

/** PUT /admin/jobs/:id — `{ active, status, rejectionReason?, hot }` */
export async function updateAdminJob(
  id: number,
  payload: AdminJobUpdatePayload,
): Promise<AdminJob> {
  requireBackend();

  try {
    const body: Record<string, unknown> = {
      active: payload.active,
      status: payload.status,
      hot: payload.hot,
    };
    if (payload.status === "REJECTED") {
      body.rejectionReason = payload.rejectionReason?.trim() || "";
    }

    const res = (await axios.put(
      `/admin/jobs/${id}`,
      body,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertAdminJob(res, "apiErrors.adminJobUpdateFailed");
  } catch (error) {
    throwAdminJobError("apiErrors.adminJobUpdateFailed", error);
  }
}

/** DELETE /admin/jobs/:id — soft delete */
export async function softDeleteAdminJob(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/jobs/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminJobDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwAdminJobError("apiErrors.adminJobDeleteFailed", error);
  }
}

/** PATCH /admin/jobs/:id/restore */
export async function restoreAdminJob(id: number): Promise<AdminJob> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/jobs/${id}/restore`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertAdminJob(res, "apiErrors.adminJobRestoreFailed");
  } catch (error) {
    throwAdminJobError("apiErrors.adminJobRestoreFailed", error);
  }
}

export type { EmployerJobStatus };
