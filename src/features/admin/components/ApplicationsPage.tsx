import {
  AdminAuthError,
  fetchAdminApplicationById,
  fetchAdminApplications,
  permanentDeleteAdminApplication,
  resolveAdminAuthErrorMessage,
  restoreAdminApplication,
  softDeleteAdminApplication,
} from "@/api";
import ColumnVisibilityDropdown from "@/components/ui/ColumnVisibilityDropdown";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import SortHeader from "@/components/ui/SortHeader";
import {
  TableActionMenu,
  useTableActionMenu,
} from "@/components/ui/TableActionMenu";
import { formatDateTime } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import type {
  Application,
  EmployerApplicationStatus,
} from "@/types/application";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type SortField = "fullName" | "createdAt" | "updatedAt" | "jobTitle";

const STATUS_VALUES: EmployerApplicationStatus[] = ["SUBMITTED", "VIEWED"];

function statusBadgeClass(status: string): string {
  if (status === "VIEWED") return "bg-accent-100 text-accent-600";
  return "bg-yellow-100 text-yellow-700";
}

function appNumericId(app: Application): number {
  return Number(app.id);
}

export default function ApplicationsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<number>();

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);
  const [detail, setDetail] = useState<Application | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<number | null>(
    null,
  );
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<
    number | null
  >(null);

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState([
    "fullName",
    "email",
    "jobTitle",
    "company",
    "status",
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
      const res = await fetchAdminApplications({
        keyword: keyword || undefined,
        status: statusFilter
          ? (statusFilter as EmployerApplicationStatus)
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
          : t("apiErrors.adminApplicationLoadFailed");
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
    viewMode,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    t,
  ]);

  const loadTrashCount = useCallback(async () => {
    try {
      const res = await fetchAdminApplications({
        deleted: true,
        page: 1,
        size: 1,
      });
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
  }, [keyword, statusFilter, viewMode, pageSize, sortField, sortOrder]);

  const activeItem = useMemo(
    () => items.find((item) => appNumericId(item) === openId) ?? null,
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

  const allColumns = useMemo(
    () => [
      { key: "fullName", label: t("adminUi.columns.fullName") },
      { key: "email", label: t("adminUi.columns.email") },
      { key: "phone", label: t("adminUi.columns.phone") },
      { key: "jobTitle", label: t("adminUi.columns.title") },
      { key: "company", label: t("adminUi.columns.company") },
      { key: "status", label: t("adminUi.columns.status") },
      { key: "createdAt", label: t("adminUi.columns.createdAt") },
      { key: "updatedAt", label: t("adminUi.columns.updatedAt") },
      { key: "actions", label: t("adminUi.columns.actions") },
    ],
    [t],
  );

  const errorText = (error: unknown, fallbackKey: string) =>
    error instanceof AdminAuthError
      ? resolveAdminAuthErrorMessage(error, t)
      : t(fallbackKey);

  const openDetail = async (app: Application) => {
    close();
    try {
      const fresh = await fetchAdminApplicationById(appNumericId(app));
      setDetail(fresh);
      setItems((prev) =>
        prev.map((item) => (item.id === fresh.id ? fresh : item)),
      );
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminApplicationLoadFailed"));
      setDetail(app);
    }
  };

  const runSoftDelete = async (id: number) => {
    try {
      await softDeleteAdminApplication(id);
      toast.success(t("adminUi.applications.deletedToast"));
      setConfirmSoftDelete(null);
      if (detail && appNumericId(detail) === id) setDetail(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminApplicationDeleteFailed"));
    }
  };

  const runRestore = async (id: number) => {
    try {
      await restoreAdminApplication(id);
      toast.success(t("adminUi.applications.restored"));
      if (detail && appNumericId(detail) === id) setDetail(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminApplicationRestoreFailed"));
    }
  };

  const runPermanentDelete = async (id: number) => {
    try {
      await permanentDeleteAdminApplication(id);
      toast.success(t("adminUi.applications.deletedPermanent"));
      setConfirmPermanentDelete(null);
      if (detail && appNumericId(detail) === id) setDetail(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminApplicationDeleteFailed"));
    }
  };

  const hasFilters = Boolean(keyword || search || statusFilter);
  const columnCount = Math.max(1, visibleColumns.length);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.applications")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${totalItems} ${t("adminUi.applications.applications")}`
                : `${totalItems} ${t("adminUi.applications.deleted")}`}
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
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap min-h-[44px] ${
                viewMode === "active"
                  ? "bg-primary-100 text-primary-700"
                  : "text-foreground-500 hover:bg-background-100"
              }`}
            >
              <i className="ri-file-user-line mr-1"></i>
              {t("adminUi.actions.active")}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("trash");
                setSearch("");
                setKeyword("");
                setStatusFilter("");
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 min-h-[44px] ${
                viewMode === "trash"
                  ? "bg-red-100 text-red-600"
                  : "text-foreground-500 hover:bg-background-100"
              }`}
            >
              <i className="ri-delete-bin-line"></i>
              {t("adminUi.actions.trash")}
              {trashCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                  {trashCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {viewMode === "trash" && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
            <i className="ri-information-line mr-1"></i>
            {t("adminUi.applications.trashInfo")}
          </div>
        )}

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setKeyword(search.trim());
                  setCurrentPage(1);
                }
              }}
              placeholder={t("adminUi.applications.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm outline-none focus:border-primary-400 min-h-[44px]"
            />
          </div>
          <CustomSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            options={statusOptions}
            className="w-full md:w-[180px]"
            outlined
          />
          <button
            type="button"
            onClick={() => {
              setKeyword(search.trim());
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-primary-500 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            {t("adminUi.filters.apply")}
          </button>
        </div>
      </div>

      <div className="bg-background-50 border border-background-200/70 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-background-200 bg-background-100/50">
                {visibleColumns.includes("fullName") && (
                  <SortHeader
                    label={t("adminUi.columns.fullName").toUpperCase()}
                    field="fullName"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("email") && (
                  <th className="px-5 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-left">
                    {t("adminUi.columns.email")}
                  </th>
                )}
                {visibleColumns.includes("phone") && (
                  <th className="px-5 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-left hidden lg:table-cell">
                    {t("adminUi.columns.phone")}
                  </th>
                )}
                {visibleColumns.includes("jobTitle") && (
                  <SortHeader
                    label={t("adminUi.columns.title").toUpperCase()}
                    field="jobTitle"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("company") && (
                  <th className="px-5 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-left">
                    {t("adminUi.columns.company")}
                  </th>
                )}
                {visibleColumns.includes("status") && (
                  <th className="px-5 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-left">
                    {t("adminUi.columns.status")}
                  </th>
                )}
                {visibleColumns.includes("createdAt") && (
                  <SortHeader
                    label={t("adminUi.columns.createdAt").toUpperCase()}
                    field="createdAt"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("updatedAt") && (
                  <SortHeader
                    label={t("adminUi.columns.updatedAt").toUpperCase()}
                    field="updatedAt"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("actions") && (
                  <th className="px-5 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-right">
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
                    className="px-5 py-12 text-center text-foreground-500"
                  >
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const id = appNumericId(item);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-background-200/70 hover:bg-background-100/40"
                    >
                      {visibleColumns.includes("fullName") && (
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground-900">
                            {item.fullName || "—"}
                          </p>
                        </td>
                      )}
                      {visibleColumns.includes("email") && (
                        <td className="px-5 py-3 text-foreground-600">
                          {item.email || "—"}
                        </td>
                      )}
                      {visibleColumns.includes("phone") && (
                        <td className="px-5 py-3 text-foreground-600 hidden lg:table-cell">
                          {item.phone || "—"}
                        </td>
                      )}
                      {visibleColumns.includes("jobTitle") && (
                        <td className="px-5 py-3 text-foreground-700 max-w-[180px]">
                          <span className="line-clamp-2">
                            {item.jobTitle || "—"}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes("company") && (
                        <td className="px-5 py-3 text-foreground-600 max-w-[160px]">
                          <span className="line-clamp-2">
                            {item.companyName || "—"}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes("status") && (
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusBadgeClass(item.status)}`}
                          >
                            {t(`adminUi.status.${item.status}`, item.status)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes("createdAt") && (
                        <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                          {formatDateTime(item.createdAt, lang)}
                        </td>
                      )}
                      {visibleColumns.includes("updatedAt") && (
                        <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                          {formatDateTime(item.updatedAt, lang)}
                        </td>
                      )}
                      {visibleColumns.includes("actions") && (
                        <td className="px-5 py-3 text-right whitespace-nowrap relative">
                          {confirmSoftDelete === id &&
                          viewMode === "active" ? (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => void runSoftDelete(id)}
                                className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium cursor-pointer min-h-[44px]"
                              >
                                {t("adminUi.jobs.confirmDelete")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmSoftDelete(null)}
                                className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer min-h-[44px]"
                              >
                                {t("adminUi.actions.cancel")}
                              </button>
                            </div>
                          ) : confirmPermanentDelete === id &&
                            viewMode === "trash" ? (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => void runPermanentDelete(id)}
                                className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium cursor-pointer min-h-[44px]"
                              >
                                {t("adminUi.jobs.deletePermanent")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmPermanentDelete(null)}
                                className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer min-h-[44px]"
                              >
                                {t("adminUi.actions.cancel")}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => toggle(id, e)}
                              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
                            >
                              <i className="ri-more-2-fill text-foreground-500"></i>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && items.length === 0 && !loadError && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-file-user-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === "active"
                ? hasFilters
                  ? t("adminUi.applications.noFiltered")
                  : t("adminUi.applications.noFound")
                : t("adminUi.jobs.trashEmpty")}
            </p>
          </div>
        )}
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
          {viewMode === "active" ? (
            <>
              <button
                type="button"
                onClick={() => void openDetail(activeItem)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 cursor-pointer min-h-[44px]"
              >
                <i className="ri-eye-line text-primary-500"></i>
                {t("adminUi.jobs.viewDetails")}
              </button>
              <hr className="my-1 border-background-200" />
              <button
                type="button"
                onClick={() => {
                  setConfirmSoftDelete(appNumericId(activeItem));
                  close();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer min-h-[44px]"
              >
                <i className="ri-delete-bin-line"></i>
                {t("adminUi.actions.delete")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void openDetail(activeItem)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 cursor-pointer min-h-[44px]"
              >
                <i className="ri-eye-line text-primary-500"></i>
                {t("adminUi.jobs.viewDetails")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void runRestore(appNumericId(activeItem));
                  close();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent-600 hover:bg-accent-50 cursor-pointer min-h-[44px]"
              >
                <i className="ri-refresh-line"></i>
                {t("adminUi.actions.restore")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmPermanentDelete(appNumericId(activeItem));
                  close();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer min-h-[44px]"
              >
                <i className="ri-delete-bin-6-line"></i>
                {t("adminUi.jobs.deletePermanent")}
              </button>
            </>
          )}
        </TableActionMenu>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h3 className="text-lg font-heading font-semibold text-foreground-950">
                  {detail.fullName || t("adminUi.applications.detailTitle")}
                </h3>
                <p className="text-sm text-foreground-500 mt-1">
                  {detail.jobTitle}
                  {detail.companyName ? ` · ${detail.companyName}` : ""}
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

            <span
              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full mb-4 ${statusBadgeClass(detail.status)}`}
            >
              {t(`adminUi.status.${detail.status}`, detail.status)}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-5">
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.email")}
                </p>
                <p className="break-all">{detail.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.phone")}
                </p>
                <p>{detail.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.createdAt")}
                </p>
                <p>{formatDateTime(detail.createdAt, lang)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.applications.viewedAt")}
                </p>
                <p>
                  {detail.viewedAt
                    ? formatDateTime(detail.viewedAt, lang)
                    : "—"}
                </p>
              </div>
              {detail.viewedByUserName ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-foreground-500 mb-1">
                    {t("adminUi.applications.viewedBy")}
                  </p>
                  <p>{detail.viewedByUserName}</p>
                </div>
              ) : null}
            </div>

            {detail.coverLetter ? (
              <div className="mb-5">
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.applications.coverLetter")}
                </p>
                <p className="text-sm text-foreground-700 whitespace-pre-wrap">
                  {detail.coverLetter}
                </p>
              </div>
            ) : null}

            {detail.cvUrl ? (
              <a
                href={detail.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 min-h-[44px]"
              >
                <i className="ri-file-text-line"></i>
                {detail.cvFileName || t("adminUi.applications.viewCv")}
              </a>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
