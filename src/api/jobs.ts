import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { fetchPublicEducationLevels } from "@/api/educationLevels";
import { joinJobRefNames, normalizeEmployerJob } from "@/api/employerJobs";
import { fetchPublicIndustryGroups } from "@/api/industryGroups";
import { fetchPublicProvinces } from "@/api/provinces";
import { env } from "@/config/env";
import {
  employmentTypeLabelKey,
  experienceLevelLabelKey,
} from "@/constants/employerJob";
import i18n from "@/i18n";
import { formatMoneyRange } from "@/lib/formatNumber";
import { resolveSlug } from "@/lib/paths";
import type { ApiResponse } from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import type {
  CategoryItem,
  EducationLevelItem,
  EmployerJob,
  Job,
  JobsCatalog,
  PublicJobListParams,
} from "@/types/job";
import { isAxiosError } from "axios";

function throwPublicJobError(fallbackKey: string, error: unknown): never {
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

/** Map API employer/public job item → UI Job model. */
export function mapPublicJobToUi(job: EmployerJob): Job {
  const t = (key: string) => i18n.t(key);
  const status = job.status.toLowerCase() as Job["status"];
  const provinces = joinJobRefNames(job.provinces);
  return {
    id: String(job.id),
    slug: job.slug || undefined,
    title: job.title,
    company: job.companyName,
    companyId: String(job.companyId),
    companySlug: job.companySlug || undefined,
    companyLogo: job.companyLogo,
    location: provinces || stripHtmlText(job.workLocation) || "—",
    workLocation: job.workLocation || "",
    workingTime: job.workingTime || "",
    salary: job.salaryNegotiable
      ? t("postJob.negotiable")
      : formatMoneyRange(job.salaryMin, job.salaryMax) || "—",
    category: joinJobRefNames(job.industries) || "—",
    educationLevel: joinJobRefNames(job.educationLevels) || "—",
    type: job.employmentTypes
      .map((value) => t(employmentTypeLabelKey(value)))
      .filter(Boolean)
      .join(", "),
    experience: job.experienceLevels
      .map((value) => t(experienceLevelLabelKey(value)))
      .filter(Boolean)
      .join(", "),
    experienceYears: job.experienceYears,
    description: job.description,
    requirements: job.requirements ? [job.requirements] : [],
    benefits: job.benefits ? [job.benefits] : [],
    applicantQuestion: job.applicantQuestion || undefined,
    deadline: job.deadline,
    createdAt: job.createdAt,
    featured: job.hot,
    applied: job.applied === true,
    saved: job.saved === true,
    // Public list is published jobs; treat missing/unknown status as approved.
    status: status === "rejected" ? "rejected" : "approved",
    isActive: job.active,
    applicationCount: job.applicationCount,
  };
}

function stripHtmlText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildJobsQuery(params: PublicJobListParams): Record<string, unknown> {
  const query: Record<string, unknown> = {
    page: params.page ?? 1,
    size: params.size ?? 20,
  };
  if (params.keyword?.trim()) query.keyword = params.keyword.trim();
  if (params.companyId != null && Number.isFinite(params.companyId)) {
    query.companyId = params.companyId;
  }
  if (params.industryGroupIds?.length) {
    query.industryGroupIds = params.industryGroupIds;
  }
  if (params.industryIds?.length) query.industryIds = params.industryIds;
  if (params.provinceIds?.length) query.provinceIds = params.provinceIds;
  if (params.educationLevelIds?.length) {
    query.educationLevelIds = params.educationLevelIds;
  }
  if (params.employmentTypes?.length) {
    query.employmentTypes = params.employmentTypes;
  }
  if (params.experienceLevels?.length) {
    query.experienceLevels = params.experienceLevels;
  }
  if (typeof params.hot === "boolean") query.hot = params.hot;
  if (params.sort?.trim()) query.sort = params.sort.trim();
  return query;
}

function parseJobList(
  res: ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>,
): PaginatedList<Job> {
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
      : [];
  const data = rowsRaw
    .map(normalizeEmployerJob)
    .filter((item): item is EmployerJob => item != null)
    .map(mapPublicJobToUi);
  return {
    data,
    pagination: normalizePagination(envelope.pagination),
  };
}

/** GET /jobs — public job list (sends Bearer when logged in for `applied`). */
export async function fetchPublicJobs(
  params: PublicJobListParams = {},
): Promise<PaginatedList<Job>> {
  requireBackend();
  try {
    const res = (await axios.get("/jobs", {
      params: buildJobsQuery(params),
      paramsSerializer: {
        indexes: null,
      },
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;
    return parseJobList(res);
  } catch (error) {
    throwPublicJobError("apiErrors.jobLoadFailed", error);
  }
}

/** GET /jobs/:slug/:id */
export async function fetchJobById(
  id: string,
  slug?: string,
): Promise<Job | null> {
  if (!env.apiBaseUrl) return null;
  const jobId = Number(id);
  if (!Number.isFinite(jobId) || jobId <= 0) return null;
  const pathSlug = resolveSlug(slug, "viec-lam", "viec-lam");

  try {
    const res = (await axios.get(
      `/jobs/${encodeURIComponent(pathSlug)}/${jobId}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") return null;
    if (!isAdminApiSuccess(res.statusCode)) return null;
    const job = normalizeEmployerJob(res.data);
    return job ? mapPublicJobToUi(job) : null;
  } catch {
    return null;
  }
}

/** GET /jobs/:slug/:id/related */
export async function fetchRelatedJobs(
  id: string,
  slug?: string,
): Promise<Job[]> {
  if (!env.apiBaseUrl) return [];
  const jobId = Number(id);
  if (!Number.isFinite(jobId) || jobId <= 0) return [];
  const pathSlug = resolveSlug(slug, "viec-lam", "viec-lam");

  try {
    const res = (await axios.get(
      `/jobs/${encodeURIComponent(pathSlug)}/${jobId}/related`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") return [];
    if (!isAdminApiSuccess(res.statusCode)) return [];

    const payload = res.data;
    const rowsRaw = Array.isArray(payload)
      ? payload
      : Array.isArray(asRecord(payload).data)
        ? (asRecord(payload).data as unknown[])
        : [];

    return rowsRaw
      .map(normalizeEmployerJob)
      .filter((item): item is EmployerJob => item != null)
      .map(mapPublicJobToUi);
  } catch {
    return [];
  }
}

/**
 * Bootstrap catalog for homepage / filters: jobs + industry groups + provinces + education.
 */
export async function fetchJobsCatalog(): Promise<JobsCatalog> {
  requireBackend();

  const [jobsRes, groupsRes, provincesRes, educationRes] = await Promise.all([
    fetchPublicJobs({ page: 1, size: 50, sort: "createdAt,DESC" }),
    fetchPublicIndustryGroups({ page: 1, size: 100 }),
    fetchPublicProvinces({ page: 1, size: 100 }),
    fetchPublicEducationLevels({ page: 1, size: 100 }),
  ]);

  const categories: CategoryItem[] = groupsRes.data.map((group) => ({
    id: group.id,
    name: group.name,
    image: group.image || undefined,
    isActive: true,
  }));

  const educationLevels: EducationLevelItem[] = educationRes.data.map(
    (item) => ({
      id: item.id,
      name: item.name,
      isActive: true,
    }),
  );

  const locations = provincesRes.data.map((item) => item.name);

  return {
    jobs: jobsRes.data,
    categories,
    educationLevels,
    locations,
  };
}
