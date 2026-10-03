import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import { normalizeUserCompanyMembership } from "@/api/auth";
import axios from "@/api/axios.customize";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type { ApiPagination, PaginatedList } from "@/types/catalog";
import type {
  PublicAccount,
  PublicAccountListParams,
  PublicAccountType,
  UserCompanyMembership,
} from "@/types/user";
import { isAxiosError } from "axios";

function throwAccountError(fallbackKey: string, error: unknown): never {
  if (error instanceof AdminAuthError) throw error;

  if (isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const key =
      error.code === "ERR_NETWORK" ? "apiErrors.networkError" : fallbackKey;
    throw new AdminAuthError(
      key,
      body?.statusCode ?? error.response?.status,
      body?.message,
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

function readAccountType(value: unknown): PublicAccountType | null {
  if (value === "JOB_SEEKER" || value === "EMPLOYER") return value;
  return null;
}

export function normalizePublicAccount(raw: unknown): PublicAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = Number(record.id);
  const type = readAccountType(record.type);
  if (!Number.isFinite(id) || !type) return null;

  return {
    id,
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    type,
    emailVerified: record.emailVerified === true,
    avatar: String(record.avatar ?? ""),
    active: record.active !== false,
    createdAt: String(record.createdAt ?? ""),
    updatedAt: String(record.updatedAt ?? ""),
    companies: Array.isArray(record.companies)
      ? record.companies
          .map(normalizeUserCompanyMembership)
          .filter((item): item is UserCompanyMembership => item != null)
      : [],
  };
}

function assertAccount(
  res: ApiResponse<unknown>,
  fallbackKey: string,
): PublicAccount {
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }
  const account = normalizePublicAccount(res.data);
  if (!account) {
    throw new AdminAuthError(
      "apiErrors.invalidResponse",
      res.statusCode,
      res.message,
    );
  }
  return account;
}

/** GET /admin/accounts */
export async function fetchPublicAccounts(
  params: PublicAccountListParams = {},
): Promise<PaginatedList<PublicAccount>> {
  requireBackend();

  try {
    const query: Record<string, unknown> = {
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
    if (params.keyword?.trim()) query.keyword = params.keyword.trim();
    if (params.type) query.type = params.type;
    if (params.active != null) query.active = params.active;
    if (params.deleted != null) query.deleted = params.deleted;
    if (params.sort?.trim()) query.sort = params.sort.trim();

    const res = (await axios.get("/admin/accounts", {
      params: query,
    })) as ApiResponse<{ data?: unknown; pagination?: unknown } | unknown[]>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.publicAccountLoadFailed",
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
      .map(normalizePublicAccount)
      .filter((item): item is PublicAccount => item != null);

    return { data, pagination: normalizePagination(envelope.pagination) };
  } catch (error) {
    throwAccountError("apiErrors.publicAccountLoadFailed", error);
  }
}

/** GET /admin/accounts/:id */
export async function fetchPublicAccountById(
  id: number,
): Promise<PublicAccount> {
  requireBackend();

  try {
    const res = (await axios.get(
      `/admin/accounts/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertAccount(res, "apiErrors.publicAccountLoadFailed");
  } catch (error) {
    throwAccountError("apiErrors.publicAccountLoadFailed", error);
  }
}

/** PUT /admin/accounts/:id — body `{ active }` only. */
export async function updatePublicAccountStatus(
  id: number,
  active: boolean,
): Promise<PublicAccount> {
  requireBackend();

  try {
    const res = (await axios.put(`/admin/accounts/${id}`, {
      active,
    })) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    return assertAccount(res, "apiErrors.publicAccountStatusFailed");
  } catch (error) {
    throwAccountError("apiErrors.publicAccountStatusFailed", error);
  }
}

/** DELETE /admin/accounts/:id — soft delete */
export async function softDeletePublicAccount(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.delete(
      `/admin/accounts/${id}`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.publicAccountDeleteFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwAccountError("apiErrors.publicAccountDeleteFailed", error);
  }
}

/** PATCH /admin/accounts/:id/restore */
export async function restorePublicAccount(id: number): Promise<void> {
  requireBackend();

  try {
    const res = (await axios.patch(
      `/admin/accounts/${id}/restore`,
    )) as ApiResponse<unknown>;
    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }
    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.publicAccountRestoreFailed",
        res.statusCode,
        res.message,
      );
    }
  } catch (error) {
    throwAccountError("apiErrors.publicAccountRestoreFailed", error);
  }
}
