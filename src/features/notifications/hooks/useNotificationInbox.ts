import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications";
import { subscribeForegroundPush } from "@/lib/push";
import type { AppNotification, NotificationAudience } from "@/types/notification";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 8;

export function useNotificationInbox(audience: NotificationAudience) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorKey, setErrorKey] = useState("");

  const refreshCount = useCallback(async () => {
    try {
      const count = await fetchUnreadNotificationCount(audience);
      setUnreadCount(count);
    } catch {
      // Keep the last badge if the count request fails.
    }
  }, [audience]);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setErrorKey("");
      try {
        const result = await fetchNotifications(audience, {
          page: nextPage,
          size: PAGE_SIZE,
          sort: "createdAt,DESC",
        });
        setItems((current) =>
          append ? [...current, ...result.data] : result.data,
        );
        setPage(result.pagination.current_page);
        setLastPage(result.pagination.last_page);
      } catch {
        if (!append) setItems([]);
        setErrorKey("apiErrors.notificationLoadFailed");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [audience],
  );

  useEffect(() => {
    void refreshCount();
    const timer = window.setInterval(() => void refreshCount(), 60_000);
    return () => window.clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    return subscribeForegroundPush(() => {
      void refreshCount();
    });
  }, [refreshCount]);

  const markRead = useCallback(
    async (item: AppNotification) => {
      await markNotificationRead(audience, item.id);
      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? { ...row, read: true, readAt: row.readAt || new Date().toISOString() }
            : row,
        ),
      );
      if (!item.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    },
    [audience],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead(audience);
    setItems((current) =>
      current.map((row) =>
        row.read ? row : { ...row, read: true, readAt: new Date().toISOString() },
      ),
    );
    setUnreadCount(0);
  }, [audience]);

  const remove = useCallback(
    async (item: AppNotification) => {
      await deleteNotification(audience, item.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
      if (!item.read) setUnreadCount((count) => Math.max(0, count - 1));
    },
    [audience],
  );

  return {
    items,
    unreadCount,
    page,
    lastPage,
    loading,
    loadingMore,
    errorKey,
    refreshCount,
    reload: () => loadPage(1, false),
    loadMore: () => loadPage(page + 1, true),
    markRead,
    markAllRead,
    remove,
  };
}
