import type { AppNotification } from "@/types/notification";

/** Where a notification should open. `open` asks that screen to show the related record. */
export function notificationHref(
  item: Pick<AppNotification, "type" | "relatedId">,
): string | null {
  const id = Number(item.relatedId);
  if (!Number.isFinite(id) || id <= 0) return null;

  switch (item.type) {
    case "ADMIN_COMPANY_PENDING":
      return `/admin/companies?open=${id}`;
    case "ADMIN_JOB_PENDING":
      return `/admin/jobs?open=${id}`;
    case "EMPLOYER_COMPANY_STATUS_CHANGED":
      return `/employer/companies/${id}`;
    case "EMPLOYER_JOB_STATUS_CHANGED":
      return `/employer/jobs?open=${id}`;
    case "EMPLOYER_JOIN_REQUEST_CREATED":
      return `/employer/companies/join-requests?open=${id}`;
    case "EMPLOYER_APPLICATION_RECEIVED":
      return `/employer/applications?open=${id}`;
    case "JOB_SEEKER_APPLICATION_SUBMITTED":
    case "JOB_SEEKER_APPLICATION_VIEWED":
      return `/my-applications?open=${id}`;
    default:
      return null;
  }
}

export function notificationFocus(
  search: string,
  state: unknown,
): { id: number; key: string } | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const id = Number(params.get("open"));
  if (!Number.isFinite(id) || id <= 0) return null;
  const queryAt = Number(params.get("at"));
  const stateAt =
    state && typeof state === "object" && "notificationAt" in state
      ? Number((state as { notificationAt?: number }).notificationAt) || 0
      : 0;
  const at = Number.isFinite(queryAt) && queryAt > 0 ? queryAt : stateAt;
  return { id, key: `${id}:${at}` };
}
