import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-5">
            <i className="ri-forbid-line text-3xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">
            {t("common.accessDenied")}
          </h2>
          <p className="text-sm text-foreground-600 mb-6">
            {t("common.accessDeniedDesc")}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-1.5"></i> {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
