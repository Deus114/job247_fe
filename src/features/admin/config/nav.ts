export type AdminRouteKey =
  | 'dashboard'
  | 'jobs'
  | 'companies'
  | 'project-users'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'industry-groups'
  | 'industries'
  | 'provinces'
  | 'education'
  | 'business-config'
  | 'profile';

export interface AdminNavItem {
  key: AdminRouteKey;
  label: string;
  icon: string;
  path: string;
}

export interface AdminNavGroup {
  key: string;
  label: string;
  icon: string;
  children: AdminNavItem[];
}

export const adminStandaloneNav: AdminNavItem[] = [
  {
    key: 'dashboard',
    label: 'adminNav.dashboard',
    icon: 'ri-dashboard-line',
    path: '/admin/dashboard',
  },
];

export const adminNavGroups: AdminNavGroup[] = [
  {
    key: 'operations',
    label: 'adminNav.groups.operations',
    icon: 'ri-settings-3-line',
    children: [
      { key: 'jobs', label: 'adminNav.jobs', icon: 'ri-briefcase-line', path: '/admin/jobs' },
      { key: 'companies', label: 'adminNav.companies', icon: 'ri-building-line', path: '/admin/companies' },
    ],
  },
  {
    key: 'accounts',
    label: 'adminNav.groups.accounts',
    icon: 'ri-group-line',
    children: [
      {
        key: 'project-users',
        label: 'adminNav.projectUsers',
        icon: 'ri-user-line',
        path: '/admin/project-users',
      },
      { key: 'users', label: 'adminNav.users', icon: 'ri-shield-user-line', path: '/admin/users' },
    ],
  },
  {
    key: 'catalog',
    label: 'adminNav.groups.catalog',
    icon: 'ri-database-2-line',
    children: [
      {
        key: 'industry-groups',
        label: 'adminNav.industryGroups',
        icon: 'ri-folder-3-line',
        path: '/admin/industry-groups',
      },
      {
        key: 'industries',
        label: 'adminNav.industries',
        icon: 'ri-price-tag-3-line',
        path: '/admin/industries',
      },
      {
        key: 'provinces',
        label: 'adminNav.provinces',
        icon: 'ri-map-pin-line',
        path: '/admin/provinces',
      },
      {
        key: 'education',
        label: 'adminNav.education',
        icon: 'ri-graduation-cap-line',
        path: '/admin/education',
      },
    ],
  },
  {
    key: 'acl',
    label: 'adminNav.groups.acl',
    icon: 'ri-shield-keyhole-line',
    children: [
      { key: 'roles', label: 'adminNav.roles', icon: 'ri-shield-check-line', path: '/admin/roles' },
      {
        key: 'permissions',
        label: 'adminNav.permissions',
        icon: 'ri-key-2-line',
        path: '/admin/permissions',
      },
    ],
  },
  {
    key: 'system',
    label: 'adminNav.groups.system',
    icon: 'ri-server-line',
    children: [
      {
        key: 'business-config',
        label: 'adminNav.businessConfig',
        icon: 'ri-settings-4-line',
        path: '/admin/business-config',
      },
      {
        key: 'profile',
        label: 'adminNav.profile',
        icon: 'ri-user-settings-line',
        path: '/admin/profile',
      },
    ],
  },
];

export const allAdminNavItems: AdminNavItem[] = [
  ...adminStandaloneNav,
  ...adminNavGroups.flatMap((group) => group.children),
];

export function getAdminRouteKeyFromPath(pathname: string): AdminRouteKey {
  const match = allAdminNavItems.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
  return match?.key ?? 'dashboard';
}

export function getAdminGroupKeyForRoute(key: AdminRouteKey): string | null {
  for (const group of adminNavGroups) {
    if (group.children.some((child) => child.key === key)) return group.key;
  }
  return null;
}
