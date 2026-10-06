import {
  AdminAuthError,
  fetchAdminCompanies,
  fetchAdminCompanyById,
  resolveAdminAuthErrorMessage,
  restoreAdminCompany,
  softDeleteAdminCompany,
  updateAdminCompany,
} from "@/api";
import ColumnVisibilityDropdown from "@/components/ui/ColumnVisibilityDropdown";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import SortHeader from "@/components/ui/SortHeader";
import {
  TableActionMenu,
  useTableActionMenu,
} from "@/components/ui/TableActionMenu";
import { companySizeLabelKey } from "@/constants/company";
import { formatDateTime } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import type { AdminCompany, AdminCompanyStatus } from "@/types/company";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from "react";
import { useTranslation } from "react-i18next";

type SortField = "name" | "createdAt" | "updatedAt";

const STATUS_VALUES: AdminCompanyStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function statusBadgeClass(status: AdminCompanyStatus): string {
  switch (status) {
    case "APPROVED":
      return "bg-accent-100 text-accent-600";
    case "REJECTED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function CompaniesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<number>();

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [items, setItems] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);
  const [detail, setDetail] = useState<AdminCompany | null>(null);
  const [editTarget, setEditTarget] = useState<AdminCompany | null>(null);
  const [editStatus, setEditStatus] = useState<AdminCompanyStatus>("PENDING");
  const [editActive, setEditActive] = useState(true);
  const [editRejectionReason, setEditRejectionReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<number | null>(
    null,
  );

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState([
    "name",
    "industry",
    "size",
    "status",
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
      const res = await fetchAdminCompanies({
        keyword: keyword || undefined,
        status: statusFilter ? (statusFilter as AdminCompanyStatus) : undefined,
        active:
          activeFilter === "true"
            ? true
            : activeFilter === "false"
              ? false
              : undefined,
        deleted: viewMode === "trash",
        page: currentPage,
        size: pageSize,
        sort: `${sortField},${sortOrder}`,
      });
      setItems(res.data);
      setTotalItems(res.pagination.total);
      setTotalPages(Math.max(1, res.pagination.last_page));
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminCompanyLoadFailed");
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
    viewMode,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    t,
  ]);

  const loadTrashCount = useCallback(async () => {
    try {
      const res = await fetchAdminCompanies({
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
  }, [
    keyword,
    statusFilter,
    activeFilter,
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

  const activeFilterOptions = useMemo(
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
      { key: "name", label: t("adminUi.columns.name") },
      { key: "industry", label: t("adminUi.companies.industry") },
      { key: "size", label: t("adminUi.columns.size") },
      { key: "province", label: t("adminUi.columns.location") },
      { key: "status", label: t("adminUi.columns.status") },
      { key: "active", label: t("adminUi.columns.active") },
      { key: "members", label: t("adminUi.companies.members") },
      { key: "createdAt", label: t("adminUi.columns.createdAt") },
      { key: "actions", label: t("adminUi.columns.actions") },
    ],
    [t],
  );

  const openDetail = async (company: AdminCompany) => {
    setDetail(company);
    try {
      const fresh = await fetchAdminCompanyById(company.id);
      setDetail((current) => (current?.id === company.id ? fresh : current));
    } catch {
      /* keep list row */
    }
  };

  const openEdit = (company: AdminCompany) => {
    setEditTarget(company);
    setEditStatus(company.status);
    setEditActive(company.active);
    setEditRejectionReason(company.rejectionReason || "");
    close();
  };

  const errorText = (error: unknown, fallbackKey: string) =>
    error instanceof AdminAuthError
      ? resolveAdminAuthErrorMessage(error, t)
      : t(fallbackKey);

  const sizeLabel = (size: string) => {
    const key = companySizeLabelKey(size);
    const translated = t(key);
    return translated === key ? size || "—" : translated;
  };

  const industryLabel = (company: AdminCompany) =>
    company.industries
      .map((item) => item.name)
      .filter(Boolean)
      .join(", ") || "—";

  const runSoftDelete = async (id: number) => {
    try {
      await softDeleteAdminCompany(id);
      toast.success(t("adminUi.companies.deletedToast"));
      setConfirmSoftDelete(null);
      if (detail?.id === id) setDetail(null);
      if (editTarget?.id === id) setEditTarget(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminCompanyDeleteFailed"));
    }
  };

  const runRestore = async (id: number) => {
    try {
      await restoreAdminCompany(id);
      toast.success(t("adminUi.companies.restored"));
      if (detail?.id === id) setDetail(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminCompanyRestoreFailed"));
    }
  };

  const handleSaveEdit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget || saving) return;
    setSaving(true);
    try {
      const updated = await updateAdminCompany(editTarget.id, {
        active: editActive,
        status: editStatus,
        rejectionReason:
          editStatus === "REJECTED" ? editRejectionReason.trim() : undefined,
      });
      toast.success(t("adminUi.companies.saved"));
      setEditTarget(null);
      await loadList();
      if (detail?.id === updated.id) setDetail(updated);
    } catch (error) {
      toast.error(errorText(error, "apiErrors.adminCompanyUpdateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const hasFilters = Boolean(keyword || search || statusFilter || activeFilter);
  const columnCount = Math.max(1, visibleColumns.length);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.companies")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${totalItems} ${t("adminUi.companies.companies")}`
                : `${totalItems} ${t("adminUi.companies.deleted")}`}
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
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap min-h-[44px] ${
                viewMode === "active"
                  ? "bg-primary-100 text-primary-700"
                  : "text-foreground-500 hover:bg-background-100"
              }`}
            >
              <i className="ri-building-line mr-1"></i>
              {t("adminUi.actions.active")}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("trash");
                setSearch("");
                setKeyword("");
                setStatusFilter("");
                setActiveFilter("");
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
            {t("adminUi.companies.trashInfo")}
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
              placeholder={t("adminUi.companies.searchPlaceholder")}
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
          <CustomSelect
            value={activeFilter}
            onChange={(value) => {
              setActiveFilter(value);
              setCurrentPage(1);
            }}
            options={activeFilterOptions}
            className="w-full md:w-[160px]"
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
                {visibleColumns.includes("name") && (
                  <SortHeader
                    label={t("adminUi.columns.name").toUpperCase()}
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("industry") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.companies.industry").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("size") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.size").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("province") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.location").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("status") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.status").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("active") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.active").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("members") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.companies.members").toUpperCase()}
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
                {visibleColumns.includes("actions") && (
                  <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap w-[80px]">
                    {t("adminUi.columns.actions").toUpperCase()}
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
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                items.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-background-100 hover:bg-background-50 transition-colors"
                  >
                    {visibleColumns.includes("name") && (
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetail(company)}
                          className="flex items-center gap-3 text-left cursor-pointer min-w-0"
                        >
                          <div className="w-10 h-10 rounded-xl bg-background-100 border border-background-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {company.logo ? (
                              <img
                                src={company.logo}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <i className="ri-building-line text-foreground-400"></i>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground-900 truncate">
                              {company.name || "—"}
                            </p>
                            <p className="text-xs text-foreground-500 truncate">
                              {company.email || "—"}
                            </p>
                          </div>
                        </button>
                      </td>
                    )}
                    {visibleColumns.includes("industry") && (
                      <td className="px-5 py-3 text-foreground-600 text-xs max-w-[180px]">
                        <span className="line-clamp-2">
                          {industryLabel(company)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("size") && (
                      <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">
                        {sizeLabel(company.size)}
                      </td>
                    )}
                    {visibleColumns.includes("province") && (
                      <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">
                        {company.provinceName || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("status") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClass(company.status)}`}
                        >
                          {t(`adminUi.status.${company.status}`)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("active") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            company.active
                              ? "bg-accent-100 text-accent-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {company.active
                            ? t("adminUi.jobs.on")
                            : t("adminUi.jobs.off")}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("members") && (
                      <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">
                        {company.members.length}
                      </td>
                    )}
                    {visibleColumns.includes("createdAt") && (
                      <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                        {formatDateTime(company.createdAt, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("actions") && (
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {confirmSoftDelete === company.id &&
                        viewMode === "active" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => void runSoftDelete(company.id)}
                              className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium cursor-pointer min-h-[32px]"
                            >
                              {t("adminUi.jobs.confirmDelete")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmSoftDelete(null)}
                              className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer min-h-[32px]"
                            >
                              {t("adminUi.actions.cancel")}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => toggle(company.id, event)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
                          >
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && !loadError && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-building-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === "trash"
                ? t("adminUi.companies.trashEmpty")
                : hasFilters
                  ? t("adminUi.companies.noCompaniesFiltered")
                  : t("adminUi.companies.noCompaniesFound")}
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
                {t("adminUi.companies.editStatus")}
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

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-2xl shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-background-100 border border-background-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {detail.logo ? (
                    <img
                      src={detail.logo}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <i className="ri-building-line text-2xl text-foreground-400"></i>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-heading font-semibold text-foreground-950 break-words">
                    {detail.name || "—"}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClass(detail.status)}`}
                    >
                      {t(`adminUi.status.${detail.status}`)}
                    </span>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        detail.active
                          ? "bg-accent-100 text-accent-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {detail.active
                        ? t("adminUi.jobs.on")
                        : t("adminUi.jobs.off")}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer flex-shrink-0"
              >
                <i className="ri-close-line text-lg text-foreground-500"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.companies.industry")}
                </p>
                <p className="text-foreground-800">{industryLabel(detail)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.size")}
                </p>
                <p className="text-foreground-800">{sizeLabel(detail.size)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.location")}
                </p>
                <p className="text-foreground-800">
                  {detail.provinceName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.companies.address")}
                </p>
                <p className="text-foreground-800 break-words">
                  {detail.address || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.companies.email")}
                </p>
                <p className="text-foreground-800 break-all">
                  {detail.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.companies.phone")}
                </p>
                <p className="text-foreground-800">{detail.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.companies.taxCode")}
                </p>
                <p className="text-foreground-800">{detail.taxCode || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">Website</p>
                <p className="text-foreground-800 break-all">
                  {detail.website || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.createdAt")}
                </p>
                <p className="text-foreground-800">
                  {formatDateTime(detail.createdAt, lang)}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.companies.lastUpdated")}
                </p>
                <p className="text-foreground-800">
                  {formatDateTime(detail.updatedAt, lang)}
                </p>
              </div>
            </div>

            {detail.description && (
              <div className="mb-5">
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.jobs.description")}
                </p>
                <p className="text-sm text-foreground-700 whitespace-pre-wrap">
                  {detail.description}
                </p>
              </div>
            )}

            {detail.status === "REJECTED" && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-500 mb-1">
                  {t("adminUi.rejectionReason")}
                </p>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {detail.rejectionReason.trim() ||
                    t("adminUi.rejectionReasonEmpty")}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-foreground-500 mb-2">
                {t("adminUi.companies.members")} ({detail.members.length})
              </p>
              {detail.members.length === 0 ? (
                <p className="text-sm text-foreground-500">
                  {t("adminUi.companies.noMembers")}
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-background-200 bg-background-100/40"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {member.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground-900 truncate">
                            {member.name || "—"}
                          </p>
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary-100 text-primary-700">
                            {t(`adminUi.companies.memberRoles.${member.role}`)}
                          </span>
                          {!member.active && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-600">
                              {t("adminUi.jobs.off")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-500 truncate">
                          {member.email || "—"}
                          {member.phone ? ` · ${member.phone}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {viewMode === "active" && (
              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    openEdit(detail);
                    setDetail(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 cursor-pointer min-h-[44px]"
                >
                  {t("adminUi.companies.editStatus")}
                </button>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="px-4 py-2.5 border border-background-300 rounded-xl text-sm cursor-pointer min-h-[44px]"
                >
                  {t("adminUi.actions.close")}
                </button>
              </div>
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
                  {t("adminUi.companies.editStatus")}
                </h3>
                <p className="text-sm text-foreground-500 mt-1 truncate">
                  {editTarget.name}
                </p>
                <p className="text-xs text-foreground-400 mt-1">
                  {t("adminUi.companies.editHint")}
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
                    setEditStatus(value as AdminCompanyStatus)
                  }
                  options={editStatusOptions}
                />
              </div>
              {editStatus === "REJECTED" && (
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.rejectionReason")}
                  </label>
                  <textarea
                    value={editRejectionReason}
                    onChange={(event) =>
                      setEditRejectionReason(event.target.value)
                    }
                    rows={3}
                    placeholder={t("adminUi.rejectionReasonPlaceholder")}
                    className="w-full px-3 py-2.5 text-sm border border-background-200 rounded-xl outline-none focus:border-primary-400 resize-y min-h-[88px]"
                  />
                  <p className="mt-1.5 text-xs text-foreground-400">
                    {t("adminUi.rejectionReasonOptionalHint")}
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
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-1"></i>
                    {t("common.loading")}
                  </>
                ) : (
                  t("adminUi.actions.save")
                )}
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
