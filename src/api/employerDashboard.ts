import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  EmployerDashboard,
  EmployerDashboardDayCount,
  EmployerDashboardJobCount,
  EmployerDashboardParams,
  EmployerDashboardRecentApplication,
  EmployerDashboardRecentJob,
  EmployerDashboardStatusCounts,
  EmployerDashboardSummary,
} from "@/types/employerDashboard";
import { isAxiosError } from "axios";

function throwDashboardError(error: unknown): never {
  if (error instanceof AdminAuthError) throw error;

  if (isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const key =
      error.code === "ERR_NETWORK"
        ? "apiErrors.networkError"
        : "apiErrors.employerDashboardLoadFailed";
    throw new AdminAuthError(
      key,
      body?.statusCode ?? error.response?.status,
      typeof body?.message === "string" ? body.message : undefined,
    );
  }

  throw new AdminAuthError("apiErrors.employerDashboardLoadFailed");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function count(value: unknown): number {
  return Math.max(0, Math.trunc(num(value)));
}

function summary(raw: unknown): EmployerDashboardSummary {
  const record = asRecord(raw);
  return {
    jobCount: count(record.jobCount),
    openJobCount: count(record.openJobCount),
    applicationCount: count(record.applicationCount),
    newApplicationCount: count(record.newApplicationCount),
  };
}

function jobCount(raw: unknown): EmployerDashboardJobCount | null {
  const record = asRecord(raw);
  const jobId = num(record.jobId);
  if (jobId <= 0) return null;
  return {
    jobId,
    title: String(record.title ?? "").trim(),
    count: count(record.count),
  };
}

function statusCounts(raw: unknown): EmployerDashboardStatusCounts {
  const record = asRecord(raw);
  return {
    submitted: count(record.submitted),
    viewed: count(record.viewed),
    total: count(record.total),
  };
}

function dayCount(raw: unknown): EmployerDashboardDayCount | null {
  const record = asRecord(raw);
  const date = String(record.date ?? "").trim();
  if (!date) return null;
  return { date, count: count(record.count) };
}

function recentJob(raw: unknown): EmployerDashboardRecentJob | null {
  const record = asRecord(raw);
  const id = num(record.id);
  if (id <= 0) return null;
  return {
    id,
    title: String(record.title ?? "").trim(),
    companyName: String(record.companyName ?? "").trim(),
    status: String(record.status ?? "").trim(),
    open: record.open === true,
    createdAt: String(record.createdAt ?? ""),
  };
}

function recentApplication(
  raw: unknown,
): EmployerDashboardRecentApplication | null {
  const record = asRecord(raw);
  const id = num(record.id);
  if (id <= 0) return null;
  return {
    id,
    applicantName: String(record.applicantName ?? "").trim(),
    jobId: num(record.jobId),
    jobTitle: String(record.jobTitle ?? "").trim(),
    status: String(record.status ?? "").trim(),
    createdAt: String(record.createdAt ?? ""),
  };
}

function mapDashboard(raw: unknown): EmployerDashboard {
  const record = asRecord(raw);
  return {
    summary: summary(record.summary),
    applicationsByJob: Array.isArray(record.applicationsByJob)
      ? record.applicationsByJob
          .map(jobCount)
          .filter((item): item is EmployerDashboardJobCount => item != null)
      : [],
    applicationsByStatus: statusCounts(record.applicationsByStatus),
    applicationsByDay: Array.isArray(record.applicationsByDay)
      ? record.applicationsByDay
          .map(dayCount)
          .filter((item): item is EmployerDashboardDayCount => item != null)
      : [],
    recentJobs: Array.isArray(record.recentJobs)
      ? record.recentJobs
          .map(recentJob)
          .filter((item): item is EmployerDashboardRecentJob => item != null)
      : [],
    recentApplications: Array.isArray(record.recentApplications)
      ? record.recentApplications
          .map(recentApplication)
          .filter(
            (item): item is EmployerDashboardRecentApplication => item != null,
          )
      : [],
  };
}

/** GET /employer/dashboard — omit companyId for every company the employer manages. */
export async function fetchEmployerDashboard(
  params: EmployerDashboardParams = {},
): Promise<EmployerDashboard> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  const companyId = params.companyId;
  const query =
    companyId != null && Number.isFinite(companyId) && companyId > 0
      ? { companyId }
      : undefined;

  try {
    const res = (await axios.get("/employer/dashboard", {
      params: query,
    })) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.employerDashboardLoadFailed",
        res.statusCode,
        res.message,
      );
    }

    return mapDashboard(res.data);
  } catch (error) {
    throwDashboardError(error);
  }
}
