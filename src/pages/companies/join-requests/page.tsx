import {
  AdminAuthError,
  fetchMyCompanyJoinRequests,
  resolveAdminAuthErrorMessage,
} from "@/api";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import { usePageShell } from "@/layouts/usePageShell";
import { formatDateTime } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import type {
  CompanyJoinRequest,
  CompanyJoinRequestStatus,
} from "@/types/company";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

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

export default function MyJoinRequestsPage() {
  const { t, i18n } = useTranslation();
  const { className: shell } = usePageShell();
  const [items, setItems] = useState<CompanyJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyCompanyJoinRequests({
        status: statusFilter || undefined,
        page: currentPage,
        size: pageSize,
        sort: "createdAt,desc",
      });
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
  }, [statusFilter, currentPage, pageSize, t]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageSize]);

  return (
    <div className={shell || undefined}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground-950">
            {t("company.myJoinRequests")}
          </h2>
          <p className="text-sm text-foreground-500 mt-1">
            {t("company.myJoinRequestsDesc")}
          </p>
        </div>
        <Link
          to="/employer/companies/find"
          className="inline-flex items-center gap-1.5 h-10 px-3 text-sm rounded-xl bg-primary-500 text-white hover:bg-primary-600 cursor-pointer"
        >
          <i className="ri-search-eye-line"></i> {t("company.findCompany")}
        </Link>
      </div>

      <div className="mb-4 w-full sm:w-[200px]">
        <CustomSelect
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value as "" | CompanyJoinRequestStatus)
          }
          options={statusOptions}
          outlined
        />
      </div>

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-background-200/70">
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-foreground-500"
                  >
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
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
                ))
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
