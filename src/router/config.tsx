import type { RouteObject } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import Layout from '@/components/feature/Layout';
import AuthGuard from '@/components/feature/AuthGuard';
import AdminAuthGuard from '@/components/feature/AdminAuthGuard';
import Home from '@/pages/home/page';
import JobsPage from '@/pages/jobs/page';
import JobDetailPage from '@/pages/jobs/detail/page';
import PostJobPage from '@/pages/post-job/page';
import ContactPage from '@/pages/contact/page';
import LoginPage from '@/pages/login/page';
import RegisterPage from '@/pages/register/page';
import SettingsPage from '@/pages/settings/page';
import AdminLoginPage from '@/pages/admin/login/page';
import AdminPage from '@/pages/admin/page';
import CompaniesPage from '@/pages/companies/page';
import CreateCompanyPage from '@/pages/companies/create/page';
import EditCompanyPage from '@/pages/companies/edit/page';
import CompanyDetailPage from '@/pages/companies/detail/page';
import CompaniesBrowsePage from '@/pages/companies/browse/page';
import SavedJobsPage from '@/pages/saved-jobs/page';
import MyApplicationsPage from '@/pages/my-applications/page';
import DashboardPage from '@/pages/dashboard/page';

const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/jobs', element: <JobsPage /> },
      { path: '/jobs/:id', element: <JobDetailPage /> },
      {
        path: '/post-job',
        element: (
          <AuthGuard>
            <PostJobPage />
          </AuthGuard>
        ),
      },
      { path: '/contact', element: <ContactPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        path: '/settings',
        element: (
          <AuthGuard>
            <SettingsPage />
          </AuthGuard>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <AuthGuard requiredRole="employer">
            <DashboardPage />
          </AuthGuard>
        ),
      },
      {
        path: '/companies/manage',
        element: (
          <AuthGuard requiredRole="employer">
            <CompaniesPage />
          </AuthGuard>
        ),
      },
      {
        path: '/companies/create',
        element: (
          <AuthGuard requiredRole="employer">
            <CreateCompanyPage />
          </AuthGuard>
        ),
      },
      {
        path: '/companies/edit/:id',
        element: (
          <AuthGuard requiredRole="employer">
            <EditCompanyPage />
          </AuthGuard>
        ),
      },
      { path: '/companies/:id', element: <CompanyDetailPage /> },
      { path: '/companies', element: <CompaniesBrowsePage /> },
      {
        path: '/saved-jobs',
        element: (
          <AuthGuard>
            <SavedJobsPage />
          </AuthGuard>
        ),
      },
      {
        path: '/my-applications',
        element: (
          <AuthGuard>
            <MyApplicationsPage />
          </AuthGuard>
        ),
      },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: (
      <AdminAuthGuard>
        <AdminPage />
      </AdminAuthGuard>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;