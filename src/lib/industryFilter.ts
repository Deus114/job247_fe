import type { PublicIndustryGroup } from "@/types/catalog";

export interface ResolvedIndustryFilter {
  industryGroupIds: number[];
  industryIds: number[];
}

/**
 * If every industry in a group is selected → send the group id only.
 * If only some industries in a group are selected → send those industry ids.
 */
export function resolveIndustrySelection(
  groups: Array<Pick<PublicIndustryGroup, "id" | "industries">>,
  selectedIndustryIds: Iterable<number | string>,
): ResolvedIndustryFilter {
  const selected = new Set(
    Array.from(selectedIndustryIds)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0),
  );

  const industryGroupIds: number[] = [];
  const industryIds: number[] = [];

  for (const group of groups) {
    const groupId = Number(group.id);
    if (!Number.isFinite(groupId) || groupId <= 0) continue;

    const memberIds = (group.industries || [])
      .map((item) => Number(item.id))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (memberIds.length === 0) continue;

    const picked = memberIds.filter((id) => selected.has(id));
    if (picked.length === 0) continue;

    if (picked.length === memberIds.length) {
      industryGroupIds.push(groupId);
    } else {
      industryIds.push(...picked);
    }
  }

  return { industryGroupIds, industryIds };
}

/** Expand group ids into all nested industry ids (for UI hydration). */
export function expandIndustryGroupIds(
  groups: Array<Pick<PublicIndustryGroup, "id" | "industries">>,
  groupIds: Iterable<number | string>,
): number[] {
  const wanted = new Set(
    Array.from(groupIds)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0),
  );
  if (wanted.size === 0) return [];

  const ids: number[] = [];
  for (const group of groups) {
    if (!wanted.has(Number(group.id))) continue;
    for (const industry of group.industries || []) {
      const id = Number(industry.id);
      if (Number.isFinite(id) && id > 0) ids.push(id);
    }
  }
  return ids;
}
