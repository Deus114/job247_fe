import {
  AdminAuthError,
  fetchPublicAccountById,
  fetchPublicAccounts,
  resolveAdminAuthErrorMessage,
  restorePublicAccount,
  softDeletePublicAccount,
  updatePublicAccountStatus,
} from "@/api";
import ColumnVisibilityDropdown from "@/components/ui/ColumnVisibilityDropdown";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import SortHeader from "@/components/ui/SortHeader";
import {
  TableActionMenu,
  useTableActionMenu,
} from "@/components/ui/TableActionMenu";
import { AdminAvatar } from "@/features/admin";
import { formatDateTime } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import type { PublicAccount, PublicAccountType } from "@/types/user";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type SortField = "name" | "email" | "createdAt" | "updatedAt";

interface PublicAccountsPageProps {
  accountType: PublicAccountType;
}

export default function PublicAccountsPage({
  accountType,
}: PublicAccountsPageProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isEmployer = accountType === "EMPLOYER";
  const titleKey = isEmployer
    ? "adminUi.pageTitles.employers"
    : "adminUi.pageTitles.jobSeekers";
  const countKey = isEmployer
    ? "adminUi.publicAccounts.employers"
    : "adminUi.publicAccounts.jobSeekers";

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [items, setItems] = useState<PublicAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);
  const [detail, setDetail] = useState<PublicAccount | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<number | null>(
    null,
  );
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<number>();

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState([
    "account",
    "email",
    "emailVerified",
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
      const res = await fetchPublicAccounts({
        keyword: keyword || undefined,
        type: accountType,
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
          : t("apiErrors.publicAccountLoadFailed");
      setLoadError(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    accountType,
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
      const res = await fetchPublicAccounts({
        type: accountType,
        deleted: true,
        page: 1,
        size: 1,
      });
      setTrashCount(res.pagination.total);
    } catch {
      setTrashCount(0);
    }
  }, [accountType]);

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
    activeFilter,
    viewMode,
    pageSize,
    sortField,
    sortOrder,
    accountType,
  ]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === openId) ?? null,
    [items, openId],
  );

  const activeFilterOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.filters.allStatuses") },
      { value: "true", label: t("adminUi.jobs.on") },
      { value: "false", label: t("adminUi.jobs.off") },
    ],
    [t],
  );

  const openDetail = async (account: PublicAccount) => {
    setDetail(account);
    try {
      const fresh = await fetchPublicAccountById(account.id);
      setDetail((current) => (current?.id === account.id ? fresh : current));
    } catch {
      /* keep the list row */
    }
  };

  const errorText = (error: unknown, fallbackKey: string) =>
    error instanceof AdminAuthError
      ? resolveAdminAuthErrorMessage(error, t)
      : t(fallbackKey);

  const runSoftDelete = async (id: number) => {
    try {
      await softDeletePublicAccount(id);
      toast.success(t("adminUi.publicAccounts.deleted"));
      setConfirmSoftDelete(null);
      if (detail?.id === id) setDetail(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.publicAccountDeleteFailed"));
    }
  };

  const runRestore = async (id: number) => {
    try {
      await restorePublicAccount(id);
      toast.success(t("adminUi.publicAccounts.restored"));
      if (detail?.id === id) setDetail(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(errorText(error, "apiErrors.publicAccountRestoreFailed"));
    }
  };

  const toggleActive = async (account: PublicAccount) => {
    const nextActive = !account.active;
    try {
      await updatePublicAccountStatus(account.id, nextActive);
      toast.success(
        nextActive
          ? t("adminUi.publicAccounts.activated")
          : t("adminUi.publicAccounts.deactivated"),
      );
      await loadList();
      if (detail?.id === account.id) {
        setDetail({ ...account, active: nextActive });
      }
    } catch (error) {
      toast.error(errorText(error, "apiErrors.publicAccountStatusFailed"));
    }
  };

  const hasFilters = Boolean(keyword || search || activeFilter);
  const columnCount = Math.max(1, visibleColumns.length);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t(titleKey)}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${totalItems} ${t(countKey)}`
                : `${totalItems} ${t("adminUi.jobs.deleted")}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: "account", label: t("adminUi.columns.name") },
                { key: "email", label: t("adminUi.columns.email") },
                {
                  key: "emailVerified",
                  label: t("adminUi.publicAccounts.emailVerified"),
                },
                { key: "active", label: t("adminUi.columns.active") },
                { key: "createdAt", label: t("adminUi.columns.createdAt") },
                { key: "actions", label: t("adminUi.columns.actions") },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            <button
              type="button"
              onClick={() => {
                setViewMode("active");
                setSearch("");
                setKeyword("");
              }}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "active"
                  ? "border-primary-200 bg-primary-100 text-primary-700"
                  : "border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100"
              }`}
            >
              <i
                className={isEmployer ? "ri-user-star-line" : "ri-user-line"}
              ></i>
              {t("adminUi.actions.active")}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("trash");
                setSearch("");
                setKeyword("");
              }}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "trash"
                  ? "border-red-200 bg-red-100 text-red-600"
                  : "border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100"
              }`}
            >
              <i className="ri-delete-bin-line"></i>
              {t("adminUi.actions.trash")}
              {trashCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                  {trashCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[280px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setKeyword(search.trim());
              }}
              placeholder={t("adminUi.publicAccounts.searchPlaceholder")}
              className="w-full h-10 pl-9 pr-4 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
            />
          </div>
          <div className="w-full sm:w-[160px]">
            <CustomSelect
              value={activeFilter}
              options={activeFilterOptions}
              onChange={setActiveFilter}
              placeholder={t("adminUi.filters.allStatuses")}
              outlined
            />
          </div>
          <button
            type="button"
            onClick={() => setKeyword(search.trim())}
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-xl border border-primary-500 bg-primary-500 text-white hover:bg-primary-600 cursor-pointer whitespace-nowrap"
          >
            {t("common.search")}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setKeyword("");
                setActiveFilter("");
              }}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm rounded-xl border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-filter-off-line"></i>
              {t("adminUi.actions.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {viewMode === "trash" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            {t("adminUi.publicAccounts.trashInfo")}
          </p>
        </div>
      )}

      {loadError ? (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          <span className="flex-1 flex items-start gap-2">
            <i className="ri-error-warning-line mt-0.5"></i>
            {loadError}
          </span>
          <button
            type="button"
            onClick={() => void loadList()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-background-200/70">
                {visibleColumns.includes("account") && (
                  <SortHeader
                    label={t("adminUi.columns.name").toUpperCase()}
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("email") && (
                  <SortHeader
                    label={t("adminUi.columns.email").toUpperCase()}
                    field="email"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("emailVerified") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.publicAccounts.emailVerified").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("active") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.active").toUpperCase()}
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
                items.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-background-100 hover:bg-background-50 transition-colors"
                  >
                    {visibleColumns.includes("account") && (
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetail(account)}
                          className="flex items-center gap-3 text-left cursor-pointer min-w-0"
                        >
                          <AdminAvatar
                            src={account.avatar}
                            name={account.name}
                          />
                          <span className="font-medium text-foreground-900 truncate">
                            {account.name || "—"}
                          </span>
                        </button>
                      </td>
                    )}
                    {visibleColumns.includes("email") && (
                      <td className="px-5 py-3 text-foreground-600 text-xs break-all">
                        {account.email || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("emailVerified") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            account.emailVerified
                              ? "bg-accent-100 text-accent-600"
                              : "bg-background-100 text-foreground-500"
                          }`}
                        >
                          {account.emailVerified
                            ? t("adminUi.publicAccounts.verified")
                            : t("adminUi.publicAccounts.unverified")}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("active") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        {viewMode === "active" ? (
                          <button
                            type="button"
                            onClick={() => void toggleActive(account)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors min-h-[32px] ${
                              account.active
                                ? "bg-accent-100 text-accent-600 hover:bg-accent-200"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            {account.active
                              ? t("adminUi.jobs.on")
                              : t("adminUi.jobs.off")}
                          </button>
                        ) : (
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              account.active
                                ? "bg-accent-100 text-accent-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {account.active
                              ? t("adminUi.jobs.on")
                              : t("adminUi.jobs.off")}
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("createdAt") && (
                      <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                        {formatDateTime(account.createdAt, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("actions") && (
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {confirmSoftDelete === account.id &&
                        viewMode === "active" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => void runSoftDelete(account.id)}
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
                            onClick={(event) => toggle(account.id, event)}
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
              <i
                className={`${isEmployer ? "ri-user-star-line" : "ri-user-line"} text-2xl text-foreground-400`}
              ></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === "trash"
                ? t("adminUi.publicAccounts.trashEmpty")
                : hasFilters
                  ? t("adminUi.publicAccounts.noAccountsFiltered")
                  : t("adminUi.publicAccounts.noAccountsFound")}
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

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AdminAvatar
                  src={detail.avatar}
                  name={detail.name}
                  sizeClass="w-12 h-12"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-heading font-semibold text-foreground-950 break-words">
                    {detail.name || "—"}
                  </h3>
                  <p className="text-xs text-foreground-500 mt-1 break-all">
                    {detail.email || "—"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer flex-shrink-0"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.publicAccounts.accountType")}
                </p>
                <p className="font-medium text-foreground-900">
                  {detail.type === "EMPLOYER"
                    ? t("adminUi.publicAccounts.employer")
                    : t("adminUi.publicAccounts.jobSeeker")}
                </p>
              </div>
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.publicAccounts.emailVerified")}
                </p>
                <p className="font-medium text-foreground-900">
                  {detail.emailVerified
                    ? t("adminUi.publicAccounts.verified")
                    : t("adminUi.publicAccounts.unverified")}
                </p>
              </div>
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.active")}
                </p>
                <p className="font-medium text-foreground-900">
                  {detail.active ? t("adminUi.jobs.on") : t("adminUi.jobs.off")}
                </p>
              </div>
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.createdAt")}
                </p>
                <p className="font-medium text-foreground-900">
                  {formatDateTime(detail.createdAt, lang)}
                </p>
              </div>
              <div className="p-3 bg-background-100 rounded-xl sm:col-span-2">
                <p className="text-xs text-foreground-500 mb-1">
                  {t("adminUi.columns.updatedAt")}
                </p>
                <p className="font-medium text-foreground-900">
                  {formatDateTime(detail.updatedAt, lang)}
                </p>
              </div>
              {detail.type === "EMPLOYER" && (
                <div className="p-3 bg-background-100 rounded-xl sm:col-span-2">
                  <p className="text-xs text-foreground-500 mb-2">
                    {t("adminUi.publicAccounts.companies")} (
                    {detail.companies.length})
                  </p>
                  {detail.companies.length === 0 ? (
                    <p className="text-sm text-foreground-500">
                      {t("adminUi.publicAccounts.noCompanies")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detail.companies.map((item) => (
                        <div
                          key={item.companyId}
                          className="flex items-center gap-3 p-2 rounded-lg bg-background-50 border border-background-200"
                        >
                          <span className="w-8 h-8 rounded-lg overflow-hidden bg-background-100 flex items-center justify-center flex-shrink-0">
                            {item.companyLogo ? (
                              <img
                                src={item.companyLogo}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <i className="ri-building-line text-foreground-400"></i>
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground-900 truncate">
                              {item.companyName}
                            </p>
                            <p className="text-[11px] text-foreground-500">
                              {t(`company.memberRoles.${item.role}`)} ·{" "}
                              {t(`adminUi.status.${item.companyStatus}`)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <TableActionMenu
        open={openId != null && !!activeItem}
        pos={pos}
        menuRef={menuRef}
      >
        {activeItem && viewMode === "active" ? (
          <>
            <button
              type="button"
              onClick={() => {
                void openDetail(activeItem);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer min-h-[44px]"
            >
              <i className="ri-eye-line text-primary-500"></i>
              {t("adminUi.jobs.viewDetails")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmSoftDelete(activeItem.id);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer min-h-[44px]"
            >
              <i className="ri-delete-bin-line"></i>
              {t("adminUi.jobs.confirmDelete")}
            </button>
          </>
        ) : activeItem ? (
          <button
            type="button"
            onClick={() => {
              void runRestore(activeItem.id);
              close();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer min-h-[44px]"
          >
            <i className="ri-arrow-go-back-line text-primary-500"></i>
            {t("adminUi.actions.restore")}
          </button>
        ) : null}
      </TableActionMenu>
    </div>
  );
}
