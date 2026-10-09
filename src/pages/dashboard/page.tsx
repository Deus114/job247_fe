import {
  AdminAuthError,
  deleteEmployerJob,
  fetchEmployerApplicationById,
  fetchEmployerApplications,
  fetchEmployerCompanies,
  fetchEmployerDashboard,
  fetchEmployerJobById,
  fetchEmployerJobs,
  joinJobRefNames,
  resolveAdminAuthErrorMessage,
  restoreEmployerJob,
} from "@/api";
import BarChart from "@/components/ui/BarChart";
import ColumnVisibilityDropdown from "@/components/ui/ColumnVisibilityDropdown";
import CustomSelect from "@/components/ui/CustomSelect";
import DonutChart from "@/components/ui/DonutChart";
import LineChart from "@/components/ui/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import {
  TableActionMenu,
  useTableActionMenu,
} from "@/components/ui/TableActionMenu";
import { env } from "@/config/env";
import {
  employmentTypeLabelKey,
  experienceLevelLabelKey,
} from "@/constants/employerJob";
import { useApplications, ViewApplicationModal } from "@/features/applications";
import { useAuth } from "@/features/auth";
import { useCompanies } from "@/features/companies";
import { useJobs } from "@/features/jobs";
import { notificationFocus } from "@/features/notifications";
import { usePageShell } from "@/layouts/usePageShell";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { formatMoneyRange } from "@/lib/formatNumber";
import { jobPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import type {
  Application,
  EmployerApplicationStatus,
} from "@/types/application";
import type { EmployerCompany } from "@/types/company";
import type { EmployerDashboard } from "@/types/employerDashboard";
import type { EmployerJob, EmployerJobStatus, Job } from "@/types/job";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

const PAGE_SIZE_DEFAULT = 20;

function mapEmployerJobToJob(
  job: EmployerJob,
  translate: (key: string) => string,
): Job {
  const status = job.status.toLowerCase() as Job["status"];
  return {
    id: String(job.id),
    title: job.title,
    company: job.companyName,
    companyId: String(job.companyId),
    companyLogo: job.companyLogo,
    location: joinJobRefNames(job.provinces) || "—",
    salary: job.salaryNegotiable
      ? translate("postJob.negotiable")
      : formatMoneyRange(job.salaryMin, job.salaryMax),
    category: joinJobRefNames(job.industries) || "—",
    educationLevel: joinJobRefNames(job.educationLevels) || "—",
    type: job.employmentTypes
      .map((value) => translate(employmentTypeLabelKey(value)))
      .join(", "),
    experience: job.experienceLevels
      .map((value) => translate(experienceLevelLabelKey(value)))
      .join(", "),
    description: job.description,
    requirements: job.requirements ? job.requirements.split("\n") : [],
    benefits: job.benefits ? job.benefits.split("\n") : [],
    deadline: job.deadline,
    createdAt: job.createdAt,
    featured: job.hot,
    status:
      status === "approved" || status === "rejected" || status === "pending"
        ? status
        : "pending",
    isActive: job.active,
    applicationCount: job.applicationCount,
  };
}

const jobStatusColor: Record<string, string> = {
  approved: "bg-accent-100 text-accent-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

function shortDay(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (!match) return date;
  return `${match[3]}/${match[2]}`;
}

const appStatusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  reviewing: "bg-accent-100 text-accent-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  SUBMITTED: "bg-yellow-100 text-yellow-700",
  VIEWED: "bg-accent-100 text-accent-700",
};

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cms, className: shell } = usePageShell();
  const location = useLocation();
  const { pathname } = location;
  const focus = notificationFocus(location.search, location.state);
  const section = pathname.endsWith("/applications")
    ? "applications"
    : pathname.endsWith("/jobs")
      ? "jobs"
      : "overview";
  const { jobs } = useJobs();
  const { companies } = useCompanies();
  const { applications: allApplications, updateApplicationStatus } =
    useApplications();
  const useEmployerAppsApi = Boolean(env.apiBaseUrl);

  const jobStatusLabel: Record<string, string> = {
    approved: t("dashboard.statuses.approved"),
    pending: t("dashboard.statuses.pending"),
    rejected: t("dashboard.statuses.rejected"),
  };

  const appStatusLabel: Record<string, string> = {
    pending: t("dashboard.appStatuses.pending"),
    reviewing: t("dashboard.appStatuses.reviewing"),
    accepted: t("dashboard.appStatuses.accepted"),
    rejected: t("dashboard.appStatuses.rejected"),
    SUBMITTED: t("dashboard.appStatuses.SUBMITTED"),
    VIEWED: t("dashboard.appStatuses.VIEWED"),
  };

  const JOB_COLUMNS = useMemo(
    () => [
      { key: "title", label: t("dashboard.jobsTable.title") },
      { key: "company", label: t("dashboard.jobsTable.company") },
      { key: "category", label: t("dashboard.jobsTable.category") },
      { key: "location", label: t("dashboard.jobsTable.location") },
      { key: "salary", label: t("dashboard.jobsTable.salary") },
      { key: "createdAt", label: t("dashboard.jobsTable.postedDate") },
      { key: "deadline", label: t("dashboard.jobsTable.deadline") },
      { key: "status", label: t("dashboard.jobsTable.status") },
      { key: "applications", label: t("dashboard.jobsTable.applications") },
      { key: "actions", label: t("dashboard.jobsTable.actions") },
    ],
    [t],
  );

  const APP_COLUMNS = useMemo(
    () => [
      { key: "fullName", label: t("dashboard.applicationsTable.candidate") },
      { key: "email", label: t("dashboard.applicationsTable.email") },
      { key: "phone", label: t("dashboard.applicationsTable.phone") },
      { key: "jobTitle", label: t("dashboard.applicationsTable.job") },
      { key: "appliedAt", label: t("dashboard.applicationsTable.appliedDate") },
      { key: "viewedAt", label: t("dashboard.applicationsTable.viewedAt") },
      { key: "cvFileName", label: t("dashboard.applicationsTable.cv") },
      { key: "status", label: t("dashboard.applicationsTable.status") },
      { key: "actions", label: t("dashboard.applicationsTable.actions") },
    ],
    [t],
  );

  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState<
    "all" | "approved" | "pending" | "rejected"
  >("all");
  const [jobCompanyFilter, setJobCompanyFilter] = useState("");
  const [jobVisibleColumns, setJobVisibleColumns] = useState<string[]>(() =>
    JOB_COLUMNS.map((c) => c.key),
  );
  const [jobPage, setJobPage] = useState(1);
  const [jobPageSize, setJobPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Applications tab state
  const [appSearch, setAppSearch] = useState("");
  const [appKeyword, setAppKeyword] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<
    | "all"
    | EmployerApplicationStatus
    | "pending"
    | "reviewing"
    | "accepted"
    | "rejected"
  >("all");
  const [appJobFilter, setAppJobFilter] = useState("");
  const [appCompanyFilter, setAppCompanyFilter] = useState("");
  const [appVisibleColumns, setAppVisibleColumns] = useState<string[]>(() =>
    APP_COLUMNS.map((c) => c.key),
  );
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(
    null,
  );
  const [employerApps, setEmployerApps] = useState<Application[]>([]);
  const [employerAppsLoading, setEmployerAppsLoading] = useState(false);
  const [employerAppsTotal, setEmployerAppsTotal] = useState(0);
  const [employerAppsTotalPages, setEmployerAppsTotalPages] = useState(1);
  const [employerAppCompanies, setEmployerAppCompanies] = useState<
    EmployerCompany[]
  >([]);
  const [employerAppJobs, setEmployerAppJobs] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [viewApp, setViewApp] = useState<Application | null>(null);
  const [viewAppLoading, setViewAppLoading] = useState(false);
  const [overviewCompanyId, setOverviewCompanyId] = useState("");
  const [overview, setOverview] = useState<EmployerDashboard | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const myCompanies = useMemo(
    () => companies.filter((c) => c.createdBy === user?.id),
    [companies, user],
  );
  const myCompanyIds = useMemo(
    () => new Set(myCompanies.map((c) => c.id)),
    [myCompanies],
  );
  const mockMyJobs = useMemo(
    () => jobs.filter((j) => myCompanyIds.has(j.companyId)),
    [jobs, myCompanyIds],
  );

  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [employerJobsLoading, setEmployerJobsLoading] = useState(false);
  const [employerJobsTotal, setEmployerJobsTotal] = useState(0);
  const [employerJobsTotalPages, setEmployerJobsTotalPages] = useState(1);
  const [jobKeyword, setJobKeyword] = useState("");
  const [jobViewMode, setJobViewMode] = useState<"active" | "trash">("active");
  const [jobTrashCount, setJobTrashCount] = useState(0);
  const [jobDetail, setJobDetail] = useState<EmployerJob | null>(null);
  const [jobDetailLoading, setJobDetailLoading] = useState(false);
  const [deleteJobTarget, setDeleteJobTarget] = useState<Job | null>(null);
  const [jobActionBusy, setJobActionBusy] = useState(false);
  const {
    openId: jobMenuId,
    pos: jobMenuPos,
    menuRef: jobMenuRef,
    toggle: toggleJobMenu,
    close: closeJobMenu,
  } = useTableActionMenu<string>();

  const useEmployerJobsApi = Boolean(env.apiBaseUrl);

  useEffect(() => {
    if (section !== "overview" || !useEmployerAppsApi) return;
    let cancelled = false;
    setOverview(null);
    setOverviewLoading(true);
    const companyId = Number(overviewCompanyId);
    void fetchEmployerDashboard(
      Number.isFinite(companyId) && companyId > 0 ? { companyId } : {},
    )
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setOverview(null);
        toast.error(
          error instanceof AdminAuthError
            ? resolveAdminAuthErrorMessage(error, t)
            : t("apiErrors.employerDashboardLoadFailed"),
        );
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, useEmployerAppsApi, overviewCompanyId, t]);

  useEffect(() => {
    if (!useEmployerJobsApi) return;
    const timer = window.setTimeout(() => {
      setJobKeyword(jobSearch.trim());
      setJobPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [jobSearch, useEmployerJobsApi]);

  const loadEmployerJobs = useCallback(async () => {
    if (!useEmployerJobsApi) return;
    setEmployerJobsLoading(true);
    try {
      const statusMap: Record<string, EmployerJobStatus | undefined> = {
        all: undefined,
        approved: "APPROVED",
        pending: "PENDING",
        rejected: "REJECTED",
      };
      const companyId = jobCompanyFilter ? Number(jobCompanyFilter) : undefined;
      const inTrash = section === "jobs" && jobViewMode === "trash";
      const res = await fetchEmployerJobs({
        keyword: jobKeyword || undefined,
        status: inTrash ? undefined : statusMap[jobStatusFilter],
        companyId:
          companyId != null && Number.isFinite(companyId) && companyId > 0
            ? companyId
            : undefined,
        deleted: inTrash,
        page: jobPage,
        size: jobPageSize,
        sort: "createdAt,DESC",
      });
      setEmployerJobs(res.data.map((job) => mapEmployerJobToJob(job, t)));
      setEmployerJobsTotal(res.pagination.total);
      setEmployerJobsTotalPages(Math.max(1, res.pagination.last_page));
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerJobLoadFailed"),
      );
      setEmployerJobs([]);
      setEmployerJobsTotal(0);
      setEmployerJobsTotalPages(1);
    } finally {
      setEmployerJobsLoading(false);
    }
  }, [
    useEmployerJobsApi,
    jobKeyword,
    jobStatusFilter,
    jobCompanyFilter,
    jobPage,
    jobPageSize,
    jobViewMode,
    section,
    t,
  ]);

  const loadJobTrashCount = useCallback(async () => {
    if (!useEmployerJobsApi) return;
    try {
      const res = await fetchEmployerJobs({
        deleted: true,
        page: 1,
        size: 1,
      });
      setJobTrashCount(res.pagination.total);
    } catch {
      setJobTrashCount(0);
    }
  }, [useEmployerJobsApi]);

  useEffect(() => {
    if (section !== "jobs") return;
    void loadEmployerJobs();
  }, [section, loadEmployerJobs]);

  useEffect(() => {
    if (section !== "jobs" || !useEmployerJobsApi) return;
    void loadJobTrashCount();
  }, [section, useEmployerJobsApi, loadJobTrashCount, employerJobsTotal]);

  const openJobDetail = async (jobId: string) => {
    closeJobMenu();
    if (!useEmployerJobsApi) {
      toast.error(t("apiErrors.missingBackendUrl"));
      return;
    }
    const id = Number(jobId);
    if (!Number.isFinite(id) || id <= 0) return;
    setJobDetailLoading(true);
    try {
      const detail = await fetchEmployerJobById(id);
      setJobDetail(detail);
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerJobLoadFailed"),
      );
    } finally {
      setJobDetailLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteJobTarget || jobActionBusy) return;
    if (!useEmployerJobsApi) {
      toast.error(t("apiErrors.missingBackendUrl"));
      return;
    }
    const id = Number(deleteJobTarget.id);
    if (!Number.isFinite(id) || id <= 0) return;
    setJobActionBusy(true);
    try {
      await deleteEmployerJob(id);
      toast.success(t("dashboard.jobDeleted"));
      setDeleteJobTarget(null);
      if (jobDetail?.id === id) setJobDetail(null);
      await loadEmployerJobs();
      await loadJobTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerJobDeleteFailed"),
      );
    } finally {
      setJobActionBusy(false);
    }
  };

  const handleRestoreJob = async (jobId: string) => {
    closeJobMenu();
    if (!useEmployerJobsApi || jobActionBusy) return;
    const id = Number(jobId);
    if (!Number.isFinite(id) || id <= 0) return;
    setJobActionBusy(true);
    try {
      const result = await restoreEmployerJob(id);
      toast.success(result.message || t("dashboard.jobRestored"));
      if (jobDetail?.id === id) setJobDetail(null);
      setEmployerJobs((prev) => prev.filter((job) => job.id !== String(id)));
      setEmployerJobsTotal((total) => Math.max(0, total - 1));
      setJobTrashCount((count) => Math.max(0, count - 1));
      await loadEmployerJobs();
      await loadJobTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerJobRestoreFailed"),
      );
    } finally {
      setJobActionBusy(false);
    }
  };

  const myJobs = useEmployerJobsApi ? employerJobs : mockMyJobs;
  const myJobIds = useMemo(() => new Set(myJobs.map((j) => j.id)), [myJobs]);

  useEffect(() => {
    if (!useEmployerAppsApi) return;
    const timer = window.setTimeout(() => {
      setAppKeyword(appSearch.trim());
      setAppPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [appSearch, useEmployerAppsApi]);

  const loadEmployerApps = useCallback(async () => {
    if (!useEmployerAppsApi) return;
    setEmployerAppsLoading(true);
    try {
      const companyId = appCompanyFilter ? Number(appCompanyFilter) : undefined;
      const jobId = appJobFilter ? Number(appJobFilter) : undefined;
      const res = await fetchEmployerApplications({
        keyword: appKeyword || undefined,
        status:
          appStatusFilter === "all"
            ? undefined
            : appStatusFilter === "SUBMITTED" || appStatusFilter === "VIEWED"
              ? appStatusFilter
              : undefined,
        companyId:
          companyId != null && Number.isFinite(companyId) && companyId > 0
            ? companyId
            : undefined,
        jobId:
          jobId != null && Number.isFinite(jobId) && jobId > 0
            ? jobId
            : undefined,
        page: appPage,
        size: appPageSize,
        sort: "createdAt,DESC",
      });
      setEmployerApps(res.data);
      setEmployerAppsTotal(res.pagination.total);
      setEmployerAppsTotalPages(Math.max(1, res.pagination.last_page));
    } catch (error) {
      setEmployerApps([]);
      setEmployerAppsTotal(0);
      setEmployerAppsTotalPages(1);
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerApplicationLoadFailed"),
      );
    } finally {
      setEmployerAppsLoading(false);
    }
  }, [
    useEmployerAppsApi,
    appKeyword,
    appStatusFilter,
    appCompanyFilter,
    appJobFilter,
    appPage,
    appPageSize,
    t,
  ]);

  useEffect(() => {
    if (!useEmployerAppsApi) return;
    if (section !== "applications") return;
    void loadEmployerApps();
  }, [useEmployerAppsApi, section, loadEmployerApps]);

  useEffect(() => {
    if (!useEmployerAppsApi) return;
    let cancelled = false;
    void Promise.all([
      fetchEmployerCompanies({
        mine: true,
        page: 1,
        size: 100,
        sort: "createdAt,DESC",
      }),
      fetchEmployerJobs({ page: 1, size: 100, sort: "createdAt,DESC" }),
    ])
      .then(([companiesRes, jobsRes]) => {
        if (cancelled) return;
        setEmployerAppCompanies(companiesRes.data);
        setEmployerAppJobs(
          jobsRes.data.map((j) => ({ id: String(j.id), title: j.title })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setEmployerAppCompanies([]);
        setEmployerAppJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [useEmployerAppsApi]);

  const myApplications = useMemo(() => {
    if (useEmployerAppsApi) return employerApps;
    return allApplications.filter((a) => myJobIds.has(a.jobId));
  }, [useEmployerAppsApi, employerApps, allApplications, myJobIds]);

  const stats = useMemo(() => {
    const activeJobs = myJobs.filter((j) => j.status === "approved").length;
    const totalApps = useEmployerAppsApi
      ? employerAppsTotal
      : myApplications.length;
    const newApps = myApplications.filter((a) => {
      const d = new Date(a.appliedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length;
    return {
      totalJobs: useEmployerJobsApi ? employerJobsTotal : myJobs.length,
      activeJobs,
      totalApps,
      newApps,
    };
  }, [
    myJobs,
    myApplications,
    useEmployerAppsApi,
    employerAppsTotal,
    useEmployerJobsApi,
    employerJobsTotal,
  ]);

  const jobCompanyOptions = useMemo(() => {
    if (useEmployerJobsApi) {
      const map = new Map<string, string>();
      employerJobs.forEach((j) => map.set(j.companyId, j.company));
      return Array.from(map.entries())
        .map(([id, name]) => ({ value: id, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    const set = new Set(mockMyJobs.map((j) => j.company));
    return Array.from(set)
      .sort()
      .map((name) => ({ value: name, label: name }));
  }, [useEmployerJobsApi, employerJobs, mockMyJobs]);

  const appCompanyOptions = useMemo(() => {
    if (useEmployerAppsApi) {
      return employerAppCompanies
        .map((c) => ({ value: String(c.id), label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    const set = new Set<string>();
    myApplications.forEach((a) => {
      const job = myJobs.find((j) => j.id === a.jobId);
      if (job) set.add(job.company);
    });
    return Array.from(set)
      .sort()
      .map((name) => ({ value: name, label: name }));
  }, [useEmployerAppsApi, employerAppCompanies, myApplications, myJobs]);

  const appJobOptions = useMemo(() => {
    if (useEmployerAppsApi) {
      return employerAppJobs.map((j) => [j.id, j.title] as [string, string]);
    }
    const set = new Map<string, string>();
    myApplications.forEach((a) => set.set(a.jobId, a.jobTitle));
    return Array.from(set.entries());
  }, [useEmployerAppsApi, employerAppJobs, myApplications]);

  const filteredJobs = useMemo(() => {
    if (useEmployerJobsApi) return employerJobs;
    let result = [...mockMyJobs];
    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q),
      );
    }
    if (jobStatusFilter !== "all") {
      result = result.filter((j) => j.status === jobStatusFilter);
    }
    if (jobCompanyFilter) {
      result = result.filter((j) => j.company === jobCompanyFilter);
    }
    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return result;
  }, [
    useEmployerJobsApi,
    employerJobs,
    mockMyJobs,
    jobSearch,
    jobStatusFilter,
    jobCompanyFilter,
  ]);

  const paginatedJobs = useMemo(() => {
    if (useEmployerJobsApi) return employerJobs;
    const start = (jobPage - 1) * jobPageSize;
    return filteredJobs.slice(start, start + jobPageSize);
  }, [useEmployerJobsApi, employerJobs, filteredJobs, jobPage, jobPageSize]);

  const totalJobPages = useEmployerJobsApi
    ? employerJobsTotalPages
    : Math.ceil(filteredJobs.length / jobPageSize) || 1;

  const totalJobItems = useEmployerJobsApi
    ? employerJobsTotal
    : filteredJobs.length;

  // --- Applications filtering (client fallback when no API) ---
  const filteredApps = useMemo(() => {
    if (useEmployerAppsApi) return employerApps;
    let result = [...myApplications];
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.jobTitle.toLowerCase().includes(q),
      );
    }
    if (appStatusFilter !== "all") {
      result = result.filter((a) => a.status === appStatusFilter);
    }
    if (appJobFilter) {
      result = result.filter((a) => a.jobId === appJobFilter);
    }
    if (appCompanyFilter) {
      result = result.filter((a) => {
        const job = myJobs.find((j) => j.id === a.jobId);
        return job?.company === appCompanyFilter;
      });
    }
    result.sort(
      (a, b) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
    );
    return result;
  }, [
    useEmployerAppsApi,
    employerApps,
    myApplications,
    myJobs,
    appSearch,
    appStatusFilter,
    appJobFilter,
    appCompanyFilter,
  ]);

  const paginatedApps = useMemo(() => {
    if (useEmployerAppsApi) return employerApps;
    const start = (appPage - 1) * appPageSize;
    return filteredApps.slice(start, start + appPageSize);
  }, [useEmployerAppsApi, employerApps, filteredApps, appPage, appPageSize]);

  const totalAppPages = useEmployerAppsApi
    ? employerAppsTotalPages
    : Math.ceil(filteredApps.length / appPageSize) || 1;

  const totalAppItems = useEmployerAppsApi
    ? employerAppsTotal
    : filteredApps.length;

  useEffect(() => {
    if (section !== "jobs" || !focus) return;
    let cancelled = false;
    setJobDetailLoading(true);
    void fetchEmployerJobById(focus.id)
      .then((detail) => {
        if (!cancelled) setJobDetail(detail);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(
          error instanceof AdminAuthError
            ? resolveAdminAuthErrorMessage(error, t)
            : t("apiErrors.employerJobLoadFailed"),
        );
      })
      .finally(() => {
        if (!cancelled) setJobDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, focus?.key, t]);

  useEffect(() => {
    if (section !== "applications" || !focus) return;
    let cancelled = false;
    setViewAppLoading(true);
    void fetchEmployerApplicationById(focus.id)
      .then((detail) => {
        if (!cancelled) setViewApp(detail);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(
          error instanceof AdminAuthError
            ? resolveAdminAuthErrorMessage(error, t)
            : t("apiErrors.employerApplicationLoadFailed"),
        );
      })
      .finally(() => {
        if (!cancelled) setViewAppLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, focus?.key, t]);

  const appStatusFilterOptions = useMemo(
    () =>
      useEmployerAppsApi
        ? [
            { value: "all", label: t("common.all") },
            {
              value: "SUBMITTED",
              label: appStatusLabel.SUBMITTED,
            },
            { value: "VIEWED", label: appStatusLabel.VIEWED },
          ]
        : [
            { value: "all", label: t("common.all") },
            { value: "pending", label: appStatusLabel.pending },
            { value: "reviewing", label: appStatusLabel.reviewing },
            { value: "accepted", label: appStatusLabel.accepted },
            { value: "rejected", label: appStatusLabel.rejected },
          ],
    [useEmployerAppsApi, t, appStatusLabel],
  );

  if (user?.role !== "employer") {
    return <Navigate to="/" replace />;
  }

  const handleStatusChange = (
    appId: string,
    newStatus: Application["status"],
  ) => {
    if (useEmployerAppsApi) return;
    updateApplicationStatus(appId, newStatus);
    setStatusDropdownOpen(null);
  };

  const handleAppFilterChange = (filter: typeof appStatusFilter) => {
    setAppStatusFilter(filter);
    setAppPage(1);
  };

  const handleViewApplication = async (app: Application) => {
    if (!useEmployerAppsApi) {
      setViewApp(app);
      return;
    }
    setViewAppLoading(true);
    try {
      const detail = await fetchEmployerApplicationById(app.id);
      setViewApp(detail);
      setEmployerApps((prev) =>
        prev.map((item) => (item.id === detail.id ? detail : item)),
      );
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerApplicationLoadFailed"),
      );
      setViewApp(app);
    } finally {
      setViewAppLoading(false);
    }
  };

  const handleJobFilterChange = (filter: typeof jobStatusFilter) => {
    setJobStatusFilter(filter);
    setJobPage(1);
  };

  const handleJobCompanyChange = (company: string) => {
    setJobCompanyFilter(company);
    setJobPage(1);
  };

  const handleAppCompanyChange = (company: string) => {
    setAppCompanyFilter(company);
    setAppPage(1);
  };

  const handleJobSearch = (val: string) => {
    setJobSearch(val);
    setJobPage(1);
  };

  const handleAppSearch = (val: string) => {
    setAppSearch(val);
    if (!useEmployerAppsApi) setAppPage(1);
  };

  const summary = overview?.summary;
  const totalJobs = useEmployerAppsApi
    ? (summary?.jobCount ?? 0)
    : stats.totalJobs;
  const openJobs = useEmployerAppsApi
    ? (summary?.openJobCount ?? 0)
    : stats.activeJobs;
  const totalApps = useEmployerAppsApi
    ? (summary?.applicationCount ?? 0)
    : stats.totalApps;
  const newApps = useEmployerAppsApi
    ? (summary?.newApplicationCount ?? 0)
    : stats.newApps;
  const jobsByApplications =
    overview?.applicationsByJob.map((job) => ({
      label: job.title || String(job.jobId),
      value: job.count,
    })) ?? [];
  const applicationDays = overview?.applicationsByDay ?? [];
  const dayStep =
    applicationDays.length > 10 ? Math.ceil(applicationDays.length / 7) : 1;
  const applicationTrend = applicationDays.map((item, index) => ({
    label:
      index % dayStep === 0 || index === applicationDays.length - 1
        ? shortDay(item.date)
        : "",
    value: item.count,
  }));
  const submittedCount = overview?.applicationsByStatus.submitted ?? 0;
  const viewedCount = overview?.applicationsByStatus.viewed ?? 0;
  const companyOptions = [
    { value: "", label: t("employerCms.allCompanies") },
    ...employerAppCompanies.map((company) => ({
      value: String(company.id),
      label: company.name,
    })),
  ];

  return (
    <div className={shell}>
      <div className={cms ? "w-full" : "w-full max-w-[1440px] mx-auto"}>
        <div className="mb-6">
          <h1 className="text-xl font-heading font-bold text-foreground-950">
            {section === "jobs"
              ? t("dashboard.myJobs")
              : section === "applications"
                ? t("dashboard.applications")
                : t("employerCms.overviewTitle")}
          </h1>
          <p className="text-sm text-foreground-600 mt-1">
            {section === "overview"
              ? t("employerCms.overviewSubtitle", { name: user?.fullName })
              : t("dashboard.subtitle")}
          </p>
          {section === "overview" && useEmployerAppsApi && (
            <div className="mt-3 w-full sm:max-w-xs">
              <CustomSelect
                value={overviewCompanyId}
                options={companyOptions}
                onChange={setOverviewCompanyId}
              />
            </div>
          )}
        </div>

        {section === "overview" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <Link
                to="/employer/jobs"
                className="bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <i className="ri-briefcase-line text-lg text-primary-500"></i>
                  </div>
                  <p className="text-xs text-foreground-500">
                    {t("dashboard.stats.totalJobs")}
                  </p>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground-950">
                  {totalJobs}
                </p>
              </Link>
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                    <i className="ri-check-double-line text-lg text-accent-500"></i>
                  </div>
                  <p className="text-xs text-foreground-500">
                    {t("dashboard.stats.activeJobs")}
                  </p>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground-950">
                  {openJobs}
                </p>
              </div>
              <Link
                to="/employer/applications"
                className="bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                    <i className="ri-file-user-line text-lg text-secondary-500"></i>
                  </div>
                  <p className="text-xs text-foreground-500">
                    {t("dashboard.stats.totalApplications")}
                  </p>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground-950">
                  {totalApps}
                </p>
              </Link>
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <i className="ri-notification-3-line text-lg text-primary-500"></i>
                  </div>
                  <p className="text-xs text-foreground-500">
                    {t("dashboard.stats.newApps")}
                  </p>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground-950">
                  {newApps}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <Link
                to="/employer/jobs/new"
                className="flex items-center gap-3 p-4 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-2xl min-h-[44px]"
              >
                <i className="ri-add-circle-line text-xl"></i>
                <span className="text-sm font-semibold">
                  {t("dashboard.postNew")}
                </span>
              </Link>
              <Link
                to="/employer/companies"
                className="flex items-center gap-3 p-4 bg-background-50 border border-background-200/70 rounded-2xl min-h-[44px]"
              >
                <i className="ri-building-line text-xl text-primary-500"></i>
                <span className="text-sm font-semibold text-foreground-900">
                  {t("employerNav.companies")}
                </span>
              </Link>
              <Link
                to="/employer/applications"
                className="flex items-center gap-3 p-4 bg-background-50 border border-background-200/70 rounded-2xl min-h-[44px]"
              >
                <i className="ri-file-user-line text-xl text-primary-500"></i>
                <span className="text-sm font-semibold text-foreground-900">
                  {t("employerNav.applications")}
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5 min-w-0">
                <h2 className="text-sm font-semibold text-foreground-950">
                  {t("employerCms.charts.applicationsByJob")}
                </h2>
                <p className="text-xs text-foreground-500 mt-1 mb-4">
                  {t("employerCms.charts.applicationsByJobHint")}
                </p>
                {overviewLoading ? (
                  <p className="text-sm text-foreground-500">
                    {t("common.loading")}
                  </p>
                ) : jobsByApplications.length > 0 ? (
                  <BarChart data={jobsByApplications} height={180} />
                ) : (
                  <p className="text-sm text-foreground-500">
                    {t("employerCms.charts.empty")}
                  </p>
                )}
              </div>
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5 min-w-0 overflow-x-auto">
                <h2 className="text-sm font-semibold text-foreground-950">
                  {t("employerCms.charts.applicationStatus")}
                </h2>
                <p className="text-xs text-foreground-500 mt-1 mb-4">
                  {t("employerCms.charts.applicationStatusHint")}
                </p>
                {overviewLoading ? (
                  <p className="text-sm text-foreground-500">
                    {t("common.loading")}
                  </p>
                ) : submittedCount + viewedCount > 0 ? (
                  <DonutChart
                    data={[
                      {
                        label: appStatusLabel.SUBMITTED,
                        value: submittedCount,
                        color: "oklch(var(--secondary-500))",
                      },
                      {
                        label: appStatusLabel.VIEWED,
                        value: viewedCount,
                        color: "oklch(var(--accent-500))",
                      },
                    ]}
                    size={148}
                  />
                ) : (
                  <p className="text-sm text-foreground-500">
                    {t("employerCms.charts.empty")}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5 mb-6 min-w-0">
              <h2 className="text-sm font-semibold text-foreground-950">
                {t("employerCms.charts.applicationsTrend")}
              </h2>
              <p className="text-xs text-foreground-500 mt-1 mb-4">
                {t("employerCms.charts.applicationsTrendHint")}
              </p>
              {overviewLoading ? (
                <p className="text-sm text-foreground-500">
                  {t("common.loading")}
                </p>
              ) : applicationTrend.some((point) => point.value > 0) ? (
                <LineChart data={applicationTrend} height={160} />
              ) : (
                <p className="text-sm text-foreground-500">
                  {t("employerCms.charts.empty")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground-950">
                    {t("dashboard.myJobs")}
                  </h2>
                  <Link
                    to="/employer/jobs"
                    className="text-xs font-medium text-primary-500"
                  >
                    {t("employerCms.viewAll")}
                  </Link>
                </div>
                {useEmployerAppsApi ? (
                  overviewLoading && !overview ? (
                    <p className="text-sm text-foreground-500">
                      {t("common.loading")}
                    </p>
                  ) : (overview?.recentJobs.length ?? 0) === 0 ? (
                    <p className="text-sm text-foreground-500">
                      {t("dashboard.noJobs")}
                    </p>
                  ) : (
                    <ul className="divide-y divide-background-100">
                      {overview?.recentJobs.map((job) => {
                        const status = job.status.trim();
                        const statusKey = jobStatusColor[status]
                          ? status
                          : status.toLowerCase();
                        return (
                          <li
                            key={job.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground-900 truncate">
                                {job.title || "—"}
                              </p>
                              <p className="text-xs text-foreground-500 truncate">
                                {job.companyName || "—"}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${jobStatusColor[statusKey] || ""}`}
                            >
                              {jobStatusLabel[statusKey] || status || "—"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )
                ) : myJobs.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-foreground-500">
                    {t("dashboard.noJobs")}
                  </p>
                ) : (
                  <ul className="divide-y divide-background-100">
                    {myJobs.slice(0, 5).map((job) => (
                      <li
                        key={job.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground-900 truncate">
                            {job.title}
                          </p>
                          <p className="text-xs text-foreground-500 truncate">
                            {job.company}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${jobStatusColor[job.status] || ""}`}
                        >
                          {jobStatusLabel[job.status] || job.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground-950">
                    {t("dashboard.applications")}
                  </h2>
                  <Link
                    to="/employer/applications"
                    className="text-xs font-medium text-primary-500"
                  >
                    {t("employerCms.viewAll")}
                  </Link>
                </div>
                {useEmployerAppsApi ? (
                  overviewLoading && !overview ? (
                    <p className="text-sm text-foreground-500">
                      {t("common.loading")}
                    </p>
                  ) : (overview?.recentApplications.length ?? 0) === 0 ? (
                    <p className="text-sm text-foreground-500">
                      {t("dashboard.noApplications")}
                    </p>
                  ) : (
                    <ul className="divide-y divide-background-100">
                      {overview?.recentApplications.map((app) => {
                        const status = app.status.trim();
                        return (
                          <li
                            key={app.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground-900 truncate">
                                {app.applicantName || "—"}
                              </p>
                              <p className="text-xs text-foreground-500 truncate">
                                {app.jobTitle || "—"}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${appStatusColor[status] || appStatusColor[status.toLowerCase()] || ""}`}
                            >
                              {appStatusLabel[status] ||
                                appStatusLabel[status.toLowerCase()] ||
                                status ||
                                "—"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )
                ) : myApplications.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-foreground-500">
                    {t("dashboard.noApplications")}
                  </p>
                ) : (
                  <ul className="divide-y divide-background-100">
                    {myApplications.slice(0, 5).map((app) => (
                      <li
                        key={app.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground-900 truncate">
                            {app.fullName}
                          </p>
                          <p className="text-xs text-foreground-500 truncate">
                            {app.jobTitle}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${appStatusColor[app.status] || ""}`}
                        >
                          {appStatusLabel[app.status] || app.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========== JOBS TAB ========== */}
        {section === "jobs" && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {useEmployerJobsApi && (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-background-100 border border-background-200/70">
                    <button
                      type="button"
                      onClick={() => {
                        setJobViewMode("active");
                        setJobPage(1);
                      }}
                      className={`h-9 px-3 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                        jobViewMode === "active"
                          ? "bg-background-50 text-foreground-900 shadow-sm"
                          : "text-foreground-600 hover:text-foreground-900"
                      }`}
                    >
                      {t("dashboard.activeList")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setJobViewMode("trash");
                        setJobPage(1);
                      }}
                      className={`h-9 px-3 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                        jobViewMode === "trash"
                          ? "bg-background-50 text-foreground-900 shadow-sm"
                          : "text-foreground-600 hover:text-foreground-900"
                      }`}
                    >
                      <i className="ri-delete-bin-line"></i>
                      {t("adminUi.actions.trash")}
                      {jobTrashCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-100 text-red-600 text-[10px] font-semibold inline-flex items-center justify-center">
                          {jobTrashCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => handleJobSearch(e.target.value)}
                    placeholder={t("dashboard.searchPlaceholder")}
                    className="pl-9 pr-4 py-2 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors w-[200px]"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <CustomSelect
                    value={jobCompanyFilter}
                    options={[
                      { value: "", label: t("dashboard.allCompanies") },
                      ...jobCompanyOptions,
                    ]}
                    onChange={handleJobCompanyChange}
                    icon="ri-building-line"
                    className="w-[200px]"
                    outlined
                  />
                  {jobViewMode === "active" &&
                    (["all", "approved", "pending", "rejected"] as const).map(
                      (f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleJobFilterChange(f)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                            jobStatusFilter === f
                              ? "bg-primary-500 border-primary-500 text-background-50 dark:text-foreground-950"
                              : "bg-background-50 border-background-200 text-foreground-600 hover:bg-background-100"
                          }`}
                        >
                          {f === "all" ? t("common.all") : jobStatusLabel[f]}
                        </button>
                      ),
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {jobViewMode === "active" && (
                  <Link
                    to="/employer/jobs/new"
                    className="flex items-center gap-1.5 h-10 px-4 bg-primary-500 border border-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-xs font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line"></i> {t("dashboard.postNew")}
                  </Link>
                )}
                <ColumnVisibilityDropdown
                  columns={JOB_COLUMNS}
                  visibleKeys={jobVisibleColumns}
                  onChange={setJobVisibleColumns}
                />
              </div>
            </div>

            {jobViewMode === "trash" && (
              <p className="text-xs text-foreground-500 mb-3">
                {t("dashboard.jobTrashInfo")}
              </p>
            )}

            {/* Table */}
            {employerJobsLoading ? (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-12 text-center text-foreground-500">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                {t("common.loading")}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
                  <i className="ri-briefcase-line text-2xl text-foreground-400"></i>
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
                  {jobViewMode === "trash"
                    ? t("dashboard.jobTrashEmpty")
                    : myJobs.length === 0
                      ? t("dashboard.noJobs")
                      : t("dashboard.noJobsFound")}
                </h3>
                <p className="text-sm text-foreground-500 mb-6">
                  {jobViewMode === "trash"
                    ? t("dashboard.jobTrashInfo")
                    : myJobs.length === 0
                      ? t("dashboard.createFirstDesc")
                      : t("dashboard.tryChangeFilter")}
                </p>
                {jobViewMode === "active" && myJobs.length === 0 && (
                  <Link
                    to="/employer/jobs/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line"></i> {t("dashboard.postNow")}
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-background-200/70 bg-background-100/50">
                        {jobVisibleColumns.includes("title") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                            {t("dashboard.jobsTable.title")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("company") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                            {t("dashboard.jobsTable.company")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("category") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">
                            {t("dashboard.jobsTable.category")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("location") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">
                            {t("dashboard.jobsTable.location")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("salary") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">
                            {t("dashboard.jobsTable.salary")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("createdAt") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">
                            {t("dashboard.jobsTable.postedDate")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("deadline") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">
                            {t("dashboard.jobsTable.deadline")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("status") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                            {t("dashboard.jobsTable.status")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("applications") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                            {t("dashboard.jobsTable.applications")}
                          </th>
                        )}
                        {jobVisibleColumns.includes("actions") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider text-right">
                            {t("dashboard.jobsTable.actions")}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-background-200/70">
                      {paginatedJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-background-100/50 transition-colors"
                        >
                          {jobVisibleColumns.includes("title") && (
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => void openJobDetail(job.id)}
                                className="text-sm font-semibold text-foreground-900 hover:text-primary-500 transition-colors cursor-pointer line-clamp-1 text-left"
                              >
                                {job.title}
                              </button>
                              <p className="text-xs text-foreground-500 mt-0.5 md:hidden">
                                {job.category} · {job.location}
                              </p>
                            </td>
                          )}
                          {jobVisibleColumns.includes("company") && (
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  <img
                                    src={job.companyLogo}
                                    alt={job.company}
                                    className="w-6 h-6 object-contain"
                                  />
                                </div>
                                <span className="text-sm text-foreground-700">
                                  {job.company}
                                </span>
                              </div>
                            </td>
                          )}
                          {jobVisibleColumns.includes("category") && (
                            <td className="px-5 py-4 hidden md:table-cell">
                              <span className="text-sm text-foreground-600">
                                {job.category}
                              </span>
                            </td>
                          )}
                          {jobVisibleColumns.includes("location") && (
                            <td className="px-5 py-4 hidden lg:table-cell">
                              <span className="text-sm text-foreground-600">
                                {job.location}
                              </span>
                            </td>
                          )}
                          {jobVisibleColumns.includes("salary") && (
                            <td className="px-5 py-4 hidden lg:table-cell">
                              <span className="text-sm font-medium text-foreground-700">
                                {job.salary}
                              </span>
                            </td>
                          )}
                          {jobVisibleColumns.includes("createdAt") && (
                            <td className="px-5 py-4 hidden md:table-cell">
                              <span className="text-sm text-foreground-600">
                                {formatDate(job.createdAt, i18n.language)}
                              </span>
                            </td>
                          )}
                          {jobVisibleColumns.includes("deadline") && (
                            <td className="px-5 py-4 hidden lg:table-cell">
                              <span
                                className={`text-sm ${new Date(job.deadline) < new Date() ? "text-red-500 font-medium" : "text-foreground-600"}`}
                              >
                                {formatDate(job.deadline, i18n.language)}
                              </span>
                            </td>
                          )}
                          {jobVisibleColumns.includes("status") && (
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${jobStatusColor[job.status]}`}
                              >
                                {job.status === "approved" && (
                                  <i className="ri-check-line text-[10px]"></i>
                                )}
                                {job.status === "pending" && (
                                  <i className="ri-time-line text-[10px]"></i>
                                )}
                                {job.status === "rejected" && (
                                  <i className="ri-close-line text-[10px]"></i>
                                )}
                                {jobStatusLabel[job.status]}
                              </span>
                            </td>
                          )}
                          {jobVisibleColumns.includes("applications") && (
                            <td className="px-5 py-4 text-sm text-foreground-600 whitespace-nowrap">
                              {t("dashboard.jobsTable.cvCount", {
                                count: job.applicationCount ?? 0,
                              })}
                            </td>
                          )}
                          {jobVisibleColumns.includes("actions") && (
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={(event) =>
                                  toggleJobMenu(job.id, event)
                                }
                                className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 cursor-pointer"
                                aria-label={t("dashboard.jobsTable.actions")}
                              >
                                <i className="ri-more-2-fill text-lg"></i>
                              </button>
                              {jobMenuId === job.id && jobMenuPos && (
                                <TableActionMenu
                                  open
                                  menuRef={jobMenuRef}
                                  pos={jobMenuPos}
                                >
                                  <button
                                    type="button"
                                    onClick={() => void openJobDetail(job.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground-700 hover:bg-background-100 cursor-pointer text-left min-h-[44px]"
                                  >
                                    <i className="ri-eye-line"></i>
                                    {t("dashboard.viewJob")}
                                  </button>
                                  {jobViewMode === "active" ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          closeJobMenu();
                                          navigate(
                                            `/employer/jobs/${job.id}/edit`,
                                          );
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground-700 hover:bg-background-100 cursor-pointer text-left min-h-[44px]"
                                      >
                                        <i className="ri-pencil-line"></i>
                                        {t("dashboard.editJob")}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          closeJobMenu();
                                          setDeleteJobTarget(job);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer text-left min-h-[44px]"
                                      >
                                        <i className="ri-delete-bin-line"></i>
                                        {t("common.delete")}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={jobActionBusy}
                                      onClick={() =>
                                        void handleRestoreJob(job.id)
                                      }
                                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-accent-700 hover:bg-accent-50 cursor-pointer text-left min-h-[44px] disabled:opacity-60"
                                    >
                                      <i className="ri-refresh-line"></i>
                                      {t("adminUi.actions.restore")}
                                    </button>
                                  )}
                                </TableActionMenu>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={jobPage}
                  totalPages={totalJobPages}
                  pageSize={jobPageSize}
                  totalItems={totalJobItems}
                  onPageChange={setJobPage}
                  onPageSizeChange={(size) => {
                    setJobPageSize(size);
                    setJobPage(1);
                  }}
                />
              </div>
            )}

            {jobDetailLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-background-50 rounded-xl px-5 py-4 text-sm text-foreground-600 shadow-lg">
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  {t("common.loading")}
                </div>
              </div>
            )}

            {jobDetail && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setJobDetail(null)}
                ></div>
                <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="min-w-0">
                      <h3 className="text-lg font-heading font-semibold text-foreground-950">
                        {jobDetail.title}
                      </h3>
                      <p className="text-sm text-foreground-500 mt-1">
                        {jobDetail.companyName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setJobDetail(null)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
                    >
                      <i className="ri-close-line text-lg"></i>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        jobStatusColor[jobDetail.status.toLowerCase()] || ""
                      }`}
                    >
                      {jobStatusLabel[jobDetail.status.toLowerCase()] ||
                        jobDetail.status}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-background-100 text-foreground-600">
                      {t("dashboard.jobsTable.cvCount", {
                        count: jobDetail.applicationCount,
                      })}
                    </span>
                  </div>

                  {jobDetail.status === "REJECTED" && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-xs text-red-500 mb-1">
                        {t("adminUi.rejectionReason")}
                      </p>
                      <p className="text-sm text-red-700 whitespace-pre-wrap">
                        {jobDetail.rejectionReason.trim() ||
                          t("adminUi.rejectionReasonEmpty")}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-5">
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("dashboard.jobsTable.category")}
                      </p>
                      <p>{joinJobRefNames(jobDetail.industries) || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("dashboard.jobsTable.location")}
                      </p>
                      <p>{joinJobRefNames(jobDetail.provinces) || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("postJob.education")}
                      </p>
                      <p>{joinJobRefNames(jobDetail.educationLevels) || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("postJob.workType")}
                      </p>
                      <p>
                        {jobDetail.employmentTypes
                          .map((value) => t(employmentTypeLabelKey(value)))
                          .join(", ") || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("postJob.experience")}
                      </p>
                      <p>
                        {jobDetail.experienceLevels
                          .map((value) => t(experienceLevelLabelKey(value)))
                          .join(", ") || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("postJob.experienceYears")}
                      </p>
                      <p>
                        {jobDetail.experienceYears != null
                          ? t("postJob.experienceYearsValue", {
                              count: jobDetail.experienceYears,
                            })
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("dashboard.jobsTable.salary")}
                      </p>
                      <p>
                        {jobDetail.salaryNegotiable
                          ? t("postJob.negotiable")
                          : formatMoneyRange(
                              jobDetail.salaryMin,
                              jobDetail.salaryMax,
                            )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("dashboard.jobsTable.deadline")}
                      </p>
                      <p>{formatDate(jobDetail.deadline, i18n.language)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-500 mb-1">
                        {t("dashboard.jobsTable.postedDate")}
                      </p>
                      <p>
                        {formatDateTime(jobDetail.createdAt, i18n.language)}
                      </p>
                    </div>
                  </div>

                  {(
                    [
                      [
                        "description",
                        jobDetail.description,
                        t("postJob.description"),
                      ],
                      [
                        "requirements",
                        jobDetail.requirements,
                        t("postJob.requirements"),
                      ],
                      ["benefits", jobDetail.benefits, t("postJob.benefits")],
                      [
                        "workLocation",
                        jobDetail.workLocation,
                        t("postJob.workLocation"),
                      ],
                      [
                        "workingTime",
                        jobDetail.workingTime,
                        t("postJob.workingTime"),
                      ],
                      [
                        "applicantQuestion",
                        jobDetail.applicantQuestion,
                        t("postJob.applicantQuestion"),
                      ],
                    ] as const
                  ).map(([key, html, label]) => {
                    const hasText =
                      html
                        .replace(/<[^>]*>/g, " ")
                        .replace(/&nbsp;/gi, " ")
                        .trim().length > 0;
                    if (!hasText) return null;
                    return (
                      <div key={key} className="mb-4">
                        <p className="text-xs text-foreground-500 mb-1">
                          {label}
                        </p>
                        <div
                          className="text-sm text-foreground-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      </div>
                    );
                  })}

                  {jobViewMode === "active" && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setJobDetail(null);
                          navigate(`/employer/jobs/${jobDetail.id}/edit`);
                        }}
                        className="flex-1 h-11 rounded-xl border border-background-300 text-foreground-700 text-sm font-medium hover:bg-background-100 cursor-pointer"
                      >
                        <i className="ri-pencil-line mr-1.5"></i>
                        {t("dashboard.editJob")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteJobTarget({
                            id: String(jobDetail.id),
                            title: jobDetail.title,
                            company: jobDetail.companyName,
                            companyId: String(jobDetail.companyId),
                            companyLogo: jobDetail.companyLogo,
                            location:
                              joinJobRefNames(jobDetail.provinces) || "—",
                            salary: jobDetail.salaryNegotiable
                              ? t("postJob.negotiable")
                              : formatMoneyRange(
                                  jobDetail.salaryMin,
                                  jobDetail.salaryMax,
                                ),
                            category:
                              joinJobRefNames(jobDetail.industries) || "—",
                            educationLevel:
                              joinJobRefNames(jobDetail.educationLevels) || "—",
                            type: "",
                            experience: "",
                            description: "",
                            requirements: [],
                            benefits: [],
                            deadline: jobDetail.deadline,
                            createdAt: jobDetail.createdAt,
                            featured: jobDetail.hot,
                            status:
                              jobDetail.status.toLowerCase() as Job["status"],
                            applicationCount: jobDetail.applicationCount,
                          });
                          setJobDetail(null);
                        }}
                        className="flex-1 h-11 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 cursor-pointer"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  )}
                  {jobViewMode === "trash" && (
                    <button
                      type="button"
                      disabled={jobActionBusy}
                      onClick={() =>
                        void handleRestoreJob(String(jobDetail.id))
                      }
                      className="w-full h-11 rounded-xl bg-primary-500 text-white text-sm font-medium cursor-pointer disabled:opacity-60"
                    >
                      {t("adminUi.actions.restore")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {deleteJobTarget && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => !jobActionBusy && setDeleteJobTarget(null)}
                ></div>
                <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-lg">
                  <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
                    {t("adminUi.confirm.deleteTitle")}
                  </h3>
                  <p className="text-sm text-foreground-600 mb-6">
                    {t("adminUi.confirm.deleteMessage", {
                      item: deleteJobTarget.title,
                    })}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      disabled={jobActionBusy}
                      onClick={() => void handleDeleteJob()}
                      className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-medium cursor-pointer disabled:opacity-60"
                    >
                      {t("common.delete")}
                    </button>
                    <button
                      type="button"
                      disabled={jobActionBusy}
                      onClick={() => setDeleteJobTarget(null)}
                      className="flex-1 h-11 rounded-xl border border-background-300 text-sm cursor-pointer disabled:opacity-60"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========== APPLICATIONS TAB ========== */}
        {section === "applications" && (
          <>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => handleAppSearch(e.target.value)}
                    placeholder={t("dashboard.searchCandidate")}
                    className="w-full pl-9 pr-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors min-h-[44px]"
                  />
                </div>
                <CustomSelect
                  value={appJobFilter}
                  options={[
                    { value: "", label: t("dashboard.allPositions") },
                    ...appJobOptions.map(([id, title]) => ({
                      value: id,
                      label: title,
                    })),
                  ]}
                  onChange={(val) => {
                    setAppJobFilter(val);
                    setAppPage(1);
                  }}
                  icon="ri-briefcase-line"
                  className="w-full lg:w-[220px] shrink-0"
                  outlined
                />
                <CustomSelect
                  value={appCompanyFilter}
                  options={[
                    { value: "", label: t("dashboard.allCompanies") },
                    ...appCompanyOptions,
                  ]}
                  onChange={handleAppCompanyChange}
                  icon="ri-building-line"
                  className="w-full lg:w-[200px] shrink-0"
                  outlined
                />
                <CustomSelect
                  value={appStatusFilter}
                  options={appStatusFilterOptions}
                  onChange={(val) =>
                    handleAppFilterChange(val as typeof appStatusFilter)
                  }
                  icon="ri-flag-line"
                  className="w-full lg:w-[180px] shrink-0"
                  outlined
                />
                <ColumnVisibilityDropdown
                  columns={APP_COLUMNS}
                  visibleKeys={appVisibleColumns}
                  onChange={setAppVisibleColumns}
                />
              </div>
            </div>

            {/* Table */}
            {employerAppsLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : totalAppItems === 0 ? (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
                  <i className="ri-file-user-line text-2xl text-foreground-400"></i>
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
                  {appKeyword ||
                  appStatusFilter !== "all" ||
                  appJobFilter ||
                  appCompanyFilter
                    ? t("dashboard.noAppsFound")
                    : t("dashboard.noApplications")}
                </h3>
                <p className="text-sm text-foreground-500">
                  {appKeyword ||
                  appStatusFilter !== "all" ||
                  appJobFilter ||
                  appCompanyFilter
                    ? t("dashboard.tryChangeFilter")
                    : t("dashboard.appsEmptyDesc")}
                </p>
              </div>
            ) : (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-background-200/70 bg-background-100/50">
                        {appVisibleColumns.includes("fullName") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                            {t("dashboard.applicationsTable.candidate")}
                          </th>
                        )}
                        {appVisibleColumns.includes("email") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">
                            {t("dashboard.applicationsTable.email")}
                          </th>
                        )}
                        {appVisibleColumns.includes("phone") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">
                            {t("dashboard.applicationsTable.phone")}
                          </th>
                        )}
                        {appVisibleColumns.includes("jobTitle") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                            {t("dashboard.applicationsTable.job")}
                          </th>
                        )}
                        {appVisibleColumns.includes("appliedAt") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">
                            {t("dashboard.applicationsTable.appliedDate")}
                          </th>
                        )}
                        {appVisibleColumns.includes("viewedAt") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">
                            {t("dashboard.applicationsTable.viewedAt")}
                          </th>
                        )}
                        {appVisibleColumns.includes("cvFileName") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">
                            {t("dashboard.applicationsTable.cv")}
                          </th>
                        )}
                        {appVisibleColumns.includes("status") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                            {t("dashboard.applicationsTable.status")}
                          </th>
                        )}
                        {appVisibleColumns.includes("actions") && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider text-right">
                            {t("dashboard.applicationsTable.actions")}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-background-200/70">
                      {paginatedApps.map((app) => (
                        <tr
                          key={app.id}
                          className="hover:bg-background-100/50 transition-colors"
                        >
                          {appVisibleColumns.includes("fullName") && (
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-primary-600">
                                    {app.fullName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground-900">
                                    {app.fullName}
                                  </p>
                                  {app.coverLetter && (
                                    <p
                                      className="text-xs text-foreground-500 line-clamp-1 mt-0.5 max-w-[220px]"
                                      title={app.coverLetter}
                                    >
                                      {app.coverLetter}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}
                          {appVisibleColumns.includes("email") && (
                            <td className="px-5 py-4 hidden md:table-cell">
                              <span className="text-sm text-foreground-600">
                                {app.email}
                              </span>
                            </td>
                          )}
                          {appVisibleColumns.includes("phone") && (
                            <td className="px-5 py-4 hidden lg:table-cell">
                              <span className="text-sm text-foreground-600">
                                {app.phone || "—"}
                              </span>
                            </td>
                          )}
                          {appVisibleColumns.includes("jobTitle") && (
                            <td className="px-5 py-4">
                              <span className="text-sm text-foreground-700 line-clamp-1 max-w-[160px]">
                                {app.jobTitle}
                              </span>
                            </td>
                          )}
                          {appVisibleColumns.includes("appliedAt") && (
                            <td className="px-5 py-4 hidden md:table-cell">
                              <span className="text-sm text-foreground-600">
                                {formatDate(app.appliedAt, i18n.language)}
                              </span>
                            </td>
                          )}
                          {appVisibleColumns.includes("viewedAt") && (
                            <td className="px-5 py-4 hidden lg:table-cell">
                              <span className="text-sm text-foreground-600">
                                {app.viewedAt
                                  ? formatDateTime(app.viewedAt, i18n.language)
                                  : "—"}
                              </span>
                            </td>
                          )}
                          {appVisibleColumns.includes("cvFileName") && (
                            <td className="px-5 py-4 hidden lg:table-cell">
                              {app.cvUrl || app.cvFileName ? (
                                app.cvUrl ? (
                                  <a
                                    href={app.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary-500 font-medium hover:underline"
                                  >
                                    <i className="ri-file-text-line"></i>{" "}
                                    {app.cvFileName ||
                                      t("applications.viewModal.cv")}
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-primary-500 font-medium">
                                    <i className="ri-file-text-line"></i>{" "}
                                    {app.cvFileName}
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-foreground-400">
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {appVisibleColumns.includes("status") && (
                            <td className="px-5 py-4">
                              {useEmployerAppsApi ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${appStatusColor[app.status] || "bg-background-100 text-foreground-600"}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      app.status === "SUBMITTED"
                                        ? "bg-yellow-500"
                                        : app.status === "VIEWED"
                                          ? "bg-accent-500"
                                          : "bg-foreground-400"
                                    }`}
                                  ></span>
                                  {appStatusLabel[app.status] || app.status}
                                </span>
                              ) : (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setStatusDropdownOpen(
                                        statusDropdownOpen === app.id
                                          ? null
                                          : app.id,
                                      )
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${appStatusColor[app.status]}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        app.status === "pending"
                                          ? "bg-yellow-500"
                                          : app.status === "reviewing"
                                            ? "bg-accent-500"
                                            : app.status === "accepted"
                                              ? "bg-green-500"
                                              : "bg-red-500"
                                      }`}
                                    ></span>
                                    {appStatusLabel[app.status]}
                                    <i className="ri-arrow-down-s-line text-[10px]"></i>
                                  </button>
                                  {statusDropdownOpen === app.id && (
                                    <div className="absolute top-full mt-1 left-0 bg-background-50 border border-background-200 rounded-lg shadow-lg py-1 min-w-[140px] z-30">
                                      {(
                                        [
                                          "pending",
                                          "reviewing",
                                          "accepted",
                                          "rejected",
                                        ] as const
                                      ).map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() =>
                                            handleStatusChange(app.id, s)
                                          }
                                          className={`w-full text-left px-4 py-2 text-sm hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                            app.status === s
                                              ? "font-semibold text-foreground-950"
                                              : "text-foreground-600"
                                          }`}
                                        >
                                          <span
                                            className={`w-2 h-2 rounded-full ${
                                              s === "pending"
                                                ? "bg-yellow-500"
                                                : s === "reviewing"
                                                  ? "bg-accent-500"
                                                  : s === "accepted"
                                                    ? "bg-green-500"
                                                    : "bg-red-500"
                                            }`}
                                          ></span>
                                          {appStatusLabel[s]}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          )}
                          {appVisibleColumns.includes("actions") && (
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => void handleViewApplication(app)}
                                disabled={viewAppLoading}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 min-h-[44px]"
                              >
                                <i className="ri-file-user-line"></i>{" "}
                                {t("dashboard.viewApplication")}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={appPage}
                  totalPages={totalAppPages}
                  pageSize={appPageSize}
                  totalItems={totalAppItems}
                  onPageChange={setAppPage}
                  onPageSizeChange={(size) => {
                    setAppPageSize(size);
                    setAppPage(1);
                  }}
                />
              </div>
            )}
          </>
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
