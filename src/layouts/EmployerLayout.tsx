import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useAuth, useSyncPublicProfile } from "@/features/auth";
import { employerNav } from "@/features/employer/config/nav";
import { toast } from "@/lib/toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts.length > 1 ? parts.slice(-2) : parts)
    .map((part) => part[0])
    .join("");
  return letters.toUpperCase() || "E";
}

export default function EmployerLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useSyncPublicProfile();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const message = await logout();
      toast.success(message || t("nav.logoutSuccess"));
      setMobileOpen(false);
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const linkClass = (isActive: boolean, compact = false) =>
    `w-full flex items-center ${compact ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-0.5 min-h-[44px] ${
      isActive
        ? "bg-primary-100 text-primary-700"
        : "text-foreground-600 hover:bg-background-100"
    }`;

  const navLinks = (compact: boolean, onNavigate?: () => void) =>
    employerNav.map((item) => (
      <NavLink
        key={item.key}
        to={item.path}
        end={item.end}
        title={compact ? t(item.label) : undefined}
        onClick={onNavigate}
        className={({ isActive }) => linkClass(isActive, compact)}
      >
        <i className={`${item.icon} text-base flex-shrink-0`}></i>
        {!compact && <span className="whitespace-nowrap">{t(item.label)}</span>}
      </NavLink>
    ));

  return (
    <div className="h-screen overflow-hidden bg-background-100 flex">
      <aside
        className={`hidden lg:flex flex-shrink-0 bg-background-50 border-r border-background-200/70 h-screen overflow-y-auto transition-all duration-200 flex-col ${
          collapsed ? "w-[68px]" : "w-[260px]"
        }`}
      >
        <div className="px-4 py-4 border-b border-background-200/70 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <i
              className={`${collapsed ? "ri-menu-fold-line" : "ri-menu-unfold-line"} text-lg text-foreground-600`}
            ></i>
          </button>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-heading font-bold text-foreground-950 truncate">
                Jobs247
              </h1>
              <p className="text-[10px] text-foreground-400">
                {t("employerNav.brand")}
              </p>
            </div>
          )}
        </div>

        <div
          className={`border-b border-background-200/70 ${collapsed ? "px-2 py-3 flex justify-center" : "px-4 py-3"}`}
        >
          <div className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}>
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                initials(user?.fullName || user?.email || "")
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground-900 truncate">
                  {user?.fullName}
                </p>
                <p className="text-[10px] text-foreground-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-2 flex-1 overflow-y-auto">{navLinks(collapsed)}</div>

        <div className="p-2 border-t border-background-200/70">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <i
              className={`${loggingOut ? "ri-loader-4-line animate-spin" : "ri-logout-box-line"} text-base`}
            ></i>
            {!collapsed && (
              <span>{loggingOut ? t("nav.loggingOut") : t("nav.logout")}</span>
            )}
          </button>
        </div>
      </aside>

      <div
        data-scroll-reset
        className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="lg:hidden flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-background-200/70 hover:bg-background-100 transition-colors cursor-pointer flex-shrink-0"
            >
              <i className="ri-menu-line text-lg text-foreground-600"></i>
            </button>
            <span className="font-heading font-semibold text-foreground-950 truncate">
              {t("employerNav.brand")}
            </span>
          </div>
          <div className="hidden lg:block" />
          <LanguageSwitcher />
        </div>
        <Outlet />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-background-50 overflow-y-auto flex flex-col border-r border-background-200/70">
            <div className="px-4 py-4 border-b border-background-200/70 flex items-center justify-between">
              <div>
                <h1 className="text-sm font-heading font-bold text-foreground-950">
                  Jobs247
                </h1>
                <p className="text-[10px] text-foreground-400">
                  {t("employerNav.brand")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line text-lg text-foreground-600"></i>
              </button>
            </div>
            <div className="px-4 py-3 border-b border-background-200/70">
              <p className="text-sm font-medium text-foreground-900 truncate">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-foreground-400 truncate">
                {user?.email}
              </p>
            </div>
            <div className="p-2 flex-1">
              {navLinks(false, () => setMobileOpen(false))}
            </div>
            <div className="p-2 border-t border-background-200/70">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <i
                  className={
                    loggingOut
                      ? "ri-loader-4-line animate-spin"
                      : "ri-logout-box-line"
                  }
                ></i>
                {loggingOut ? t("nav.loggingOut") : t("nav.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
