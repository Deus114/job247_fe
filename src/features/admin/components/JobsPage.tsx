import {
  AdminAuthError,
  fetchAdminJobById,
  fetchAdminJobs,
  joinJobRefNames,
  resolveAdminAuthErrorMessage,
  restoreAdminJob,
  softDeleteAdminJob,
  updateAdminJob,
} from "@/api";
import ColumnVisibilityDropdown from "@/components/ui/ColumnVisibilityDropdown";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import SortHeader from "@/components/ui/SortHeader";
import {
  TableActionMenu,
  useTableActionMenu,
} from "@/components/ui/TableActionMenu";
import {
  employmentTypeLabelKey,
  experienceLevelLabelKey,
} from "@/constants/employerJob";
import { notificationFocus } from "@/features/notifications";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { formatMoneyRange } from "@/lib/formatNumber";
import { toast } from "@/lib/toast";
import type { AdminJob, EmployerJobStatus } from "@/types/job";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

type SortField = "title" | "createdAt" | "updatedAt" | "deadline";

const STATUS_VALUES: EmployerJobStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function statusBadgeClass(status: EmployerJobStatus): string {
  switch (status) {
    case "APPROVED":
      return "bg-accent-100 text-accent-600";
    case "REJECTED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function salaryLabel(job: AdminJob, negotiableLabel: string): string {
  if (job.salaryNegotiable) return negotiableLabel;
  return formatMoneyRange(job.salaryMin, job.salaryMax);
}

export default function JobsPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = i18n.language;
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<number>();

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [hotFilter, setHotFilter] = useState("");
  const [items, setItems] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);
  const [detail, setDetail] = useState<AdminJob | null>(null);
  const [editTarget, setEditTarget] = useState<AdminJob | null>(null);
  const [editStatus, setEditStatus] = useState<EmployerJobStatus>("PENDING");
  const [editActive, setEditActive] = useState(true);
  const [editHot, setEditHot] = useState(false);
  const [editRejectionReason, setEditRejectionReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<number | null>(
    null,
  );

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState([
    "title",
    "company",
    "status",
    "hot",
    "active",
    "createdAt",
    "actions",
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field as SortField);
      setSortOrder("asc");
    }
  };

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetchAdminJobs({
        keyword: keyword || undefined,
        status: statusFilter ? (statusFilter as EmployerJobStatus) : undefined,
        active:
          activeFilter === "true"
            ? true
            : activeFilter === "false"
              ? false
              : undefined,
        hot:
          hotFilter === "true"
            ? true
            : hotFilter === "false"
              ? false
              : undefined,
        deleted: viewMode === "trash",
        page: currentPage,
        size: pageSize,
        sort: `${sortField},${sortOrder.toUpperCase()}`,
      });
      setItems(res.data);
      setTotalItems(res.pagination.total);
      setTotalPages(Math.max(1, res.pagination.last_page));
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminJobLoadFailed");
      setLoadError(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    statusFilter,
    activeFilter,
    hotFilter,
    viewMode,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    t,
  ]);

  const loadTrashCount = useCallback(async () => {
    try {
      const res = await fetchAdminJobs({ deleted: true, page: 1, size: 1 });
      setTrashCount(res.pagination.total);
    } catch {
      setTrashCount(0);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadTrashCount();
  }, [loadTrashCount, viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    keyword,
    statusFilter,
    activeFilter,
    hotFilter,
    viewMode,
    pageSize,
    sortField,
    sortOrder,
  ]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === openId) ?? null,
    [items, openId],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.filters.allStatuses") },
      ...STATUS_VALUES.map((value) => ({
        value,
        label: t(`adminUi.status.${value}`),
      })),
    ],
    [t],
  );

  const boolFilterOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.filters.allStatuses") },
      { value: "true", label: t("adminUi.jobs.on") },
      { value: "false", label: t("adminUi.jobs.off") },
    ],
    [t],
  );

  const editStatusOptions = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label: t(`adminUi.status.${value}`),
      })),
    [t],
  );

  const allColumns = useMemo(
    () => [
      { key: "title", label: t("adminUi.columns.title") },
      { key: "company", label: t("adminUi.columns.company") },
      { key: "industry", label: t("adminUi.companies.industry") },
      { key: "location", label: t("adminUi.columns.location") },
      { key: "salary", label: t("adminUi.columns.salary") },
      { key: "status", label: t("adminUi.columns.status") },
      { key: "hot", label: t("adminUi.jobs.hot") },
      { key: "active", label: t("adminUi.columns.active") },
      { key: "deadline", label: t("adminUi.jobs.deadline") },
      { key: "createdAt", label: t("adminUi.columns.createdAt") },
      { key: "actions", label: t("adminUi.columns.actions") },
    ],
    [t],
  );

  const openDetail = async (job: AdminJob) => {
    setDetail(job);
    try {
      const fresh = await fetchAdminJobById(job.id);
      setDetail((current) => (current?.id === job.id ? fresh : current));
    } catch {
      /* keep list row */
    }
  };

  const focus = notificationFocus(location.search, location.state);
  useEffect(() => {
    if (!focus) return;
    let cancelled = false;
    void fetchAdminJobById(focus.id)
      .then((job) => {
        if (!cancelled) setDetail(job);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("apiErrors.adminJobLoadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [focus?.key, t]);

  const openEdit = (job: AdminJob) => {
    setEditTarget(job);
    setEditStatus(job.status);
    setEditActive(job.active);
    setEditHot(job.hot);
    setEditRejectionReason(job.rejectionReason || "");
    close();
  };

  const errorText = (error: unknown, fallbackKey: string) =>
    error instanceof AdminAuthError
      ? resolveAdminAuthErrorMessage(error, t)
      : t(fallbackKey);

  const runSoftDelete = async (id: number) => {
    try {
      await softDeleteAdminJob(id);
      toast.success(t("adminUi.jobs.deletedToast"));
      setConfirmSoftDelete(null);
      if (detail?.id === id) setDetail(null);
      if (editTarget?.id === id) setEditTarget(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminJobDeleteFailed"));
    }
  };

  const runRestore = async (id: number) => {
    try {
      await restoreAdminJob(id);
      toast.success(t("adminUi.jobs.restored"));
      if (detail?.id === id) setDetail(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminJobRestoreFailed"));
    }
  };

  const handleSaveEdit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget || saving) return;

    if (
      editStatus === "REJECTED" &&
      editTarget.status !== "REJECTED" &&
      !editRejectionReason.trim()
    ) {
      toast.error(t("adminUi.rejectionReasonRequired"));
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminJob(editTarget.id, {
        active: editActive,
        status: editStatus,
        hot: editHot,
        rejectionReason:
          editStatus === "REJECTED" ? editRejectionReason.trim() : undefined,
      });
      toast.success(t("adminUi.jobs.saved"));
      setEditTarget(null);
      await loadList();
      if (detail?.id === updated.id) setDetail(updated);
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminJobUpdateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const hasFilters = Boolean(
    keyword || search || statusFilter || activeFilter || hotFilter,
  );
  const columnCount = Math.max(1, visibleColumns.length);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.jobs")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${totalItems} ${t("adminUi.jobs.jobPostings")}`
                : `${totalItems} ${t("adminUi.jobs.deleted")}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ColumnVisibilityDropdown
              columns={allColumns}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            <button
              type="button"
              onClick={() => {
                setViewMode("active");
                setSearch("");
                setKeyword("");
                setStatusFilter("");
                setActiveFilter("");
                setHotFilter("");
                setCurrentPage(1);
              }}
              className={`h-10 px-3 rounded-xl text-sm font-medium border cursor-pointer min-h-[44px] ${
                viewMode === "active"
                  ? "bg-primary-500 border-primary-500 text-white"
                  : "bg-background-50 border-background-200 text-foreground-700"
              }`}
            >
              {t("adminUi.jobs.on")}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("trash");
                setCurrentPage(1);
              }}
              className={`h-10 px-3 rounded-xl text-sm font-medium border cursor-pointer min-h-[44px] ${
                viewMode === "trash"
                  ? "bg-primary-500 border-primary-500 text-white"
                  : "bg-background-50 border-background-200 text-foreground-700"
              }`}
            >
              {t("adminUi.actions.trash")}
              {trashCount > 0 ? ` (${trashCount})` : ""}
            </button>
          </div>
        </div>

        {viewMode === "trash" && (
          <p className="text-xs text-foreground-500">
            {t("adminUi.jobs.trashInfo")}
          </p>
        )}

        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("adminUi.jobs.searchPlaceholder")}
              className="w-full h-11 pl-10 pr-3 text-sm bg-background-50 border border-background-200/70 rounded-xl outline-none focus:border-primary-400"
            />
          </div>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-full lg:w-[180px]"
            outlined
          />
          <CustomSelect
            value={activeFilter}
            onChange={setActiveFilter}
            options={boolFilterOptions}
            className="w-full lg:w-[160px]"
            outlined
          />
          <CustomSelect
            value={hotFilter}
            onChange={setHotFilter}
            options={[
              { value: "", label: t("adminUi.jobs.allHot") },
              { value: "true", label: t("adminUi.jobs.hot") },
              { value: "false", label: t("adminUi.jobs.notHot") },
            ]}
            className="w-full lg:w-[160px]"
            outlined
          />
          <button
            type="button"
            onClick={() => {
              setKeyword(search.trim());
              setCurrentPage(1);
            }}
            className="h-11 px-4 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 cursor-pointer min-h-[44px]"
          >
            {t("adminUi.filters.apply")}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {loadError}
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-background-200/70">
                {visibleColumns.includes("title") && (
                  <th className="text-left px-4 py-3">
                    <SortHeader
                      label={t("adminUi.columns.title")}
                      field="title"
                      currentField={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                )}
                {visibleColumns.includes("company") && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.columns.company")}
                  </th>
                )}
                {visibleColumns.includes("industry") && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.companies.industry")}
                  </th>
                )}
                {visibleColumns.includes("location") && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.columns.location")}
                  </th>
                )}
                {visibleColumns.includes("salary") && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.columns.salary")}
                  </th>
                )}
                {visibleColumns.includes("status") && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.columns.status")}
                  </th>
                )}
                {visibleColumns.includes("hot") && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.jobs.hot")}
                  </th>
                )}
                {visibleColumns.includes("active") && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.columns.active")}
                  </th>
                )}
                {visibleColumns.includes("deadline") && (
                  <th className="text-left px-4 py-3">
                    <SortHeader
                      label={t("adminUi.jobs.deadline")}
                      field="deadline"
                      currentField={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                )}
                {visibleColumns.includes("createdAt") && (
                  <th className="text-left px-4 py-3">
                    <SortHeader
                      label={t("adminUi.columns.createdAt")}
                      field="createdAt"
                      currentField={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                )}
                {visibleColumns.includes("actions") && (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.columns.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="px-4 py-12 text-center text-foreground-500"
                  >
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="px-4 py-12 text-center text-foreground-500"
                  >
                    {hasFilters
                      ? t("adminUi.jobs.noJobsFiltered")
                      : viewMode === "trash"
                        ? t("adminUi.jobs.trashEmpty")
                        : t("adminUi.jobs.noJobsFound")}
                  </td>
                </tr>
              ) : (
                items.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-background-100 hover:bg-background-50"
                  >
                    {visibleColumns.includes("title") && (
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground-900 line-clamp-2">
                          {job.title}
                        </p>
                        <p className="text-xs text-foreground-500 mt-0.5">
                          {job.createdByUserName || "—"}
                        </p>
                      </td>
                    )}
                    {visibleColumns.includes("company") && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-background-100 border border-background-200/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {job.companyLogo ? (
                              <img
                                src={job.companyLogo}
                                alt=""
                                className="w-5 h-5 object-contain"
                              />
                            ) : (
                              <i className="ri-building-line text-foreground-400 text-sm"></i>
                            )}
                          </span>
                          <span className="truncate text-foreground-800">
                            {job.companyName || "—"}
                          </span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes("industry") && (
                      <td className="px-4 py-3 text-xs text-foreground-600">
                        {joinJobRefNames(job.industries) || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("location") && (
                      <td className="px-4 py-3 text-xs text-foreground-600 whitespace-nowrap">
                        {joinJobRefNames(job.provinces) || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("salary") && (
                      <td className="px-4 py-3 text-xs text-foreground-600 whitespace-nowrap">
                        {salaryLabel(job, t("postJob.negotiable"))}
                      </td>
                    )}
                    {visibleColumns.includes("status") && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClass(job.status)}`}
                        >
                          {t(`adminUi.status.${job.status}`)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("hot") && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {job.hot ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                            {t("adminUi.jobs.hot")}
                          </span>
                        ) : (
                          <span className="text-xs text-foreground-400">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("active") && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            job.active
                              ? "bg-accent-100 text-accent-600"
                              : "bg-background-200 text-foreground-600"
                          }`}
                        >
                          {job.active
                            ? t("adminUi.jobs.on")
                            : t("adminUi.jobs.off")}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("deadline") && (
                      <td className="px-4 py-3 text-xs text-foreground-500 whitespace-nowrap">
                        {formatDate(job.deadline, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("createdAt") && (
                      <td className="px-4 py-3 text-xs text-foreground-500 whitespace-nowrap">
                        {formatDateTime(job.createdAt, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("actions") && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => toggle(job.id, event)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-background-100 cursor-pointer"
                        >
                          <i className="ri-more-2-fill text-foreground-600"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {activeItem && (
        <TableActionMenu
          open={openId != null && !!activeItem}
          pos={pos}
          menuRef={menuRef}
        >
          <button
            type="button"
            onClick={() => {
              void openDetail(activeItem);
              close();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 cursor-pointer min-h-[44px]"
          >
            <i className="ri-eye-line"></i>
            {t("adminUi.actions.view")}
          </button>
          {viewMode === "active" && (
            <>
              <button
                type="button"
                onClick={() => openEdit(activeItem)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 cursor-pointer min-h-[44px]"
              >
                <i className="ri-edit-line"></i>
                {t("adminUi.jobs.editStatus")}
              </button>
              <hr className="my-1 border-background-200" />
              <button
                type="button"
                onClick={() => {
                  setConfirmSoftDelete(activeItem.id);
                  close();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer min-h-[44px]"
              >
                <i className="ri-delete-bin-line"></i>
                {t("adminUi.actions.delete")}
              </button>
            </>
          )}
          {viewMode === "trash" && (
            <button
              type="button"
              onClick={() => {
                void runRestore(activeItem.id);
                close();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent-600 hover:bg-accent-50 cursor-pointer min-h-[44px]"
            >
              <i className="ri-refresh-line"></i>
              {t("adminUi.actions.restore")}
            </button>
          )}
        </TableActionMenu>
      )}

      {confirmSoftDelete != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmSoftDelete(null)}
          ></div>
          <div className="relative bg-background-50 rounded-2xl p-6 w-full max-w-sm border border-background-200 shadow-lg">
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              {t("adminUi.actions.delete")}
            </h3>
            <p className="text-sm text-foreground-600 mb-5">
              {t("adminUi.jobs.trashInfo")}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void runSoftDelete(confirmSoftDelete)}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-medium cursor-pointer"
              >
                {t("adminUi.actions.delete")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmSoftDelete(null)}
                className="flex-1 h-11 rounded-xl border border-background-300 text-sm cursor-pointer"
              >
                {t("adminUi.actions.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h3 className="text-lg font-heading font-semibold text-foreground-950">
                  {detail.title}
                </h3>
                <p className="text-sm text-foreground-500 mt-1">
                  {detail.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClass(detail.status)}`}
              >
                {t(`adminUi.status.${detail.status}`)}
              </span>
              {detail.hot && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                  {t("adminUi.jobs.hot")}
                </span>
              )}
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  detail.active
                    ? "bg-accent-100 text-accent-600"
                    : "bg-background-200 text-foreground-600"
                }`}
              >
                {detail.active ? t("adminUi.jobs.on") : t("adminUi.jobs.off")}
              </span>
            </div>

            {detail.status === "REJECTED" && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-500 mb-1">
                  {t("adminUi.rejectionReason")}
                </p>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {detail.rejectionReason.trim() ||
                    t("adminUi.rejectionReasonEmpty")}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-5">
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.companies.industry")}
                </p>
                <p>{joinJobRefNames(detail.industries) || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.location")}
                </p>
                <p>{joinJobRefNames(detail.provinces) || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.education")}
                </p>
                <p>{joinJobRefNames(detail.educationLevels) || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("postJob.workType")}
                </p>
                <p>
                  {detail.employmentTypes
                    .map((value) => t(employmentTypeLabelKey(value)))
                    .join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("postJob.experience")}
                </p>
                <p>
                  {detail.experienceLevels
                    .map((value) => t(experienceLevelLabelKey(value)))
                    .join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("postJob.experienceYears")}
                </p>
                <p>
                  {detail.experienceYears != null
                    ? t("postJob.experienceYearsValue", {
                        count: detail.experienceYears,
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.salary")}
                </p>
                <p>{salaryLabel(detail, t("postJob.negotiable"))}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.jobs.deadline")}
                </p>
                <p>{formatDate(detail.deadline, lang)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.createdAt")}
                </p>
                <p>{formatDateTime(detail.createdAt, lang)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.updatedAt")}
                </p>
                <p>{formatDateTime(detail.updatedAt, lang)}</p>
              </div>
              {detail.createdByUserName && (
                <div>
                  <p className="text-xs text-foreground-500 mb-1">
                    {t("adminUi.jobs.createdBy")}
                  </p>
                  <p>{detail.createdByUserName}</p>
                </div>
              )}
            </div>

            {(
              [
                [
                  "description",
                  detail.description,
                  t("adminUi.jobs.description"),
                ],
                [
                  "requirements",
                  detail.requirements,
                  t("adminUi.jobs.requirements"),
                ],
                ["benefits", detail.benefits, t("adminUi.jobs.benefits")],
                [
                  "workLocation",
                  detail.workLocation,
                  t("postJob.workLocation"),
                ],
                ["workingTime", detail.workingTime, t("postJob.workingTime")],
                [
                  "applicantQuestion",
                  detail.applicantQuestion,
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
                  <p className="text-xs text-foreground-500 mb-1">{label}</p>
                  <div
                    className="text-sm text-foreground-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              );
            })}

            {viewMode === "active" && (
              <button
                type="button"
                onClick={() => {
                  openEdit(detail);
                  setDetail(null);
                }}
                className="w-full h-11 rounded-xl bg-primary-500 text-white text-sm font-medium cursor-pointer"
              >
                {t("adminUi.jobs.editStatus")}
              </button>
            )}
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !saving && setEditTarget(null)}
          ></div>
          <form
            onSubmit={handleSaveEdit}
            className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-lg"
          >
            <div className="flex items-start justify-between mb-5 gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-heading font-semibold text-foreground-950">
                  {t("adminUi.jobs.editStatus")}
                </h3>
                <p className="text-sm text-foreground-500 mt-1 truncate">
                  {editTarget.title}
                </p>
                <p className="text-xs text-foreground-400 mt-1">
                  {t("adminUi.jobs.editHint")}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditTarget(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer flex-shrink-0 disabled:opacity-60"
              >
                <i className="ri-close-line text-lg text-foreground-500"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.status")}
                </label>
                <CustomSelect
                  value={editStatus}
                  onChange={(value) =>
                    setEditStatus(value as EmployerJobStatus)
                  }
                  options={editStatusOptions}
                />
              </div>

              {editStatus === "REJECTED" && (
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.rejectionReason")} *
                  </label>
                  <textarea
                    value={editRejectionReason}
                    onChange={(event) =>
                      setEditRejectionReason(event.target.value)
                    }
                    rows={3}
                    required={editTarget.status !== "REJECTED"}
                    placeholder={t("adminUi.rejectionReasonPlaceholder")}
                    className="w-full px-3 py-2.5 text-sm border border-background-200 rounded-xl outline-none focus:border-primary-400 resize-y min-h-[88px]"
                  />
                  <p className="mt-1.5 text-xs text-foreground-400">
                    {t("adminUi.rejectionReasonJobHint")}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.active")}
                </label>
                <CustomSelect
                  value={editActive ? "true" : "false"}
                  onChange={(value) => setEditActive(value === "true")}
                  options={[
                    { value: "true", label: t("adminUi.jobs.on") },
                    { value: "false", label: t("adminUi.jobs.off") },
                  ]}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground-700 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={editHot}
                  onChange={(event) => setEditHot(event.target.checked)}
                  className="w-4 h-4 rounded border-background-300 text-primary-500"
                />
                {t("adminUi.jobs.markHot")}
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 cursor-pointer min-h-[44px] disabled:opacity-60"
              >
                {saving ? t("common.loading") : t("adminUi.actions.save")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditTarget(null)}
                className="px-4 py-2.5 border border-background-300 rounded-xl text-sm cursor-pointer min-h-[44px] disabled:opacity-60"
              >
                {t("adminUi.actions.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
