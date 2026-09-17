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
  image?: string;
  imageFile?: File | null;
}

export interface Industry {
  id: string;
  name: string;
  groupId: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  deletedAt?: string;
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
