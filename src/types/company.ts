export interface Company {
  id: string;
  name: string;
  nameEn: string;
  logo: string;
  banner: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  address: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  taxCode: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  adminNote?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  deletedAt?: string;
}

/** POST /employer/companies — multipart/form-data. */
export interface CreateEmployerCompanyPayload {
  name: string;
  industryIds: number[];
  size: string;
  provinceId: number;
  address: string;
  email: string;
  phone: string;
  taxCode: string;
  description: string;
  website?: string;
  /** File upload — do not send with `logo`. */
  logoFile?: File | null;
  /** Image URL — do not send with `logoFile`. */
  logo?: string;
  /** File upload — do not send with `backgroundImage`. */
  backgroundImageFile?: File | null;
  /** Image URL — do not send with `backgroundImageFile`. */
  backgroundImage?: string;
}

/** PUT /employer/companies/:id — same multipart fields as create. */
export type UpdateEmployerCompanyPayload = CreateEmployerCompanyPayload;

/** Admin company approval status */
export type AdminCompanyStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Admin company member role */
export type AdminCompanyMemberRole = "OWNER" | "ADMIN";

export interface AdminCompanyIndustry {
  id: number;
  name: string;
}

export interface AdminCompanyMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: AdminCompanyMemberRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** GET /admin/companies — list item / detail. */
export interface AdminCompany {
  id: number;
  name: string;
  size: string;
  provinceId: number;
  provinceName: string;
  industries: AdminCompanyIndustry[];
  address: string;
  email: string;
  phone: string;
  website: string;
  logo: string;
  backgroundImage: string;
  taxCode: string;
  description: string;
  status: AdminCompanyStatus;
  rejectionReason: string;
  active: boolean;
  members: AdminCompanyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminCompanyListParams {
  keyword?: string;
  status?: AdminCompanyStatus;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  /** e.g. `createdAt,DESC` */
  sort?: string;
}

/** PUT /admin/companies/:id */
export interface AdminCompanyUpdatePayload {
  active: boolean;
  status: AdminCompanyStatus;
  rejectionReason?: string;
}

/** GET /employer/companies — list/detail item (employer CMS). */
export interface EmployerCompany {
  id: number;
  name: string;
  size: string;
  provinceId: number;
  provinceName: string;
  industries: AdminCompanyIndustry[];
  address: string;
  email: string;
  phone: string;
  website: string;
  logo: string;
  backgroundImage: string;
  taxCode: string;
  description: string;
  status: AdminCompanyStatus;
  rejectionReason: string;
  active: boolean;
  applied: boolean;
  members: AdminCompanyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployerCompanyListParams {
  keyword?: string;
  /** true = mine, false = available (not mine), omit = all */
  mine?: boolean;
  status?: AdminCompanyStatus;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

/** Join-request status (API enum). */
export type CompanyJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CompanyJoinRequest {
  id: number;
  companyId: number;
  companyName: string;
  companyLogo: string;
  companyStatus: AdminCompanyStatus;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar: string;
  message: string;
  status: CompanyJoinRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyJoinRequestListParams {
  companyId?: number;
  status?: CompanyJoinRequestStatus;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateCompanyJoinRequestPayload {
  message?: string;
}

export interface UpdateCompanyJoinRequestPayload {
  status: "APPROVED" | "REJECTED";
}
