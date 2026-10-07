import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import { normalizeApplication } from "@/api/applications";
import axios from "@/api/axios.customize";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  AdminApplicationListParams,
  Application,
} from "@/types/application";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import { isAxiosError } from "axios";

function throwAdminAppError(fallbackKey: string, error: unknown): never {
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
  const current = Number(page.current_page) || Number(page.page) || 1;
  const perPage =
    Number(page.per_page) || Number(page.limit) || Number(page.size) || 10;
  const total = Number(page.total) || 0;
  const lastPage =
    Number(page.last_page) ||
    Number(page.total_pages) ||
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

function assertSuccess(res: ApiResponse<unknown>, fallbackKey: string): void {
  if (!res || typeof res !== "object") {
    throw new AdminAuthError("apiErrors.invalidResponse");
  }
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }
}

function assertApplication(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): Application {
  assertSuccess(res, fallbackKey);
  const app = normalizeApplication(res.data);
  if (!app) {
    throw new AdminAuthError(
      "apiErrors.applicationMissingData",
      res.statusCode,
      res.message,
    );
  }
  return app;
}

function buildListQuery(
  params: AdminApplicationListParams,
): Record<string, unknown> {
  const query: Record<string, unknown> = {
    page: params.page ?? 1,
    size: params.size ?? 10,
    sort: params.sort?.trim() || "createdAt,DESC",
  };
  if (params.keyword?.trim()) query.keyword = params.keyword.trim();
  if (params.status?.trim()) query.status = params.status.trim();
  if (params.companyId != null && Number.isFinite(params.companyId)) {
    query.companyId = params.companyId;
  }
  if (params.jobId != null && Number.isFinite(params.jobId)) {
    query.jobId = params.jobId;
  }
  if (params.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params.toDate?.trim()) query.toDate = params.toDate.trim();
  if (typeof params.deleted === "boolean") query.deleted = params.deleted;
  return query;
}

/** GET /admin/applications */
export async function fetchAdminApplications(
  params: AdminApplicationListParams = {},
): Promise<PaginatedList<Application>> {
  requireBackend();
  try {
    const res = (await axios.get("/admin/applications", {
      params: buildListQuery(params),
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    assertSuccess(res, "apiErrors.adminApplicationLoadFailed");

    const envelope = asRecord(res.data);
    const rowsRaw = Array.isArray(res.data)
      ? res.data
      : Array.isArray(envelope.data)
        ? envelope.data
        : [];
    const data = rowsRaw
      .map(normalizeApplication)
      .filter((item): item is Application => item != null);

    return {
      data,
      pagination: normalizePagination(envelope.pagination),
    };
  } catch (error) {
    throwAdminAppError("apiErrors.adminApplicationLoadFailed", error);
  }
}

/** GET /admin/applications/:id */
export async function fetchAdminApplicationById(
  id: number,
): Promise<Application> {
  requireBackend();
  if (!Number.isFinite(id) || id <= 0) {
    throw new AdminAuthError("apiErrors.adminApplicationLoadFailed");
  }
  try {
    const res = (await axios.get(
      `/admin/applications/${id}`,
    )) as ApiResponse<unknown>;
    return assertApplication(res, "apiErrors.adminApplicationLoadFailed");
  } catch (error) {
    throwAdminAppError("apiErrors.adminApplicationLoadFailed", error);
  }
}

/** DELETE /admin/applications/:id — soft delete */
export async function softDeleteAdminApplication(id: number): Promise<void> {
  requireBackend();
  try {
    const res = (await axios.delete(
      `/admin/applications/${id}`,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.adminApplicationDeleteFailed");
  } catch (error) {
    throwAdminAppError("apiErrors.adminApplicationDeleteFailed", error);
  }
}

/** DELETE /admin/applications/:id/permanent */
export async function permanentDeleteAdminApplication(
  id: number,
): Promise<void> {
  requireBackend();
  try {
    const res = (await axios.delete(
      `/admin/applications/${id}/permanent`,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.adminApplicationDeleteFailed");
  } catch (error) {
    throwAdminAppError("apiErrors.adminApplicationDeleteFailed", error);
  }
}

/** PATCH /admin/applications/:id/restore */
export async function restoreAdminApplication(
  id: number,
): Promise<Application> {
  requireBackend();
  try {
    const res = (await axios.patch(
      `/admin/applications/${id}/restore`,
    )) as ApiResponse<unknown>;
    return assertApplication(res, "apiErrors.adminApplicationRestoreFailed");
  } catch (error) {
    throwAdminAppError("apiErrors.adminApplicationRestoreFailed", error);
  }
}
