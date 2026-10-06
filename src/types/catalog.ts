export interface IndustryGroup {
  id: number;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  sortOrder: number;
  image: string;
  active: boolean;
  industryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IndustryGroupListParams {
  keyword?: string;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ApiPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedList<T> {
  data: T[];
  pagination: ApiPagination;
}

export interface IndustryGroupWritePayload {
  nameVi: string;
  nameEn: string;
  descriptionVi?: string;
  descriptionEn?: string;
  sortOrder?: number;
  active?: boolean;
  /** Remote image URL — do not send with imageFile */
  image?: string;
  /** Local upload — do not send with image */
  imageFile?: File | null;
}

export interface Industry {
  id: number;
  industryGroup: IndustryGroup | null;
  industryGroupId: number;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  sortOrder: number;
  image: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IndustryListParams {
  keyword?: string;
  active?: boolean;
  deleted?: boolean;
  industryGroupId?: number;
  page?: number;
  size?: number;
  /** e.g. `sortOrder,asc` or `createdAt,desc` */
  sort?: string;
}

export interface IndustryWritePayload {
  industryGroupId: number;
  nameVi: string;
  nameEn: string;
  descriptionVi?: string;
  descriptionEn?: string;
  sortOrder?: number;
  active?: boolean;
  image?: string;
  imageFile?: File | null;
}

export interface EducationLevel {
  id: number;
  nameVi: string;
  nameEn: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EducationLevelListParams {
  keyword?: string;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface EducationLevelWritePayload {
  nameVi: string;
  nameEn: string;
  sortOrder?: number;
  active?: boolean;
}

export type ProvinceRegion = "NORTH" | "CENTRAL" | "SOUTH";

export interface Province {
  id: number;
  name: string;
  region: ProvinceRegion | string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProvinceListParams {
  keyword?: string;
  region?: ProvinceRegion | string;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PublicProvince {
  id: number;
  name: string;
  region: string;
  sortOrder: number;
}

export interface PublicEducationLevel {
  id: number;
  name: string;
  sortOrder: number;
}

export interface PublicIndustry {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  image: string;
}

export interface PublicIndustryGroup {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  image: string;
  industries: PublicIndustry[];
}

export interface ProvinceWritePayload {
  name: string;
  region: ProvinceRegion | string;
  sortOrder?: number;
  active?: boolean;
}

export function industryGroupDisplayName(
  group: Pick<IndustryGroup, "nameVi" | "nameEn">,
  lang: string,
): string {
  const isEn = lang.toLowerCase().startsWith("en");
  if (isEn) return group.nameEn?.trim() || group.nameVi || "";
  return group.nameVi?.trim() || group.nameEn || "";
}

export function industryGroupDisplayDescription(
  group: Pick<IndustryGroup, "descriptionVi" | "descriptionEn">,
  lang: string,
): string {
  const isEn = lang.toLowerCase().startsWith("en");
  if (isEn) return group.descriptionEn?.trim() || group.descriptionVi || "";
  return group.descriptionVi?.trim() || group.descriptionEn || "";
}

export function industryDisplayName(
  item: Pick<Industry, "nameVi" | "nameEn">,
  lang: string,
): string {
  const isEn = lang.toLowerCase().startsWith("en");
  if (isEn) return item.nameEn?.trim() || item.nameVi || "";
  return item.nameVi?.trim() || item.nameEn || "";
}

export function industryDisplayDescription(
  item: Pick<Industry, "descriptionVi" | "descriptionEn">,
  lang: string,
): string {
  const isEn = lang.toLowerCase().startsWith("en");
  if (isEn) return item.descriptionEn?.trim() || item.descriptionVi || "";
  return item.descriptionVi?.trim() || item.descriptionEn || "";
}

export function educationLevelDisplayName(
  item: Pick<EducationLevel, "nameVi" | "nameEn">,
  lang: string,
): string {
  const isEn = lang.toLowerCase().startsWith("en");
  if (isEn) return item.nameEn?.trim() || item.nameVi || "";
  return item.nameVi?.trim() || item.nameEn || "";
}

function foldRegion(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

export function normalizeProvinceRegion(
  value: string | null | undefined,
): ProvinceRegion | "" {
  const folded = foldRegion(String(value ?? ""));
  if (!folded) return "";
  if (
    folded === "NORTH" ||
    folded === "NORTHERN" ||
    folded === "BAC" ||
    folded === "MIENBAC"
  ) {
    return "NORTH";
  }
  if (folded === "CENTRAL" || folded === "TRUNG" || folded === "MIENTRUNG") {
    return "CENTRAL";
  }
  if (
    folded === "SOUTH" ||
    folded === "SOUTHERN" ||
    folded === "NAM" ||
    folded === "MIENNAM"
  ) {
    return "SOUTH";
  }
  return "";
}
