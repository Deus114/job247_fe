import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/features/auth";
import { isValidAdminSession } from "@/types/adminAuth";
import { ensureAdminSession, type EnsureAdminSessionResult } from "@/api";
import PageLoader from "@/components/ui/PageLoader";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

function applySessionResult(
  result: EnsureAdminSessionResult,
  ctx: {
    isAuthenticated: boolean;
    accessToken: string | null;
    admin: ReturnType<typeof useAdminAuth>["admin"];
    login: ReturnType<typeof useAdminAuth>["login"];
    logout: ReturnType<typeof useAdminAuth>["logout"];
  },
): boolean {
  if (result.ok === false) {
    if (result.reason === "network") {
      return (
        ctx.isAuthenticated &&
        Boolean(
          ctx.accessToken || localStorage.getItem("admin_access_token"),
        ) &&
        isValidAdminSession(ctx.admin)
      );
    }
    ctx.logout();
    return false;
  }

  ctx.login({
    user: result.user,
    accessToken:
      localStorage.getItem("admin_access_token") || ctx.accessToken || "",
    refreshToken: localStorage.getItem("admin_refresh_token") || "",
  });
  return isValidAdminSession(result.user);
}

/**
 * On each enter to /admin/*: validate access token (refresh if expired).
 * Refresh failure → clear tokens + redirect login.
 */
export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { isAuthenticated, admin, accessToken, login, logout } = useAdminAuth();
  const location = useLocation();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setBootstrapping(true);

      const hasLocalSession =
        isAuthenticated ||
        Boolean(localStorage.getItem("admin_access_token")) ||
        Boolean(localStorage.getItem("admin_refresh_token"));

      if (!hasLocalSession) {
        if (!cancelled) {
          logout();
          setAllowed(false);
          setBootstrapping(false);
        }
        return;
      }

      const result = await ensureAdminSession();
      if (cancelled) return;

      setAllowed(
        applySessionResult(result, {
          isAuthenticated,
          accessToken,
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
