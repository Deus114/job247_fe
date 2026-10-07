export type DateLocale = "vi" | "en" | string;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Date-only (YYYY-MM-DD) — parse as local calendar day to avoid TZ shift.
    const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      const year = Number(dateOnly[1]);
      const month = Number(dateOnly[2]);
      const day = Number(dateOnly[3]);
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format date only as `dd-mm-yyyy`. */
export function formatDate(
  value: string | number | Date | null | undefined,
  _locale: DateLocale = "vi",
  fallback = "—",
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
}

/** Format date + time as `dd-mm-yyyy HH:mm`. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  _locale: DateLocale = "vi",
  fallback = "—",
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
