import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/features/auth';
import {
  adminNavGroups,
  adminStandaloneNav,
  getAdminGroupKeyForRoute,
  type AdminRouteKey,
} from '@/features/admin/config/nav';

interface SidebarProps {
  activeTab: AdminRouteKey;
  collapsed: boolean;
  onToggleCollapse: () => void;
  adminName: string;
  adminRole: string;
}

export type { AdminRouteKey as AdminTab };

export default function AdminSidebar({
  activeTab,
  collapsed,
  onToggleCollapse,
  adminName,
  adminRole,
}: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout: logoutAdmin } = useAdminAuth();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const init = new Set<string>();
    const parent = getAdminGroupKeyForRoute(activeTab);
    if (parent) init.add(parent);
    return init;
  });

  useEffect(() => {
    const parent = getAdminGroupKeyForRoute(activeTab);
    if (parent) {
      setExpandedGroups((prev) => {
        if (prev.has(parent)) return prev;
        const next = new Set(prev);
        next.add(parent);
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

  const linkClass = (isActive: boolean, compact = false) =>
    `w-full flex items-center ${compact ? 'justify-center' : 'gap-3'} px-3 ${
      compact ? 'py-2.5' : 'py-2.5'
    } rounded-lg text-sm font-medium transition-colors cursor-pointer mb-0.5 ${
      isActive
        ? 'bg-primary-100 text-primary-700'
        : 'text-foreground-600 hover:bg-background-100'
    }`;

  const childLinkClass = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer mb-0.5 ${
      isActive
        ? 'bg-primary-100 text-primary-700 font-medium'
        : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
    }`;

  return (
    <div
      className={`hidden lg:flex flex-shrink-0 bg-background-50 border-r border-background-200/70 h-screen overflow-y-auto transition-all duration-200 flex-col ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      <div className="px-4 py-4 border-b border-background-200/70 flex items-center gap-3">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer flex-shrink-0"
          title={collapsed ? t('admin.expand', 'Mở rộng') : t('admin.collapse', 'Thu gọn')}
        >
          <i
            className={`${collapsed ? 'ri-menu-fold-line' : 'ri-menu-unfold-line'} text-lg text-foreground-600`}
          ></i>
        </button>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-heading font-bold text-foreground-950 truncate">
              Jobs247
            </h1>
            <p className="text-[10px] text-foreground-400">{t('adminLogin.subtitle')}</p>
          </div>
        )}
      </div>

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

      <div className="p-2 flex-1 overflow-y-auto">
        {collapsed ? (
          <>
            {adminStandaloneNav.map((tab) => (
              <NavLink
                key={tab.key}
                to={tab.path}
                className={({ isActive }) => linkClass(isActive, true)}
                title={t(tab.label)}
              >
                <i className={`${tab.icon} text-base flex-shrink-0`}></i>
              </NavLink>
            ))}
            {adminNavGroups.flatMap((g) => g.children).map((tab) => (
              <NavLink
                key={tab.key}
                to={tab.path}
                className={({ isActive }) => linkClass(isActive, true)}
                title={t(tab.label)}
              >
                <i className={`${tab.icon} text-base flex-shrink-0`}></i>
              </NavLink>
            ))}
          </>
        ) : (
          <>
            {adminStandaloneNav.map((tab) => (
              <NavLink
                key={tab.key}
                to={tab.path}
                className={({ isActive }) => linkClass(isActive)}
              >
                <i className={`${tab.icon} text-base flex-shrink-0`}></i>
                <span className="whitespace-nowrap">{t(tab.label)}</span>
              </NavLink>
            ))}

            {adminNavGroups.map((group) => {
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
                    <span className="whitespace-nowrap flex-1 text-left">{t(group.label)}</span>
                    <i
                      className={`ri-arrow-down-s-line text-base flex-shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    ></i>
                  </button>
                  {isExpanded && (
                    <div className="mt-0.5 pl-9 pr-1">
                      {group.children.map((tab) => (
                        <NavLink
                          key={tab.key}
                          to={tab.path}
                          className={({ isActive }) => childLinkClass(isActive)}
                        >
                          <i className={`${tab.icon} text-sm flex-shrink-0 opacity-70`}></i>
                          <span className="whitespace-nowrap">{t(tab.label)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="p-2 border-t border-background-200/70">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? t('nav.logout') : undefined}
        >
          <i className="ri-logout-box-line text-base"></i>
          {!collapsed && <span className="whitespace-nowrap">{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  );
}
