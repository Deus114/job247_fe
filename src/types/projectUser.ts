export type ProjectUserRole = "candidate" | "recruiter";

export interface ProjectUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: ProjectUserRole;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
  deletedAt?: string;
  jobTitle?: string;
  education?: string;
  companyName?: string;
  companyId?: string;
}
