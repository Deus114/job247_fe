export interface EmployerDashboardSummary {
  jobCount: number;
  openJobCount: number;
  applicationCount: number;
  newApplicationCount: number;
}

export interface EmployerDashboardJobCount {
  jobId: number;
  title: string;
  count: number;
}

export interface EmployerDashboardStatusCounts {
  submitted: number;
  viewed: number;
  total: number;
}

export interface EmployerDashboardDayCount {
  date: string;
  count: number;
}

export interface EmployerDashboardRecentJob {
  id: number;
  title: string;
  companyName: string;
  status: string;
  open: boolean;
  createdAt: string;
}

export interface EmployerDashboardRecentApplication {
  id: number;
  applicantName: string;
  jobId: number;
  jobTitle: string;
  status: string;
  createdAt: string;
}

export interface EmployerDashboard {
  summary: EmployerDashboardSummary;
  applicationsByJob: EmployerDashboardJobCount[];
  applicationsByStatus: EmployerDashboardStatusCounts;
  applicationsByDay: EmployerDashboardDayCount[];
  recentJobs: EmployerDashboardRecentJob[];
  recentApplications: EmployerDashboardRecentApplication[];
}

export interface EmployerDashboardParams {
  companyId?: number;
}
