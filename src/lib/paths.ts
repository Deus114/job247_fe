const NON_ALNUM = /[^a-z0-9]+/g;
const TRIM_DASH = /^-+|-+$/g;

export function slugify(input: string, fallback = "item"): string {
  const raw = String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(NON_ALNUM, "-")
    .replace(TRIM_DASH, "");
  return raw || fallback;
}

export function resolveSlug(
  slug: string | null | undefined,
  fallbackFrom: string,
  fallback = "item",
): string {
  const cleaned = String(slug ?? "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (cleaned) return cleaned;
  return slugify(fallbackFrom, fallback);
}

export function jobPath(job: {
  id: string | number;
  slug?: string | null;
  title?: string;
}): string {
  const id = String(job.id);
  const slug = resolveSlug(job.slug, job.title || "viec-lam", "viec-lam");
  return `/jobs/${encodeURIComponent(slug)}/${id}`;
}

export function companyPath(company: {
  id: string | number;
  slug?: string | null;
  name?: string;
}): string {
  const id = String(company.id);
  const slug = resolveSlug(company.slug, company.name || "cong-ty", "cong-ty");
  return `/companies/${encodeURIComponent(slug)}/${id}`;
}
