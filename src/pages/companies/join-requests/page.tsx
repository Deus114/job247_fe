import {
  AdminAuthError,
  fetchCompanyJoinRequests,
  fetchEmployerCompanies,
  fetchMyCompanyJoinRequests,
  resolveAdminAuthErrorMessage,
  updateCompanyJoinRequest,
} from "@/api";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import { usePageShell } from "@/layouts/usePageShell";
import { formatDateTime } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import type {
  CompanyJoinRequest,
  CompanyJoinRequestStatus,
  EmployerCompany,
} from "@/types/company";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type TabKey = "incoming" | "mine";

const STATUS_FILTERS: Array<"" | CompanyJoinRequestStatus> = [
  "",
  "PENDING",
  "APPROVED",
  "REJECTED",
];

function statusClass(status: CompanyJoinRequestStatus): string {
  if (status === "APPROVED") return "bg-accent-100 text-accent-600";
  if (status === "REJECTED") return "bg-red-100 text-red-600";
  return "bg-yellow-100 text-yellow-700";
}

export default function JoinRequestsPage() {
  const { t, i18n } = useTranslation();
  const { className: shell } = usePageShell();
  const [tab, setTab] = useState<TabKey>("incoming");
  const [items, setItems] = useState<CompanyJoinRequest[]>([]);
  const [companies, setCompanies] = useState<EmployerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | CompanyJoinRequestStatus
  >("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const statusOptions = useMemo(
    () =>
      STATUS_FILTERS.map((status) => ({
        value: status,
        label: status === "" ? t("common.all") : t(`adminUi.status.${status}`),
      })),
    [t],
  );

  const companyOptions = useMemo(
    () => [
      { value: "", label: t("dashboard.allCompanies") },
      ...companies.map((company) => ({
        value: String(company.id),
        label: company.name,
      })),
    ],
    [companies, t],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchEmployerCompanies({
      mine: true,
      page: 1,
      size: 100,
      sort: "createdAt,desc",
    })
      .then((res) => {
        if (!cancelled) setCompanies(res.data);
      })
      .catch(() => {
        if (!cancelled) setCompanies([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = companyFilter ? Number(companyFilter) : undefined;
      const params = {
        status: statusFilter || undefined,
        page: currentPage,
        size: pageSize,
        sort: "createdAt,DESC",
        companyId:
          tab === "incoming" &&
          companyId != null &&
          Number.isFinite(companyId) &&
          companyId > 0
            ? companyId
            : undefined,
      };
      // Incoming without companyId = all owned companies; with companyId = filter one.
      const res =
        tab === "incoming"
          ? await fetchCompanyJoinRequests(params)
          : await fetchMyCompanyJoinRequests(params);
      setItems(res.data);
      setTotalItems(res.pagination.total);
      setTotalPages(Math.max(1, res.pagination.last_page));
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.companyJoinRequestLoadFailed"),
      );
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [tab, companyFilter, statusFilter, currentPage, pageSize, t]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, companyFilter, statusFilter, pageSize]);

  const handleDecide = async (
    request: CompanyJoinRequest,
    status: "APPROVED" | "REJECTED",
  ) => {
    if (actingId != null) return;
    setActingId(request.id);
    try {
      await updateCompanyJoinRequest(request.id, { status });
      toast.success(
        status === "APPROVED"
          ? t("company.joinApproved")
          : t("company.joinRejected"),
      );
      await loadList();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.companyJoinRequestUpdateFailed"),
      );
    } finally {
      setActingId(null);
    }
  };

  const isIncoming = tab === "incoming";

  return (
    <div className={shell || undefined}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground-950">
            {t("employerNav.joinRequests")}
          </h2>
          <p className="text-sm text-foreground-500 mt-1">
            {isIncoming
              ? t("company.incomingJoinRequestsDesc")
              : t("company.myJoinRequestsDesc")}
          </p>
        </div>
        <Link
          to="/employer/companies/find"
          className="inline-flex items-center gap-1.5 min-h-[44px] h-10 px-3 text-sm rounded-xl bg-primary-500 text-white hover:bg-primary-600 cursor-pointer"
        >
          <i className="ri-search-eye-line"></i> {t("company.findCompany")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("incoming")}
          className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${
            isIncoming
              ? "bg-primary-500 text-white"
              : "bg-background-100 text-foreground-600 hover:bg-background-200"
          }`}
        >
          {t("company.incomingJoinRequests")}
        </button>
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${
            !isIncoming
              ? "bg-primary-500 text-white"
              : "bg-background-100 text-foreground-600 hover:bg-background-200"
          }`}
        >
          {t("company.myJoinRequests")}
        </button>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        {isIncoming && (
          <div className="w-full sm:w-[240px]">
            <CustomSelect
              value={companyFilter}
              onChange={setCompanyFilter}
              options={companyOptions}
              placeholder={t("dashboard.allCompanies")}
              outlined
            />
          </div>
        )}
        <div className="w-full sm:w-[200px]">
          <CustomSelect
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as "" | CompanyJoinRequestStatus)
            }
            options={statusOptions}
            outlined
          />
        </div>
      </div>

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-background-200/70">
                {isIncoming ? (
                  <>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("adminUi.columns.name").toUpperCase()}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 hidden md:table-cell">
                      {t("company.name").toUpperCase()}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("company.joinMessage").toUpperCase()}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("company.status").toUpperCase()}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("dashboard.jobsTable.actions").toUpperCase()}
                    </th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("company.name").toUpperCase()}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("company.joinMessage").toUpperCase()}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("company.status").toUpperCase()}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("company.createdDate").toUpperCase()}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isIncoming ? 5 : 4}
                    className="px-5 py-12 text-center text-foreground-500"
                  >
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                items.map((item) =>
                  isIncoming ? (
                    <tr
                      key={item.id}
                      className="border-b border-background-100 hover:bg-background-50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.userAvatar ? (
                              <img
                                src={item.userAvatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-white">
                                {item.userName?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground-900 truncate">
                              {item.userName || "—"}
                            </p>
                            <p className="text-xs text-foreground-500 truncate">
                              {item.userEmail || "—"}
                            </p>
                            <p className="text-xs text-foreground-500 truncate md:hidden mt-0.5">
                              {item.companyName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-background-100 border border-background-200/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.companyLogo ? (
                              <img
                                src={item.companyLogo}
                                alt=""
                                className="w-5 h-5 object-contain"
                              />
                            ) : (
                              <i className="ri-building-line text-foreground-400 text-sm"></i>
                            )}
                          </span>
                          <Link
                            to={`/employer/companies/${item.companyId}`}
                            className="font-medium text-foreground-900 truncate hover:text-primary-500"
                          >
                            {item.companyName || "—"}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-foreground-600 max-w-[240px]">
                        <span className="line-clamp-2">
                          {item.message || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusClass(item.status)}`}
                        >
                          {t(`adminUi.status.${item.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {item.status === "PENDING" ? (
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              disabled={actingId === item.id}
                              onClick={() =>
                                void handleDecide(item, "APPROVED")
                              }
                              className="px-3 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-medium cursor-pointer disabled:opacity-60 min-h-[44px] sm:min-h-[36px]"
                            >
                              {t("company.approve")}
                            </button>
                            <button
                              type="button"
                              disabled={actingId === item.id}
                              onClick={() =>
                                void handleDecide(item, "REJECTED")
                              }
                              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium cursor-pointer disabled:opacity-60 min-h-[44px] sm:min-h-[36px]"
                            >
                              {t("company.reject")}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground-400">
                            {formatDateTime(item.updatedAt, i18n.language)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={item.id}
                      className="border-b border-background-100 hover:bg-background-50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-lg bg-background-100 border border-background-200/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.companyLogo ? (
                              <img
                                src={item.companyLogo}
                                alt=""
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <i className="ri-building-line text-foreground-400"></i>
                            )}
                          </span>
                          <span className="font-medium text-foreground-900 truncate">
                            {item.companyName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-foreground-600 max-w-[260px]">
                        <span className="line-clamp-2">
                          {item.message || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusClass(item.status)}`}
                        >
                          {t(`adminUi.status.${item.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-foreground-500 whitespace-nowrap">
                        {formatDateTime(item.createdAt, i18n.language)}
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && (
          <div className="p-12 text-center text-sm text-foreground-500">
            {t("company.noJoinRequests")}
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
