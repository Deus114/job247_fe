export type DateLocale = "vi" | "en" | string;

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveLocale(locale?: DateLocale): string {
  if (!locale || locale === "vi") return "vi-VN";
  if (locale === "en") return "en-US";
  return locale;
}

/** Format date only, e.g. `13/09/2026`. */
export function formatDate(
  value: string | number | Date | null | undefined,
  locale: DateLocale = "vi",
  fallback = "—",
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(resolveLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Format date + time, e.g. `13/09/2026 16:47`. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale: DateLocale = "vi",
  fallback = "—",
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleString(resolveLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
