import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export type AdminTab =
  | 'dashboard' | 'jobs' | 'companies'
  | 'project-users' | 'users'
  | 'roles' | 'permissions'
  | 'categories' | 'education' | 'banners' | 'business-config' | 'profile';

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  adminName: string;
  adminRole: string;
}

interface MenuGroup {
  key: string;
  label: string;
  icon: string;
  children: { key: AdminTab; label: string; icon: string }[];
}

const standaloneTabs: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: 'ri-dashboard-line' },
];

const groups: MenuGroup[] = [
  {
    key: 'operations',
    label: 'Vận hành',
    icon: 'ri-settings-3-line',
    children: [
      { key: 'jobs', label: 'Việc làm', icon: 'ri-briefcase-line' },
      { key: 'companies', label: 'Công ty', icon: 'ri-building-line' },
    ],
  },
  {
    key: 'accounts',
    label: 'Tài khoản',
    icon: 'ri-group-line',
    children: [
      { key: 'project-users', label: 'Người dùng', icon: 'ri-user-line' },
      { key: 'users', label: 'Quản trị viên', icon: 'ri-shield-user-line' },
    ],
  },
  {
    key: 'catalog',
    label: 'Danh mục',
    icon: 'ri-database-2-line',
    children: [
      { key: 'categories', label: 'Ngành nghề', icon: 'ri-price-tag-3-line' },
      { key: 'education', label: 'Trình độ', icon: 'ri-graduation-cap-line' },
    ],
  },
  {
    key: 'acl',
    label: 'Phân quyền',
    icon: 'ri-shield-keyhole-line',
    children: [
      { key: 'roles', label: 'Vai trò', icon: 'ri-shield-check-line' },
      { key: 'permissions', label: 'Quyền hạn', icon: 'ri-key-2-line' },
    ],
  },
  {
    key: 'system',
    label: 'Hệ thống',
    icon: 'ri-server-line',
    children: [
      { key: 'banners', label: 'Banner', icon: 'ri-image-line' },
      { key: 'business-config', label: 'Cấu hình hệ thống', icon: 'ri-settings-4-line' },
      { key: 'profile', label: 'Tài khoản', icon: 'ri-user-settings-line' },
    ],
  },
];

export default function AdminSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  adminName,
  adminRole,
}: SidebarProps) {
  const navigate = useNavigate();

  const parentOf = (tab: AdminTab): string | null => {
    for (const g of groups) {
      if (g.children.some((c) => c.key === tab)) return g.key;
    }
    return null;
  };

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const init = new Set<string>();
    const p = parentOf(activeTab);
    if (p) init.add(p);
    return init;
  });

  useEffect(() => {
    const p = parentOf(activeTab);
    if (p) {
      setExpandedGroups((prev) => {
        if (prev.has(p)) return prev;
        const next = new Set(prev);
        next.add(p);
        return next;
      });
    }
  }, [activeTab]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div
      className={`hidden lg:flex flex-shrink-0 bg-background-50 border-r border-background-200/70 h-screen overflow-y-auto transition-all duration-200 flex-col ${collapsed ? 'w-[68px]' : 'w-[260px]'}`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-background-200/70 flex items-center gap-3">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer flex-shrink-0"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          <i className={`${collapsed ? 'ri-menu-fold-line' : 'ri-menu-unfold-line'} text-lg text-foreground-600`}></i>
        </button>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-heading font-bold text-foreground-950 truncate">Jobs247</h1>
            <p className="text-[10px] text-foreground-400">Quản trị hệ thống</p>
          </div>
        )}
      </div>

      {/* Admin mini profile */}
      {!collapsed ? (
        <div className="px-4 py-3 border-b border-background-200/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <i className="ri-shield-user-line text-sm text-primary-600"></i>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground-900 truncate">{adminName}</p>
              <p className="text-[10px] text-foreground-400 capitalize">{adminRole}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-2 py-3 border-b border-background-200/70 flex justify-center">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
            <i className="ri-shield-user-line text-sm text-primary-600"></i>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="p-2 flex-1 overflow-y-auto">
        {collapsed ? (
          /* Collapsed: flat icon list for easy access */
          <>
            {standaloneTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-0.5 ${
                  activeTab === tab.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-foreground-600 hover:bg-background-100'
                }`}
                title={tab.label}
              >
                <i className={`${tab.icon} text-base flex-shrink-0`}></i>
              </button>
            ))}
            {groups.flatMap((g) => g.children).map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-0.5 ${
                  activeTab === tab.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-foreground-600 hover:bg-background-100'
                }`}
                title={tab.label}
              >
                <i className={`${tab.icon} text-base flex-shrink-0`}></i>
              </button>
            ))}
          </>
        ) : (
          /* Expanded: two-level menu */
          <>
            {/* Standalone tabs */}
            {standaloneTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-0.5 ${
                  activeTab === tab.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-foreground-600 hover:bg-background-100'
                }`}
              >
                <i className={`${tab.icon} text-base flex-shrink-0`}></i>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}

            {/* Groups */}
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.key);
              const hasActiveChild = group.children.some((c) => c.key === activeTab);
              return (
                <div key={group.key} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      hasActiveChild
                        ? 'text-primary-700'
                        : 'text-foreground-700 hover:bg-background-100'
                    }`}
                  >
                    <i className={`${group.icon} text-base flex-shrink-0`}></i>
                    <span className="whitespace-nowrap flex-1 text-left">{group.label}</span>
                    <i
                      className={`ri-arrow-down-s-line text-base flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    ></i>
                  </button>
                  {isExpanded && (
                    <div className="mt-0.5 pl-9 pr-1">
                      {group.children.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => onTabChange(tab.key)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer mb-0.5 ${
                            activeTab === tab.key
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
                          }`}
                        >
                          <i className={`${tab.icon} text-sm flex-shrink-0 opacity-70`}></i>
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-background-200/70">
        <button
          onClick={() => navigate('/admin/login')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Đăng xuất' : undefined}
        >
          <i className="ri-logout-box-line text-base"></i>
          {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
}