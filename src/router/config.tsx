import AdminAuthGuard from "@/components/guards/AdminAuthGuard";
import AuthGuard from "@/components/guards/AuthGuard";
import LazyPage from "@/components/LazyPage";
import { useAuth } from "@/features/auth";
import AdminLayout from "@/layouts/AdminLayout";
import AppLayout from "@/layouts/AppLayout";
import EmployerLayout from "@/layouts/EmployerLayout";
import { lazy } from "react";
import { Navigate, useParams, type RouteObject } from "react-router-dom";

const Home = lazy(() => import("@/pages/home/page"));
const JobsPage = lazy(() => import("@/pages/jobs/page"));
const JobDetailPage = lazy(() => import("@/pages/jobs/detail/page"));
const PostJobPage = lazy(() => import("@/pages/post-job/page"));
const ContactPage = lazy(() => import("@/pages/contact/page"));
const LoginPage = lazy(() => import("@/pages/login/page"));
const RegisterPage = lazy(() => import("@/pages/register/page"));
const SettingsPage = lazy(() => import("@/pages/settings/page"));
const AdminLoginPage = lazy(() => import("@/pages/admin/login/page"));
const CompaniesPage = lazy(() => import("@/pages/companies/page"));
const CreateCompanyPage = lazy(() => import("@/pages/companies/create/page"));
const FindCompanyPage = lazy(() => import("@/pages/companies/find/page"));
const MyJoinRequestsPage = lazy(
  () => import("@/pages/companies/join-requests/page"),
);
const EditCompanyPage = lazy(() => import("@/pages/companies/edit/page"));
const CompanyDetailPage = lazy(() => import("@/pages/companies/detail/page"));
const EmployerCompanyDetailPage = lazy(
  () => import("@/pages/companies/employer-detail/page"),
);
const CompaniesBrowsePage = lazy(() => import("@/pages/companies/browse/page"));
const SavedJobsPage = lazy(() => import("@/pages/saved-jobs/page"));
const MyApplicationsPage = lazy(() => import("@/pages/my-applications/page"));
const DashboardPage = lazy(() => import("@/pages/dashboard/page"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const AdminDashboardPage = lazy(
  () => import("@/features/admin/components/DashboardPage"),
);
const AdminJobsPage = lazy(
  () => import("@/features/admin/components/JobsPage"),
);
const AdminCompaniesPage = lazy(
  () => import("@/features/admin/components/CompaniesPage"),
);
const AdminJobSeekersPage = lazy(
  () => import("@/features/admin/components/JobSeekersPage"),
);
const AdminEmployersPage = lazy(
  () => import("@/features/admin/components/EmployersPage"),
);
const AdminUsersPage = lazy(
  () => import("@/features/admin/components/UsersPage"),
);
const AdminRolesPage = lazy(
  () => import("@/features/admin/components/RolesPage"),
);
const AdminPermissionsPage = lazy(
  () => import("@/features/admin/components/PermissionsPage"),
);
const AdminIndustryGroupsPage = lazy(
  () => import("@/features/admin/components/IndustryGroupsPage"),
);
const AdminIndustriesPage = lazy(
  () => import("@/features/admin/components/IndustriesPage"),
);
const AdminProvincesPage = lazy(
  () => import("@/features/admin/components/ProvincesPage"),
);
const AdminEducationPage = lazy(
  () => import("@/features/admin/components/EducationPage"),
);
const AdminBusinessConfigPage = lazy(
  () => import("@/features/admin/components/BusinessConfigPage"),
);
const AdminProfilePage = lazy(
  () => import("@/features/admin/components/ProfilePage"),
);
const PrivacyPage = lazy(() => import("@/pages/privacy/page"));
const TermsPage = lazy(() => import("@/pages/terms/page"));

function RedirectEmployerPath({ to }: { to: string }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: to }} replace />;
  }
  if (user?.role !== "employer") {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={to} replace />;
}

function RedirectCompanyEdit() {
  const { id } = useParams();
  return <RedirectEmployerPath to={`/employer/companies/${id}/edit`} />;
}

const routes: RouteObject[] = [
  // App routes
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: (
          <LazyPage>
            <Home />
          </LazyPage>
        ),
      },
      {
        path: "/jobs",
        element: (
          <LazyPage>
            <JobsPage />
          </LazyPage>
        ),
      },
      {
        path: "/jobs/:id",
        element: (
          <LazyPage>
            <JobDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "/post-job",
        element: <RedirectEmployerPath to="/employer/jobs/new" />,
      },
      {
        path: "/contact",
        element: (
          <LazyPage>
            <ContactPage />
          </LazyPage>
        ),
      },
      {
        path: "/privacy",
        element: (
          <LazyPage>
            <PrivacyPage />
          </LazyPage>
        ),
      },
      {
        path: "/terms",
        element: (
          <LazyPage>
            <TermsPage />
          </LazyPage>
        ),
      },
      {
        path: "/login",
        element: (
          <LazyPage>
            <LoginPage />
          </LazyPage>
        ),
      },
      {
        path: "/register",
        element: (
          <LazyPage>
            <RegisterPage />
          </LazyPage>
        ),
      },
      {
        path: "/settings",
        element: (
          <LazyPage>
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          </LazyPage>
        ),
      },
      {
        path: "/dashboard",
        element: <RedirectEmployerPath to="/employer" />,
      },
      {
        path: "/companies/manage",
        element: <RedirectEmployerPath to="/employer/companies" />,
      },
      {
        path: "/companies/create",
        element: <RedirectEmployerPath to="/employer/companies/new" />,
      },
      {
        path: "/companies/edit/:id",
        element: <RedirectCompanyEdit />,
      },
      {
        path: "/companies/:id",
        element: (
          <LazyPage>
            <CompanyDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "/companies",
        element: (
          <LazyPage>
            <CompaniesBrowsePage />
          </LazyPage>
        ),
      },
      {
        path: "/saved-jobs",
        element: (
          <LazyPage>
            <AuthGuard>
              <SavedJobsPage />
            </AuthGuard>
          </LazyPage>
        ),
      },
      {
        path: "/my-applications",
        element: (
          <LazyPage>
            <AuthGuard>
              <MyApplicationsPage />
            </AuthGuard>
          </LazyPage>
        ),
      },
    ],
  },

  {
    path: "/employer",
    element: (
      <AuthGuard requiredRole="employer">
        <EmployerLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyPage>
            <DashboardPage />
          </LazyPage>
        ),
      },
      {
        path: "jobs",
        element: (
          <LazyPage>
            <DashboardPage />
          </LazyPage>
        ),
      },
      {
        path: "applications",
        element: (
          <LazyPage>
            <DashboardPage />
          </LazyPage>
        ),
      },
      {
        path: "jobs/new",
        element: (
          <LazyPage>
            <PostJobPage />
          </LazyPage>
        ),
      },
      {
        path: "jobs/:id/edit",
        element: (
          <LazyPage>
            <PostJobPage />
          </LazyPage>
        ),
      },
      {
        path: "companies",
        element: (
          <LazyPage>
            <CompaniesPage />
          </LazyPage>
        ),
      },
      {
        path: "companies/new",
        element: (
          <LazyPage>
            <CreateCompanyPage />
          </LazyPage>
        ),
      },
      {
        path: "companies/find",
        element: (
          <LazyPage>
            <FindCompanyPage />
          </LazyPage>
        ),
      },
      {
        path: "companies/join-requests",
        element: (
          <LazyPage>
            <MyJoinRequestsPage />
          </LazyPage>
        ),
      },
      {
        path: "companies/:id/edit",
        element: (
          <LazyPage>
            <EditCompanyPage />
          </LazyPage>
        ),
      },
      {
        path: "companies/:id",
        element: (
          <LazyPage>
            <EmployerCompanyDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "settings",
        element: (
          <LazyPage>
            <SettingsPage />
          </LazyPage>
        ),
      },
    ],
  },

  // Admin routes
  {
    path: "/login/admin",
    element: <Navigate to="/admin/login" replace />,
  },
  {
    path: "/admin/login",
    element: (
      <LazyPage>
        <AdminLoginPage />
      </LazyPage>
    ),
  },
  {
    path: "/admin",
    element: (
      <AdminAuthGuard>
        <AdminLayout />
      </AdminAuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <LazyPage>
            <AdminDashboardPage />
          </LazyPage>
        ),
      },
      {
        path: "jobs",
        element: (
          <LazyPage>
            <AdminJobsPage />
          </LazyPage>
        ),
      },
      {
        path: "companies",
        element: (
          <LazyPage>
            <AdminCompaniesPage />
          </LazyPage>
        ),
      },
      {
        path: "project-users",
        element: <Navigate to="/admin/accounts/job-seekers" replace />,
      },
      {
        path: "accounts/job-seekers",
        element: (
          <LazyPage>
            <AdminJobSeekersPage />
          </LazyPage>
        ),
      },
      {
        path: "accounts/employers",
        element: (
          <LazyPage>
            <AdminEmployersPage />
          </LazyPage>
        ),
      },
      {
        path: "users",
        element: (
          <LazyPage>
            <AdminUsersPage />
          </LazyPage>
        ),
      },
      {
        path: "roles",
        element: (
          <LazyPage>
            <AdminRolesPage />
          </LazyPage>
        ),
      },
      {
        path: "permissions",
        element: (
          <LazyPage>
            <AdminPermissionsPage />
          </LazyPage>
        ),
      },
      {
        path: "industry-groups",
        element: (
          <LazyPage>
            <AdminIndustryGroupsPage />
          </LazyPage>
        ),
      },
      {
        path: "industries",
        element: (
          <LazyPage>
            <AdminIndustriesPage />
          </LazyPage>
        ),
      },
      {
        path: "provinces",
        element: (
          <LazyPage>
            <AdminProvincesPage />
          </LazyPage>
        ),
      },
      {
        path: "categories",
        element: <Navigate to="/admin/industries" replace />,
      },
      {
        path: "education",
        element: (
          <LazyPage>
            <AdminEducationPage />
          </LazyPage>
        ),
      },
      {
        path: "business-config",
        element: (
          <LazyPage>
            <AdminBusinessConfigPage />
          </LazyPage>
        ),
      },
      {
        path: "profile",
        element: (
          <LazyPage>
            <AdminProfilePage />
          </LazyPage>
        ),
      },
      {
        path: "*",
        element: (
          <LazyPage>
            <NotFound />
          </LazyPage>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <LazyPage>
        <NotFound />
      </LazyPage>
    ),
  },
];

export default routes;
