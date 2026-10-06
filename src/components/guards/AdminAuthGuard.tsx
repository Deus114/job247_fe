import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/features/auth";
import {
  isValidAdminSession,
  type EnsureAdminSessionResult,
} from "@/types/adminAuth";
import { ensureAdminSession } from "@/api";
import PageLoader from "@/components/ui/PageLoader";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

function applySessionResult(
  result: EnsureAdminSessionResult,
  ctx: {
    isAuthenticated: boolean;
    admin: ReturnType<typeof useAdminAuth>["admin"];
    login: ReturnType<typeof useAdminAuth>["login"];
    logout: ReturnType<typeof useAdminAuth>["logout"];
  },
): boolean {
  if (result.ok === false) {
    if (result.reason === "network") {
      return ctx.isAuthenticated && isValidAdminSession(ctx.admin);
    }
    ctx.logout();
    return false;
  }

  ctx.login({ user: result.user });
  return isValidAdminSession(result.user);
}

/**
 * On each enter to /admin/*: refresh cookie session if needed.
 * Refresh failure → clear RAM access + redirect login.
 */
export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { isAuthenticated, admin, login, logout } = useAdminAuth();
  const location = useLocation();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setBootstrapping(true);

      const result = await ensureAdminSession();
      if (cancelled) return;

      setAllowed(
        applySessionResult(result, {
          isAuthenticated,
          admin,
          login,
          logout,
        }),
      );
      setBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (bootstrapping) {
    return <PageLoader />;
  }

  if (!allowed) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
}
