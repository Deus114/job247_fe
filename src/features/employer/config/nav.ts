export interface EmployerNavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  end?: boolean;
}

export const employerNav: EmployerNavItem[] = [
  {
    key: "overview",
    label: "employerNav.overview",
    icon: "ri-dashboard-line",
    path: "/employer",
    end: true,
  },
  {
    key: "jobs",
    label: "employerNav.jobs",
    icon: "ri-briefcase-line",
    path: "/employer/jobs",
    end: true,
  },
  {
    key: "applications",
    label: "employerNav.applications",
    icon: "ri-file-user-line",
    path: "/employer/applications",
    end: true,
  },
  {
    key: "postJob",
    label: "employerNav.postJob",
    icon: "ri-add-circle-line",
    path: "/employer/jobs/new",
  },
  {
    key: "companies",
    label: "employerNav.companies",
    icon: "ri-building-line",
    path: "/employer/companies",
    end: true,
  },
  {
    key: "findCompany",
    label: "employerNav.findCompany",
    icon: "ri-search-eye-line",
    path: "/employer/companies/find",
  },
  {
    key: "joinRequests",
    label: "employerNav.joinRequests",
    icon: "ri-mail-send-line",
    path: "/employer/companies/join-requests",
  },
  {
    key: "settings",
    label: "employerNav.settings",
    icon: "ri-settings-3-line",
    path: "/employer/settings",
    end: true,
  },
];
