/** Job-seeker application status (API may return upper/lower case). */
export type JobSeekerApplicationStatus =
  | "pending"
  | "reviewing"
  | "interviewing"
  | "accepted"
  | "rejected";

/** Employer application status — GET /employer/applications. */
export type EmployerApplicationStatus = "SUBMITTED" | "VIEWED";

export type ApplicationStatus =
  | JobSeekerApplicationStatus
  | EmployerApplicationStatus;

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  coverLetter: string;
  /** Absolute or relative CV URL from API. */
  cvUrl: string;
  /** Display name derived from `cvUrl` (or upload name before submit). */
  cvFileName: string;
  status: ApplicationStatus;
  /** Alias of `createdAt` for existing UI. */
  appliedAt: string;
  viewedAt?: string;
  viewedByUserId?: string;
  viewedByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /job-seeker/applications query. */
export interface JobSeekerApplicationListParams {
  keyword?: string;
  status?: string;
  jobId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/** GET /employer/applications query. */
export interface EmployerApplicationListParams {
  keyword?: string;
  status?: EmployerApplicationStatus | string;
  companyId?: number;
  jobId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/** GET /admin/applications query. */
export interface AdminApplicationListParams {
  keyword?: string;
  status?: EmployerApplicationStatus | string;
  companyId?: number;
  jobId?: number;
  fromDate?: string;
  toDate?: string;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

/** POST /job-seeker/jobs/:jobId/applications — multipart fields. */
export interface ApplyToJobPayload {
  fullName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  cvFile: File;
}

/** GET /job-seeker/saved-jobs query. */
export interface SavedJobListParams {
  page?: number;
  size?: number;
  sort?: string;
}

/** GET /job-seeker/saved-jobs list item (fields returned by API only). */
export interface SavedJobItem {
  id: number;
  jobId: number;
  jobSlug: string;
  jobTitle: string;
  companyId: number;
  companyName: string;
  companySlug: string;
  companyLogo: string;
  provinces: { id: number; name: string }[];
  employmentTypes: string[];
  experienceLevels: string[];
  experienceYears: number | null;
  salaryMin: number;
  salaryMax: number;
  salaryNegotiable: boolean;
  deadline: string;
  hot: boolean;
  jobActive: boolean;
  jobStatus: string;
  applied: boolean;
  applicationCount: number;
  savedAt: string;
}
