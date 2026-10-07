import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  Application,
  ApplicationStatus,
  ApplyToJobPayload,
  JobSeekerApplicationListParams,
} from "@/types/application";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import { isAxiosError } from "axios";

function throwApplicationError(fallbackKey: string, error: unknown): never {
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

function normalizeStatus(raw: unknown): ApplicationStatus {
  const upper = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (upper === "SUBMITTED") return "SUBMITTED";
  if (upper === "VIEWED") return "VIEWED";

  const value = upper.toLowerCase();
  if (
    value === "pending" ||
    value === "reviewing" ||
    value === "interviewing" ||
    value === "accepted" ||
    value === "rejected"
  ) {
    return value;
  }
  return "pending";
}

function fileNameFromUrl(url: string): string {
  if (!url) return "";
  try {
    const path = url.split("?")[0] ?? url;
    const segment = path.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(segment) || url;
  } catch {
    return url;
  }
}

export function normalizeApplication(raw: unknown): Application | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  const id = Number(r.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const cvUrl = String(r.cvUrl ?? "").trim();
  const createdAt = String(r.createdAt ?? r.appliedAt ?? "");

  return {
    id: String(id),
    jobId: String(Number(r.jobId) || ""),
    jobTitle: String(r.jobTitle ?? ""),
    companyId: String(Number(r.companyId) || ""),
    companyName: String(r.companyName ?? ""),
    companyLogo: String(r.companyLogo ?? ""),
    userId:
      r.userId != null && String(r.userId).trim()
        ? String(r.userId)
        : undefined,
    fullName: String(r.fullName ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    coverLetter: String(r.coverLetter ?? ""),
    cvUrl,
    cvFileName: fileNameFromUrl(cvUrl) || String(r.cvFileName ?? ""),
    status: normalizeStatus(r.status),
    appliedAt: createdAt,
    viewedAt: r.viewedAt != null ? String(r.viewedAt) : undefined,
    viewedByUserId:
      r.viewedByUserId != null ? String(r.viewedByUserId) : undefined,
    viewedByUserName:
      r.viewedByUserName != null ? String(r.viewedByUserName) : undefined,
    createdAt,
    updatedAt: String(r.updatedAt ?? createdAt),
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

function buildListQuery(
  params: JobSeekerApplicationListParams,
): Record<string, unknown> {
  const query: Record<string, unknown> = {
    page: params.page ?? 1,
    size: params.size ?? 20,
    sort: params.sort?.trim() || "createdAt,DESC",
  };
  if (params.keyword?.trim()) query.keyword = params.keyword.trim();
  if (params.status?.trim()) query.status = params.status.trim();
  if (params.jobId != null && Number.isFinite(params.jobId)) {
    query.jobId = params.jobId;
  }
  if (params.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params.toDate?.trim()) query.toDate = params.toDate.trim();
  return query;
}

/** GET /job-seeker/applications */
export async function fetchJobSeekerApplications(
  params: JobSeekerApplicationListParams = {},
): Promise<PaginatedList<Application>> {
  requireBackend();
  try {
    const res = (await axios.get("/job-seeker/applications", {
      params: buildListQuery(params),
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    assertSuccess(res, "apiErrors.applicationLoadFailed");

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
    throwApplicationError("apiErrors.applicationLoadFailed", error);
  }
}

export async function fetchApplications(): Promise<Application[]> {
  const result = await fetchJobSeekerApplications({ page: 1, size: 100 });
  return result.data;
}

/** GET /job-seeker/applications/:id */
export async function fetchJobSeekerApplicationById(
  id: string | number,
): Promise<Application> {
  requireBackend();
  const appId = Number(id);
  if (!Number.isFinite(appId) || appId <= 0) {
    throw new AdminAuthError("apiErrors.applicationLoadFailed");
  }
  try {
    const res = (await axios.get(
      `/job-seeker/applications/${appId}`,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.applicationLoadFailed");
    const app = normalizeApplication(res.data);
    if (!app) throw new AdminAuthError("apiErrors.applicationMissingData");
    return app;
  } catch (error) {
    throwApplicationError("apiErrors.applicationLoadFailed", error);
  }
}

/** POST /job-seeker/jobs/:jobId/applications — multipart/form-data */
export async function applyToJobRequest(
  jobId: string | number,
  payload: ApplyToJobPayload,
): Promise<Application> {
  requireBackend();
  const id = Number(jobId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AdminAuthError("apiErrors.applicationApplyFailed");
  }
  if (!payload.cvFile) {
    throw new AdminAuthError("apiErrors.applicationCvRequired");
  }

  const body = new FormData();
  body.append("fullName", payload.fullName.trim());
  body.append("email", payload.email.trim());
  if (payload.phone?.trim()) body.append("phone", payload.phone.trim());
  if (payload.coverLetter?.trim()) {
    body.append("coverLetter", payload.coverLetter.trim());
  }
  body.append("cvFile", payload.cvFile);

  try {
    const res = (await axios.post(
      `/job-seeker/jobs/${id}/applications`,
      body,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.applicationApplyFailed");
    const app = normalizeApplication(res.data);
    if (!app) {
      // Some BEs return empty data on success — synthesize a minimal row.
      return {
        id: `temp-${Date.now()}`,
        jobId: String(id),
        jobTitle: "",
        companyId: "",
        companyName: "",
        companyLogo: "",
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        phone: payload.phone?.trim() || "",
        coverLetter: payload.coverLetter?.trim() || "",
        cvUrl: "",
        cvFileName: payload.cvFile.name,
        status: "pending",
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return app;
  } catch (error) {
    throwApplicationError("apiErrors.applicationApplyFailed", error);
  }
}
