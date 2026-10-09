import {
  AdminAuthError,
  fetchAdminDashboard,
  resolveAdminAuthErrorMessage,
} from "@/api";
import BarChart from "@/components/ui/BarChart";
import DonutChart from "@/components/ui/DonutChart";
import LineChart from "@/components/ui/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatDateTime } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import type { AdminDashboard } from "@/types/adminDashboard";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function formatChange(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
  return rounded > 0 ? `+${text}%` : `${text}%`;
}

function changeClass(value: number): string {
  if (value > 0) return "text-accent-600 bg-accent-50";
  if (value < 0) return "text-red-600 bg-red-50";
  return "text-foreground-500 bg-background-100";
}

function monthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!match) return month;
  return `${match[2]}/${match[1]}`;
}

function userTypeLabel(type: string, t: (key: string) => string): string {
  const raw = type.trim().toUpperCase();
  if (raw === "JOB_SEEKER" || raw === "USER") {
    return t("adminUi.publicAccounts.jobSeeker");
  }
  if (raw === "EMPLOYER") return t("adminUi.publicAccounts.employer");
  return type.trim() || "—";
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAdminDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(
          error instanceof AdminAuthError
            ? resolveAdminAuthErrorMessage(error, t)
            : t("apiErrors.adminDashboardLoadFailed"),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const summary = dashboard?.summary;
  const jobsByIndustry =
    dashboard?.jobsByIndustry.map((item) => ({
      label: item.industryName,
      value: item.count,
    })) ?? [];
  const companyStatus = dashboard?.companiesByStatus;
  const companyStatusData = companyStatus
    ? [
        {
          label: t("adminUi.status.approved"),
          value: companyStatus.approved,
          color: "oklch(var(--accent-500))",
        },
        {
          label: t("adminUi.status.pending"),
          value: companyStatus.pending,
          color: "oklch(0.82 0.16 95)",
        },
        {
          label: t("adminUi.status.rejected"),
          value: companyStatus.rejected,
          color: "oklch(0.63 0.21 25)",
        },
      ]
    : [];
  const jobsOverTime =
    dashboard?.jobsByMonth.map((item) => ({
      label: monthLabel(item.month),
      value: item.count,
    })) ?? [];
  const statusTotal = companyStatus
    ? companyStatus.approved + companyStatus.pending + companyStatus.rejected
    : 0;

  const cards = [
    {
      label: t("adminUi.dashboard.totalJobs"),
      value: summary?.jobs.count ?? 0,
      change: summary?.jobs.changePercent ?? 0,
      icon: "ri-briefcase-line",
      color: "text-primary-500",
      bg: "bg-primary-100",
    },
    {
      label: t("adminUi.dashboard.companies"),
      value: summary?.companies.count ?? 0,
      change: summary?.companies.changePercent ?? 0,
      icon: "ri-building-line",
      color: "text-accent-500",
      bg: "bg-accent-100",
    },
    {
      label: t("adminUi.dashboard.totalUsers"),
      value: summary?.users.count ?? 0,
      change: summary?.users.changePercent ?? 0,
      icon: "ri-team-line",
      color: "text-secondary-500",
      bg: "bg-secondary-100",
    },
    {
      label: t("adminUi.dashboard.pendingCompanies"),
      value: summary?.pending.count ?? 0,
      change: summary?.pending.changePercent ?? 0,
      icon: "ri-time-line",
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground-950 mb-6">
        {t("adminUi.pageTitles.dashboard")}
      </h2>

      {loading && !dashboard ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {cards.map((stat) => (
              <div
                key={stat.label}
                className="bg-background-50 border border-background-200/70 rounded-xl p-4 sm:p-5 min-w-0"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}
                  >
                    <i className={`${stat.icon} ${stat.color}`}></i>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${changeClass(stat.change)}`}
                    >
                      {formatChange(stat.change)}
                    </span>
                    <span className="text-[10px] leading-tight text-right text-foreground-400 max-w-[6.5rem]">
                      {t("adminUi.dashboard.vsLastMonth")}
                    </span>
                  </div>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground-950">
                  {stat.value}
                </p>
                <p className="text-xs text-foreground-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 bg-background-50 border border-background-200/70 rounded-xl p-4 sm:p-5 min-w-0">
              <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">
                {t("adminUi.dashboard.jobsByCategory")}
              </h3>
              <p className="text-xs text-foreground-500 mb-4">
                {t("adminUi.dashboard.jobsDistribution")}
              </p>
              {jobsByIndustry.length > 0 ? (
                <BarChart data={jobsByIndustry} height={180} />
              ) : (
                <p className="text-sm text-foreground-500">
                  {t("adminUi.dashboard.empty")}
                </p>
              )}
            </div>

            <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 sm:p-5 min-w-0 overflow-x-auto">
              <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">
                {t("adminUi.dashboard.companyStatus")}
              </h3>
              <p className="text-xs text-foreground-500 mb-4">
                {t("adminUi.dashboard.companyApprovalRate")}
              </p>
              {statusTotal > 0 ? (
                <DonutChart data={companyStatusData} size={160} />
              ) : (
                <p className="text-sm text-foreground-500">
                  {t("adminUi.dashboard.empty")}
                </p>
              )}
            </div>
          </div>

          <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 sm:p-5 mb-6 min-w-0">
            <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">
              {t("adminUi.dashboard.jobsOverTime")}
            </h3>
            <p className="text-xs text-foreground-500 mb-4">
              {t("adminUi.dashboard.jobsTrend")}
            </p>
            {jobsOverTime.length > 0 ? (
              <div className="overflow-x-auto">
                <LineChart data={jobsOverTime} height={160} />
              </div>
            ) : (
              <p className="text-sm text-foreground-500">
                {t("adminUi.dashboard.empty")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden min-w-0">
              <div className="px-5 py-4 border-b border-background-200/70">
                <h3 className="font-heading text-sm font-semibold text-foreground-950">
                  {t("adminUi.dashboard.recentJobs")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-background-200/70">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">
                        {t("adminUi.columns.title")}
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">
                        {t("adminUi.columns.company")}
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">
                        {t("adminUi.columns.location")}
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">
                        {t("adminUi.columns.postedDate")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.recentJobs.length ?? 0) === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-6 text-sm text-foreground-500"
                        >
                          {t("adminUi.dashboard.empty")}
                        </td>
                      </tr>
                    ) : (
                      dashboard?.recentJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="border-b border-background-100 hover:bg-background-50 transition-colors"
                        >
                          <td className="px-5 py-2.5 text-foreground-900 font-medium max-w-[200px] truncate">
                            {job.title || "—"}
                          </td>
                          <td className="px-5 py-2.5 text-foreground-600 whitespace-nowrap">
                            {job.companyName || "—"}
                          </td>
                          <td className="px-5 py-2.5 text-foreground-600 whitespace-nowrap">
                            {job.location || "—"}
                          </td>
                          <td className="px-5 py-2.5 text-foreground-500 whitespace-nowrap text-xs">
                            {formatDateTime(job.createdAt, i18n.language)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden min-w-0">
              <div className="px-5 py-4 border-b border-background-200/70">
                <h3 className="font-heading text-sm font-semibold text-foreground-950">
                  {t("adminUi.dashboard.newUsers")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-background-200/70">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">
                        {t("adminUi.columns.fullName")}
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">
                        {t("adminUi.columns.type")}
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">
                        {t("adminUi.columns.createdAt")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.recentUsers.length ?? 0) === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-6 text-sm text-foreground-500"
                        >
                          {t("adminUi.dashboard.empty")}
                        </td>
                      </tr>
                    ) : (
                      dashboard?.recentUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-background-100 hover:bg-background-50 transition-colors"
                        >
                          <td className="px-5 py-2.5">
                            <p className="text-foreground-900 font-medium text-sm truncate max-w-[220px]">
                              {user.name || "—"}
                            </p>
                            <p className="text-xs text-foreground-500 truncate max-w-[220px]">
                              {user.email || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-100 text-secondary-700">
                              {userTypeLabel(user.type, t)}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-foreground-500 whitespace-nowrap text-xs">
                            {formatDateTime(user.createdAt, i18n.language)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
