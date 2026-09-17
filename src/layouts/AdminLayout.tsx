import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/features/auth';
import {
  AdminAvatar,
  AdminSidebar,
  adminNavGroups,
  adminStandaloneNav,
  getAdminRouteKeyFromPath,
} from '@/features/admin';
import { useCatalogBootstrap } from '@/features/catalog';
import { fetchAdminMe } from '@/api';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function AdminLayout() {
  const { t } = useTranslation();
  useCatalogBootstrap();

  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout: logoutAdmin, setSessionUser } = useAdminAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const activeTab = useMemo(
    () => getAdminRouteKeyFromPath(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const user = await fetchAdminMe();
        if (!cancelled) setSessionUser(user);
      } catch {
        // Keep existing session from login if /me fails.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    setMobileSidebarOpen(false);
    navigate('/admin/login', { replace: true });
  };

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10">
          <div className="w-20 h-20 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
            <i className="ri-shield-cross-line text-3xl text-foreground-400"></i>
          </div>
          <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
            {t('common.accessDenied')}
          </h3>
          <p className="text-sm text-foreground-500 mb-6">
            {t('admin.loginRequired')}
          </p>
          <button
            onClick={() => navigate('/admin/login')}
            className="px-6 py-2.5 bg-foreground-950 text-foreground-50 rounded-full text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {t('adminLogin.title')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background-100 flex">
      <AdminSidebar
        activeTab={activeTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        adminName={admin.name}
        adminRole={admin.role?.name || 'Admin'}
        adminAvatar={admin.avatar}
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="lg:hidden flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-background-200/70 hover:bg-background-100 transition-colors cursor-pointer flex-shrink-0"
            >
              <i className="ri-menu-line text-lg text-foreground-600"></i>
            </button>
            <span className="font-heading font-semibold text-foreground-950 truncate">
              Jobs247 Admin
            </span>
          </div>
          <div className="hidden lg:block" />
          <LanguageSwitcher />
        </div>

        <Outlet />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-background-50 overflow-y-auto flex flex-col border-r border-background-200/70">
            <div className="px-4 py-4 border-b border-background-200/70 flex items-center justify-between">
              <div>
                <h1 className="text-sm font-heading font-bold text-foreground-950">Jobs247</h1>
                <p className="text-[10px] text-foreground-400">Quản trị hệ thống</p>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line text-lg text-foreground-600"></i>
              </button>
            </div>
            <div className="px-4 py-3 border-b border-background-200/70">
              <div className="flex items-center gap-2.5">
                <AdminAvatar src={admin.avatar} name={admin.name} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground-900 truncate">{admin.name}</p>
                  <p className="text-[10px] text-foreground-400">
                    {admin.role?.name || 'Admin'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-2 flex-1">
              {adminStandaloneNav.map((tab) => (
                <NavLink
                  key={tab.key}
                  to={tab.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-0.5 ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-foreground-600 hover:bg-background-100'
                    }`
                  }
                >
                  <i className={`${tab.icon} text-base flex-shrink-0`}></i>
                  <span className="whitespace-nowrap">{t(tab.label)}</span>
                </NavLink>
              ))}

              {adminNavGroups.map((group) => {
                const hasActive = group.children.some((c) => c.key === activeTab);
                return (
                  <div key={group.label} className="mb-1">
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                        hasActive ? 'text-primary-700' : 'text-foreground-700'
                      }`}
                    >
                      <i className={`${group.icon} text-base flex-shrink-0`}></i>
                      <span className="whitespace-nowrap flex-1">{group.label}</span>
                    </div>
                    <div className="pl-9 pr-1">
                      {group.children.map((tab) => (
                        <NavLink
                          key={tab.key}
                          to={tab.path}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer mb-0.5 ${
                              isActive
                                ? 'bg-primary-100 text-primary-700 font-medium'
                                : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
                            }`
                          }
                        >
                          <i className={`${tab.icon} text-sm flex-shrink-0 opacity-70`}></i>
                          <span className="whitespace-nowrap">{t(tab.label)}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-background-200/70">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <i className="ri-logout-box-line text-base"></i>
                <span className="whitespace-nowrap">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
