import axios from "@/api/axios.customize";
import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  AdminDashboard,
  AdminDashboardCompanyStatus,
  AdminDashboardIndustryCount,
  AdminDashboardMetric,
  AdminDashboardMonthCount,
  AdminDashboardRecentJob,
  AdminDashboardRecentUser,
} from "@/types/adminDashboard";
import { isAxiosError } from "axios";

function throwDashboardError(error: unknown): never {
  if (error instanceof AdminAuthError) throw error;

  if (isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const key =
      error.code === "ERR_NETWORK"
        ? "apiErrors.networkError"
        : "apiErrors.adminDashboardLoadFailed";
    throw new AdminAuthError(
      key,
      body?.statusCode ?? error.response?.status,
      body?.message,
    );
  }

  throw new AdminAuthError("apiErrors.adminDashboardLoadFailed");
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

function metric(raw: unknown): AdminDashboardMetric {
  const record = asRecord(raw);
  return {
    count: Math.max(0, Math.trunc(num(record.count))),
    changePercent: num(record.changePercent),
  };
}

function industryRow(raw: unknown): AdminDashboardIndustryCount | null {
  const record = asRecord(raw);
  const industryId = num(record.industryId);
  const industryName = String(record.industryName ?? "").trim();
  if (!industryName && industryId <= 0) return null;
  return {
    industryId,
    industryName: industryName || String(industryId),
    count: Math.max(0, Math.trunc(num(record.count))),
  };
}

function statusCounts(raw: unknown): AdminDashboardCompanyStatus {
  const record = asRecord(raw);
  return {
    pending: Math.max(0, Math.trunc(num(record.pending))),
    approved: Math.max(0, Math.trunc(num(record.approved))),
    rejected: Math.max(0, Math.trunc(num(record.rejected))),
    total: Math.max(0, Math.trunc(num(record.total))),
  };
}

function monthRow(raw: unknown): AdminDashboardMonthCount | null {
  const record = asRecord(raw);
  const month = String(record.month ?? "").trim();
  if (!month) return null;
  return { month, count: Math.max(0, Math.trunc(num(record.count))) };
}

function recentJob(raw: unknown): AdminDashboardRecentJob | null {
  const record = asRecord(raw);
  const id = num(record.id);
  if (id <= 0) return null;
  return {
    id,
    title: String(record.title ?? "").trim(),
    companyName: String(record.companyName ?? "").trim(),
    location: String(record.location ?? "").trim(),
    createdAt: String(record.createdAt ?? ""),
  };
}

function recentUser(raw: unknown): AdminDashboardRecentUser | null {
  const record = asRecord(raw);
  const id = num(record.id);
  if (id <= 0) return null;
  return {
    id,
    name: String(record.name ?? "").trim(),
    email: String(record.email ?? "").trim(),
    type: String(record.type ?? "").trim(),
    createdAt: String(record.createdAt ?? ""),
  };
}

function mapDashboard(raw: unknown): AdminDashboard {
  const record = asRecord(raw);
  const summary = asRecord(record.summary);
  return {
    summary: {
      jobs: metric(summary.jobs),
      companies: metric(summary.companies),
      users: metric(summary.users),
      pending: metric(summary.pending),
    },
    jobsByIndustry: Array.isArray(record.jobsByIndustry)
      ? record.jobsByIndustry
          .map(industryRow)
          .filter((item): item is AdminDashboardIndustryCount => item != null)
      : [],
    companiesByStatus: statusCounts(record.companiesByStatus),
    jobsByMonth: Array.isArray(record.jobsByMonth)
      ? record.jobsByMonth
          .map(monthRow)
          .filter((item): item is AdminDashboardMonthCount => item != null)
      : [],
    recentJobs: Array.isArray(record.recentJobs)
      ? record.recentJobs
          .map(recentJob)
          .filter((item): item is AdminDashboardRecentJob => item != null)
      : [],
    recentUsers: Array.isArray(record.recentUsers)
      ? record.recentUsers
          .map(recentUser)
          .filter((item): item is AdminDashboardRecentUser => item != null)
      : [],
  };
}

/** GET /admin/dashboard */
export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  try {
    const res = (await axios.get("/admin/dashboard")) as ApiResponse<unknown>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.adminDashboardLoadFailed",
        res.statusCode,
        res.message,
      );
    }

    return mapDashboard(res.data);
  } catch (error) {
    throwDashboardError(error);
  }
}
