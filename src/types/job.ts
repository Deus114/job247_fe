export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  companyLogo: string;
  location: string;
  salary: string;
  category: string;
  educationLevel: string;
  type: string;
  experience: string;
  description: string;
  requirements: string[];
  benefits: string[];
  deadline: string;
  createdAt: string;
  featured: boolean;
  status: "pending" | "approved" | "rejected";
  isActive?: boolean;
  deletedAt?: string;
  applicationCount?: number;
}

export interface CategoryItem {
  name: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  deletedAt?: string;
}

export interface EducationLevelItem {
  name: string;
  isActive?: boolean;
  createdAt?: string;
  deletedAt?: string;
}

export interface JobsCatalog {
  jobs: Job[];
  categories: CategoryItem[];
  educationLevels: EducationLevelItem[];
  locations: string[];
}

/** Employer job moderation status */
export type EmployerJobStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Named catalog ref on job responses (industry / education / province). */
export interface JobNamedRef {
  id: number;
  name: string;
}

export interface EmployerJob {
  id: number;
  companyId: number;
  companyName: string;
  companyLogo: string;
  companyAddress: string;
  createdByUserId: number;
  createdByUserName: string;
  title: string;
  industries: JobNamedRef[];
  educationLevels: JobNamedRef[];
  provinces: JobNamedRef[];
  employmentTypes: string[];
  experienceLevels: string[];
  /** Optional years of experience required (0–50). */
  experienceYears: number | null;
  salaryMin: number;
  salaryMax: number;
  salaryNegotiable: boolean;
  deadline: string;
  workLocation: string;
  workingTime: string;
  description: string;
  requirements: string;
  benefits: string;
  applicantQuestion: string;
  hot: boolean;
  applied: boolean;
  applicationCount: number;
  status: EmployerJobStatus;
  rejectionReason: string;
  rejectedAt: string;
  approvedAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerJobListParams {
  keyword?: string;
  companyId?: number;
  status?: EmployerJobStatus;
  industryId?: number;
  provinceId?: number;
  employmentType?: string;
  experienceLevel?: string;
  active?: boolean;
  hot?: boolean;
  fromDate?: string;
  toDate?: string;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

/** Shared fields for POST/PUT /employer/jobs (update has no companyId). */
export interface EmployerJobWritePayload {
  title: string;
  industryIds: number[];
  educationLevelIds: number[];
  provinceIds: number[];
  employmentTypes: string[];
  experienceLevels: string[];
  /** Optional; 0–50. Omit when not set. */
  experienceYears?: number | null;
  salaryMin?: number;
  salaryMax?: number;
  salaryNegotiable?: boolean;
  deadline: string;
  workLocation: string;
  workingTime: string;
  description: string;
  requirements: string;
  benefits: string;
  applicantQuestion?: string;
}

/** POST /employer/jobs body. */
export interface EmployerJobCreatePayload extends EmployerJobWritePayload {
  companyId: number;
}

/** PUT /employer/jobs/:id body. */
export type EmployerJobUpdatePayload = EmployerJobWritePayload;

/** Admin job list uses the same item shape as employer jobs. */
export type AdminJob = EmployerJob;

export type AdminJobListParams = EmployerJobListParams;

/** PUT /admin/jobs/:id — moderation fields only. */
export interface AdminJobUpdatePayload {
  active: boolean;
  status: EmployerJobStatus;
  rejectionReason?: string;
  hot: boolean;
}
