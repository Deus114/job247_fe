import {
  AdminAuthError,
  fetchEmployerCompanies,
  fetchPublicMe,
  resolveAdminAuthErrorMessage,
} from "@/api";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import { env } from "@/config/env";
import { companySizeLabelKey } from "@/constants/company";
import { invalidatePublicProfileSync, useAuth } from "@/features/auth";
import { usePageShell } from "@/layouts/usePageShell";
import { formatDate } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import { useAppDispatch } from "@/store/hooks";
import { login as setAuthUser } from "@/store/slices/authSlice";
import type { AdminCompanyStatus, EmployerCompany } from "@/types/company";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const STATUS_FILTERS: Array<"" | AdminCompanyStatus> = [
  "",
  "PENDING",
  "APPROVED",
  "REJECTED",
];

function statusClass(status: AdminCompanyStatus): string {
  if (status === "APPROVED") return "bg-accent-100 text-accent-600";
  if (status === "REJECTED") return "bg-red-100 text-red-600";
  return "bg-yellow-100 text-yellow-700";
}

export default function CompaniesPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { className: shell } = usePageShell();
  const [items, setItems] = useState<EmployerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | AdminCompanyStatus>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const membershipById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of user?.companies ?? []) {
      map.set(item.companyId, item.role);
    }
    return map;
  }, [user?.companies]);

  // Refresh membership once on mount (dispatch is stable — do not depend on useAuth().login).
  useEffect(() => {
    if (!env.apiBaseUrl) return;
    invalidatePublicProfileSync();
    void fetchPublicMe()
      .then((me) => dispatch(setAuthUser(me)))
      .catch(() => {
        /* keep session */
      });
  }, [dispatch]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEmployerCompanies({
        mine: true,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        size: pageSize,
        sort: "createdAt,desc",
      });
      setItems(res.data);
      setTotalItems(res.pagination.total);
      setTotalPages(Math.max(1, res.pagination.last_page));
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerCompanyLoadFailed");
      toast.error(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, currentPage, pageSize, t]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    setCurrentPage((page) => (page === 1 ? page : 1));
  }, [keyword, statusFilter, pageSize]);

  const sizeLabel = (size: string) => {
    const key = companySizeLabelKey(size);
    const translated = t(key);
    return translated === key ? size || "—" : translated;
  };

  return (
    <div className={shell || undefined}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground-950">
            {t("company.myCompanies")}
          </h2>
          <p className="text-sm text-foreground-500 mt-1">
            {t("company.listCount", { count: totalItems })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/employer/companies/find"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border border-background-200/70 bg-background-50 hover:bg-background-100 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-search-eye-line"></i> {t("company.findCompany")}
          </Link>
          <Link
            to="/employer/companies/join-requests"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border border-background-200/70 bg-background-50 hover:bg-background-100 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-mail-send-line"></i> {t("company.myJoinRequests")}
          </Link>
          <Link
            to="/employer/companies/new"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border border-primary-500 bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i> {t("company.create")}
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap mb-4">
        <div className="relative flex-1 w-full sm:max-w-[280px]">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setKeyword(search.trim());
              }
            }}
            placeholder={t("company.searchPlaceholder")}
            className="w-full h-10 pl-9 pr-4 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
          />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value as "" | AdminCompanyStatus)
          }
          options={STATUS_FILTERS.map((status) => ({
            value: status,
            label:
              status === "" ? t("common.all") : t(`adminUi.status.${status}`),
          }))}
          className="w-full sm:w-[180px]"
          outlined
        />
        <button
          type="button"
          onClick={() => setKeyword(search.trim())}
          className="h-10 px-4 rounded-xl border border-primary-500 bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 cursor-pointer"
        >
          {t("adminUi.filters.apply")}
        </button>
      </div>

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-background-200/70">
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.name").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.industry").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.myRole").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.size").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.status").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.createdDate").toUpperCase()}
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 w-[80px]">
                  {t("dashboard.jobsTable.actions").toUpperCase()}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-foreground-500"
                  >
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                items.map((company) => {
                  const role = membershipById.get(company.id);
                  return (
                    <tr
                      key={company.id}
                      className="border-b border-background-100 hover:bg-background-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/employer/companies/${company.id}`}
                          className="flex items-center gap-3 min-w-0"
                        >
                          <span className="w-9 h-9 rounded-lg bg-background-100 border border-background-200/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {company.logo ? (
                              <img
                                src={company.logo}
                                alt=""
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <i className="ri-building-line text-foreground-400"></i>
                            )}
                          </span>
                          <span className="font-medium text-foreground-900 truncate">
                            {company.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-foreground-600 text-xs max-w-[180px]">
                        <span className="line-clamp-2">
                          {company.industries
                            .map((item) => item.name)
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {role ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                            {t(`company.memberRoles.${role}`)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3 text-foreground-600 text-xs whitespace-nowrap">
                        {sizeLabel(company.size)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusClass(company.status)}`}
                        >
                          {t(`adminUi.status.${company.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-foreground-500 text-xs whitespace-nowrap">
                        {formatDate(company.createdAt, i18n.language)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/employer/companies/${company.id}`}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-background-100 text-foreground-600"
                        >
                          <i className="ri-eye-line"></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-building-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500 mb-4">
              {keyword || statusFilter
                ? t("company.emptyFilterDesc")
                : t("company.emptyDesc")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                to="/employer/companies/find"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-background-200 text-sm cursor-pointer hover:bg-background-100 min-h-[44px]"
              >
                {t("company.findCompany")}
              </Link>
              <Link
                to="/employer/companies/new"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm cursor-pointer hover:bg-primary-600 min-h-[44px]"
              >
                {t("company.createFirst")}
              </Link>
            </div>
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
    </div>
  );
}
