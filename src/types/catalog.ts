/** Admin catalog types. Industry groups + industries use real API; provinces still mock. */

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
  /** e.g. `industryCount,desc` or `createdAt,asc` */
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

export interface Province {
  id: string;
  name: string;
  code?: string;
  region?: "north" | "central" | "south" | string;
  isActive?: boolean;
  createdAt?: string;
  deletedAt?: string;
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
