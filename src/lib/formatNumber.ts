function toFiniteNumber(
  value: number | string | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") {
    return null;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatNumber(
  value: number | string | null | undefined,
  fallback = "—",
): string {
  const n = toFiniteNumber(value);
  if (n == null) return fallback;
  return Math.trunc(n).toLocaleString("en-US");
}

export function parseNumberInput(raw: string): number | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function formatNumberInput(raw: string): string {
  const n = parseNumberInput(raw);
  if (n == null) return "";
  return formatNumber(n, "");
}

export function formatMoneyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  fallback = "—",
): string {
  const hasMin = min != null && Number.isFinite(min) && min > 0;
  const hasMax = max != null && Number.isFinite(max) && max > 0;
  if (!hasMin && !hasMax) return fallback;
  if (hasMin && hasMax) {
    return `${formatNumber(min)} - ${formatNumber(max)}`;
  }
  if (hasMin) return formatNumber(min);
  return formatNumber(max);
}
