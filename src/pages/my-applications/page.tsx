import { fetchJobSeekerApplicationById } from "@/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useApplications, ViewApplicationModal } from "@/features/applications";
import { useAuth } from "@/features/auth";
import { notificationFocus } from "@/features/notifications";
import { formatDate } from "@/lib/formatDate";
import { jobPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import type { Application } from "@/types/application";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation } from "react-router-dom";

const statusColor: Record<string, string> = {
  pending: "bg-secondary-100 text-secondary-700",
  reviewing: "bg-accent-100 text-accent-700",
  interviewing: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusDot: Record<string, string> = {
  pending: "bg-secondary-500",
  reviewing: "bg-accent-500",
  interviewing: "bg-blue-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
};

export default function MyApplicationsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { applications, loadApplications, resolveError } = useApplications();
  const [viewApp, setViewApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadApplications({ page: 1, size: 50 })
      .catch((error) => {
        if (!cancelled) toast.error(resolveError(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadApplications, resolveError]);

  const focus = notificationFocus(location.search, location.state);
  useEffect(() => {
    if (!focus || !isAuthenticated) return;
    let cancelled = false;
    void fetchJobSeekerApplicationById(focus.id)
      .then((app) => {
        if (!cancelled) setViewApp(app);
      })
      .catch((error) => {
        if (!cancelled) toast.error(resolveError(error));
      });
    return () => {
      cancelled = true;
    };
  }, [focus?.key, isAuthenticated, resolveError]);

  if (user?.role === "employer") {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" state={{ from: "/my-applications" }} replace />
    );
  }

  return (
    <div className="min-h-screen pt-[70px]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950 mb-2">
            {t("applications.title")}
          </h1>
          <p className="text-sm text-foreground-600">
            {t("applications.desc")}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
              <i className="ri-send-plane-line text-3xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              {t("applications.empty")}
            </h3>
            <p className="text-sm text-foreground-500 mb-6">
              {t("applications.emptyDesc")}
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              <i className="ri-search-line"></i> {t("applications.browseJobs")}
            </Link>
          </div>
        ) : (
          <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-background-200/70 bg-background-100/50">
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                      {t("job.jobTitle")}
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">
                      {t("applications.appliedDate")}
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                      {t("applications.status")}
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider text-right">
                      {t("applications.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-200/70">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-background-100/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-background-100 border border-background-200/70 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {app.companyLogo ? (
                              <img
                                src={app.companyLogo}
                                alt={app.companyName}
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <i className="ri-building-line text-foreground-400"></i>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground-900 truncate">
                              {app.jobTitle}
                            </p>
                            <p className="text-xs text-foreground-500 truncate">
                              {app.companyName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-foreground-600">
                          {formatDate(app.appliedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColor[app.status] || "bg-background-100 text-foreground-600"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusDot[app.status] || "bg-foreground-400"}`}
                          ></span>
                          {t(`applications.statuses.${app.status}`, app.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewApp(app)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-primary-500 transition-colors cursor-pointer"
                            title={t("applications.view")}
                          >
                            <i className="ri-eye-line text-lg"></i>
                          </button>
                          {app.jobId ? (
                            <Link
                              to={jobPath({
                                id: app.jobId,
                                title: app.jobTitle,
                              })}
                              className="w-10 h-10 hidden md:flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-400 hover:text-foreground-600 transition-colors"
                              title={t("job.viewDetail")}
                            >
                              <i className="ri-external-link-line text-base"></i>
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {viewApp ? (
        <ViewApplicationModal
          application={viewApp}
          isOpen
          onClose={() => setViewApp(null)}
        />
      ) : null}
    </div>
  );
}
