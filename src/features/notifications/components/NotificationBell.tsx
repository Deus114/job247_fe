import { AdminAuthError, resolveAdminAuthErrorMessage } from "@/api";
import { useNotificationInbox } from "@/features/notifications/hooks/useNotificationInbox";
import { notificationHref } from "@/features/notifications/notificationLink";
import { formatDateTime } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import type {
  AppNotification,
  NotificationAudience,
} from "@/types/notification";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type NotificationBellProps = {
  audience: NotificationAudience;
  /** Light icon when the public nav sits on the dark home hero. */
  tone?: "default" | "onDark";
};

function errorText(
  error: unknown,
  fallbackKey: string,
  t: (key: string) => string,
) {
  if (error instanceof AdminAuthError)
    return resolveAdminAuthErrorMessage(error, t);
  return t(fallbackKey);
}

export default function NotificationBell({
  audience,
  tone = "default",
}: NotificationBellProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const inbox = useNotificationInbox(audience);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      if (next) void inbox.reload();
      return next;
    });
  };

  const handleOpenItem = async (item: AppNotification) => {
    if (busyId != null) return;
    const href = notificationHref(item);
    setBusyId(item.id);
    try {
      await inbox.markRead(item);
    } catch (error) {
      toast.error(errorText(error, "apiErrors.notificationMarkReadFailed", t));
    } finally {
      setBusyId(null);
    }
    if (!href) return;
    const at = Date.now();
    const next = href.includes("?") ? `${href}&at=${at}` : `${href}?at=${at}`;
    navigate(next, { state: { notificationAt: at } });
    setOpen(false);
  };

  const handleMarkAll = async () => {
    if (markingAll || inbox.unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await inbox.markAllRead();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.notificationMarkAllFailed", t));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (item: AppNotification) => {
    if (busyId != null) return;
    setBusyId(item.id);
    try {
      await inbox.remove(item);
    } catch (error) {
      toast.error(errorText(error, "apiErrors.notificationDeleteFailed", t));
    } finally {
      setBusyId(null);
    }
  };

  const badge = inbox.unreadCount > 99 ? "99+" : String(inbox.unreadCount);
  const onDark = tone === "onDark";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("notifications.open")}
        aria-expanded={open}
        onClick={toggle}
        className={`relative w-11 h-11 flex items-center justify-center rounded-full border transition-colors cursor-pointer ${
          onDark
            ? "border-white/40 text-white hover:border-white hover:bg-white/10"
            : "border-background-300 text-foreground-600 hover:text-primary-500 hover:border-primary-400"
        }`}
      >
        <i className="ri-notification-3-line text-lg"></i>
        {inbox.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-5 text-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(32rem,calc(100vh-5.5rem))] flex flex-col bg-background-50 border border-background-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-background-200">
            <p className="text-sm font-semibold text-foreground-950">
              {t("notifications.title")}
            </p>
            <button
              type="button"
              onClick={() => void handleMarkAll()}
              disabled={markingAll || inbox.unreadCount === 0}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:text-foreground-400 disabled:cursor-not-allowed cursor-pointer min-h-11 px-2"
            >
              {markingAll
                ? t("notifications.saving")
                : t("notifications.markAllRead")}
            </button>
          </div>

          <div className="overflow-y-auto">
            {inbox.loading ? (
              <p className="px-4 py-8 text-sm text-center text-foreground-500">
                {t("common.loading")}
              </p>
            ) : inbox.errorKey ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-foreground-600 mb-3">
                  {t(inbox.errorKey)}
                </p>
                <button
                  type="button"
                  onClick={() => void inbox.reload()}
                  className="min-h-11 px-4 text-sm font-medium text-primary-600 cursor-pointer"
                >
                  {t("notifications.retry")}
                </button>
              </div>
            ) : inbox.items.length === 0 ? (
              <p className="px-4 py-8 text-sm text-center text-foreground-500">
                {t("notifications.empty")}
              </p>
            ) : (
              <ul>
                {inbox.items.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-stretch border-b border-background-100 last:border-b-0 ${
                      item.read ? "" : "bg-primary-50/70"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void handleOpenItem(item)}
                      className="flex-1 min-w-0 text-left px-4 py-3 cursor-pointer min-h-11"
                    >
                      <p className="text-sm font-medium text-foreground-950 line-clamp-2">
                        {item.title || t("notifications.untitled")}
                      </p>
                      {item.body && (
                        <p className="mt-1 text-xs text-foreground-600 line-clamp-3 whitespace-pre-line">
                          {item.body}
                        </p>
                      )}
                      <p className="mt-1.5 text-[11px] text-foreground-400">
                        {formatDateTime(
                          item.createdAt,
                          i18n.language,
                          t("adminUi.common.notAvailable"),
                        )}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label={t("notifications.delete")}
                      disabled={busyId === item.id}
                      onClick={() => void handleDelete(item)}
                      className="w-11 shrink-0 flex items-center justify-center text-foreground-400 hover:text-red-500 cursor-pointer disabled:opacity-50"
                    >
                      <i
                        className={
                          busyId === item.id
                            ? "ri-loader-4-line animate-spin"
                            : "ri-delete-bin-line"
                        }
                      ></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {inbox.page < inbox.lastPage && !inbox.loading && !inbox.errorKey && (
            <button
              type="button"
              onClick={() => void inbox.loadMore()}
              disabled={inbox.loadingMore}
              className="min-h-11 border-t border-background-200 text-sm font-medium text-primary-600 hover:bg-background-100 cursor-pointer disabled:opacity-60"
            >
              {inbox.loadingMore
                ? t("common.loading")
                : t("notifications.loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
