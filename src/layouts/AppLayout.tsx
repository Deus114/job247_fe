import { useAuth, useSyncPublicProfile } from "@/features/auth";
import { useCatalogBootstrap } from "@/features/catalog";
import Footer from "@/layouts/Footer";
import Navbar from "@/layouts/Navbar";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function AppLayout() {
  useCatalogBootstrap();
  useSyncPublicProfile();
  const { user } = useAuth();
  const location = useLocation();
  const previewingCompany =
    /^\/companies\/[^/]+$/.test(location.pathname) &&
    location.pathname !== "/companies/manage" &&
    location.pathname !== "/companies/create";

  if (user?.role === "employer" && !previewingCompany) {
    return <Navigate to="/employer" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
