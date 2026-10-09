export interface AdminDashboardMetric {
  count: number;
  changePercent: number;
}

export interface AdminDashboardIndustryCount {
  industryId: number;
  industryName: string;
  count: number;
}

export interface AdminDashboardCompanyStatus {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface AdminDashboardMonthCount {
  month: string;
  count: number;
}

export interface AdminDashboardRecentJob {
  id: number;
  title: string;
  companyName: string;
  location: string;
  createdAt: string;
}

export interface AdminDashboardRecentUser {
  id: number;
  name: string;
  email: string;
  type: string;
  createdAt: string;
}

export interface AdminDashboard {
  summary: {
    jobs: AdminDashboardMetric;
    companies: AdminDashboardMetric;
    users: AdminDashboardMetric;
    pending: AdminDashboardMetric;
  };
  jobsByIndustry: AdminDashboardIndustryCount[];
  companiesByStatus: AdminDashboardCompanyStatus;
  jobsByMonth: AdminDashboardMonthCount[];
  recentJobs: AdminDashboardRecentJob[];
  recentUsers: AdminDashboardRecentUser[];
}
