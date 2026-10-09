import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/adminAuth";
import type { ApiPagination } from "@/types/catalog";
import type {
  AppNotification,
  NotificationAudience,
  NotificationList,
  NotificationListParams,
} from "@/types/notification";
import { isAxiosError } from "axios";

function throwNotificationError(fallbackKey: string, error: unknown): never {
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

function basePath(audience: NotificationAudience): string {
  return audience === "admin" ? "/admin/notifications" : "/notifications";
}

function assertSuccess(res: ApiResponse<unknown> | undefined, fallbackKey: string) {
  if (!res || typeof res !== "object" || !isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res?.statusCode, res?.message);
  }
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

export function normalizeAppNotification(raw: unknown): AppNotification | null {
  const row = asRecord(raw);
  const id = Number(row.id);
  if (!Number.isFinite(id) || id < 0) return null;
  const readAt = typeof row.readAt === "string" ? row.readAt : "";
  return {
    id,
    type: String(row.type ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    relatedId: Number(row.relatedId) || 0,
    readAt,
    read: row.read === true || Boolean(readAt),
    createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
  };
}

export async function fetchNotifications(
  audience: NotificationAudience,
  params: NotificationListParams = {},
): Promise<NotificationList> {
  requireBackend();
  try {
    const res = (await axios.get(basePath(audience), {
      params: {
        ...(params.unreadOnly != null ? { unreadOnly: params.unreadOnly } : {}),
        page: params.page ?? 1,
        size: params.size ?? 10,
        sort: params.sort?.trim() || "createdAt,DESC",
      },
    })) as ApiResponse<{ data?: unknown; pagination?: unknown }>;
    assertSuccess(res, "apiErrors.notificationLoadFailed");
    const envelope = asRecord(res.data);
    const rowsRaw = Array.isArray(envelope.data) ? envelope.data : [];
    return {
      data: rowsRaw
        .map(normalizeAppNotification)
        .filter((item): item is AppNotification => item != null),
      pagination: normalizePagination(envelope.pagination),
    };
  } catch (error) {
    throwNotificationError("apiErrors.notificationLoadFailed", error);
  }
}

export async function fetchUnreadNotificationCount(
  audience: NotificationAudience,
): Promise<number> {
  requireBackend();
  try {
    const res = (await axios.get(`${basePath(audience)}/unread-count`)) as ApiResponse<{
      unreadCount?: unknown;
    }>;
    assertSuccess(res, "apiErrors.notificationLoadFailed");
    const count = Number(asRecord(res.data).unreadCount);
    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  } catch (error) {
    throwNotificationError("apiErrors.notificationLoadFailed", error);
  }
}

export async function markNotificationRead(
  audience: NotificationAudience,
  id: number,
): Promise<void> {
  requireBackend();
  try {
    const res = (await axios.patch(
      `${basePath(audience)}/${id}/read`,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.notificationMarkReadFailed");
  } catch (error) {
    throwNotificationError("apiErrors.notificationMarkReadFailed", error);
  }
}

export async function markAllNotificationsRead(
  audience: NotificationAudience,
): Promise<void> {
  requireBackend();
  try {
    const res = (await axios.patch(
      `${basePath(audience)}/read-all`,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.notificationMarkAllFailed");
  } catch (error) {
    throwNotificationError("apiErrors.notificationMarkAllFailed", error);
  }
}

export async function deleteNotification(
  audience: NotificationAudience,
  id: number,
): Promise<void> {
  requireBackend();
  try {
    const res = (await axios.delete(
      `${basePath(audience)}/${id}`,
    )) as ApiResponse<unknown>;
    assertSuccess(res, "apiErrors.notificationDeleteFailed");
  } catch (error) {
    throwNotificationError("apiErrors.notificationDeleteFailed", error);
  }
}
