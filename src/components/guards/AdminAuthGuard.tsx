import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/features/auth';
import { isValidAdminSession } from '@/types/adminAuth';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { isAuthenticated, admin, accessToken } = useAdminAuth();
  const location = useLocation();

  const allowed =
    isAuthenticated &&
    Boolean(accessToken || localStorage.getItem('admin_access_token')) &&
    isValidAdminSession(admin);

  if (!allowed) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
