import { Navigate } from 'react-router-dom';

/** Legacy entry — admin now uses nested routes under AdminLayout. */
export default function AdminPage() {
  return <Navigate to="/admin/dashboard" replace />;
}
