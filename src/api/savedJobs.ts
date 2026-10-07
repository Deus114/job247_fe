import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type { SavedJobItem, SavedJobListParams } from "@/types/application";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import { isAxiosError } from "axios";

function throwSavedJobError(fallbackKey: string, error: unknown): never {
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

function normalizeNamedRefs(
  raw: unknown,
): { id: number; name: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const r = asRecord(item);
      const id = Number(r.id);
      const name = String(r.name ?? "").trim();
      if (!Number.isFinite(id) || id <= 0 || !name) return null;
      return { id, name };
    })
    .filter((item): item is { id: number; name: string } => item != null);
}

function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => String(v ?? "").trim()).filter(Boolean);
}

/** Map GET /job-seeker/saved-jobs row → SavedJobItem (API fields only). */
export function normalizeSavedJobItem(raw: unknown): SavedJobItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  const jobId = Number(r.jobId);
  const id = Number(r.id);
  if (!Number.isFinite(jobId) || jobId <= 0) return null;

  const experienceYears =
    r.experienceYears == null || r.experienceYears === ""
      ? null
      : (() => {
          const years = Number(r.experienceYears);
          if (!Number.isFinite(years)) return null;
          return Math.min(50, Math.max(0, Math.trunc(years)));
        })();

  return {
    id: Number.isFinite(id) && id > 0 ? id : jobId,
    jobId,
    jobSlug: String(r.jobSlug ?? "").trim(),
    jobTitle: String(r.jobTitle ?? "").trim(),
    companyId: Number(r.companyId) || 0,
    companyName: String(r.companyName ?? "").trim(),
    companySlug: String(r.companySlug ?? "").trim(),
    companyLogo: String(r.companyLogo ?? "").trim(),
    provinces: normalizeNamedRefs(r.provinces),
    employmentTypes: normalizeStringList(r.employmentTypes),
    experienceLevels: normalizeStringList(r.experienceLevels),
    experienceYears,
    salaryMin: Number(r.salaryMin) || 0,
    salaryMax: Number(r.salaryMax) || 0,
    salaryNegotiable: r.salaryNegotiable === true,
    deadline: String(r.deadline ?? "").slice(0, 10),
    hot: r.hot === true,
    jobActive: r.jobActive !== false,
    jobStatus: String(r.jobStatus ?? "").trim(),
    applied: r.applied === true,
    applicationCount: Math.max(0, Math.trunc(Number(r.applicationCount) || 0)),
    savedAt: String(r.savedAt ?? ""),
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

/** GET /job-seeker/saved-jobs */
export async function fetchSavedJobs(
  params: SavedJobListParams = {},
): Promise<PaginatedList<SavedJobItem>> {
  requireBackend();
  try {
    const res = (await axios.get("/job-seeker/saved-jobs", {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 10,
        sort: params.sort?.trim() || "createdAt,DESC",
      },
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    assertSuccess(res, "apiErrors.savedJobLoadFailed");

    const envelope = asRecord(res.data);
    const rowsRaw = Array.isArray(res.data)
      ? res.data
      : Array.isArray(envelope.data)
        ? envelope.data
        : [];
    const data = rowsRaw
      .map(normalizeSavedJobItem)
      .filter((item): item is SavedJobItem => item != null);

    return {
      data,
      pagination: normalizePagination(envelope.pagination),
    };
  } catch (error) {
    throwSavedJobError("apiErrors.savedJobLoadFailed", error);
  }
}

/** POST /job-seeker/saved-jobs/:jobId */
export async function saveJobRequest(jobId: string | number): Promise<void> {
  requireBackend();
  const id = Number(jobId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AdminAuthError("apiErrors.savedJobSaveFailed");
  }
  try {
    const res = (await axios.post(
      `/job-seeker/saved-jobs/${id}`,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.savedJobSaveFailed");
  } catch (error) {
    throwSavedJobError("apiErrors.savedJobSaveFailed", error);
  }
}

/** DELETE /job-seeker/saved-jobs/:jobId */
export async function unsaveJobRequest(jobId: string | number): Promise<void> {
  requireBackend();
  const id = Number(jobId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AdminAuthError("apiErrors.savedJobUnsaveFailed");
  }
  try {
    const res = (await axios.delete(
      `/job-seeker/saved-jobs/${id}`,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.savedJobUnsaveFailed");
  } catch (error) {
    throwSavedJobError("apiErrors.savedJobUnsaveFailed", error);
  }
}
