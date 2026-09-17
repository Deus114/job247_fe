import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AuthGuard from "@/components/guards/AuthGuard";
import AdminAuthGuard from "@/components/guards/AdminAuthGuard";
import LazyPage from "@/components/LazyPage";

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
const EditCompanyPage = lazy(() => import("@/pages/companies/edit/page"));
const CompanyDetailPage = lazy(() => import("@/pages/companies/detail/page"));
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
const AdminProjectUsersPage = lazy(
  () => import("@/features/admin/components/ProjectUsersPage"),
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
        element: (
          <LazyPage>
            <AuthGuard requiredRole="employer">
              <PostJobPage />
            </AuthGuard>
          </LazyPage>
        ),
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
        element: (
          <LazyPage>
            <AuthGuard requiredRole="employer">
              <DashboardPage />
            </AuthGuard>
          </LazyPage>
        ),
      },
      {
        path: "/companies/manage",
        element: (
          <LazyPage>
            <AuthGuard requiredRole="employer">
              <CompaniesPage />
            </AuthGuard>
          </LazyPage>
        ),
      },
      {
        path: "/companies/create",
        element: (
          <LazyPage>
            <AuthGuard requiredRole="employer">
              <CreateCompanyPage />
            </AuthGuard>
          </LazyPage>
        ),
      },
      {
        path: "/companies/edit/:id",
        element: (
          <LazyPage>
            <AuthGuard requiredRole="employer">
              <EditCompanyPage />
            </AuthGuard>
          </LazyPage>
        ),
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
        element: (
          <LazyPage>
            <AdminProjectUsersPage />
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
