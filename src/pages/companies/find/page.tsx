import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AdminAuthError,
  createCompanyJoinRequest,
  fetchEmployerCompanies,
  resolveAdminAuthErrorMessage,
} from "@/api";
import type { EmployerCompany } from "@/types/company";
import { usePageShell } from "@/layouts/usePageShell";
import Pagination from "@/components/ui/Pagination";
import { companySizeLabelKey } from "@/constants/company";
import { toast } from "@/lib/toast";

const SEARCH_DEBOUNCE_MS = 400;

export default function FindCompanyPage() {
  const { t } = useTranslation();
  const { className: shell } = usePageShell();
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<EmployerCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [joinTarget, setJoinTarget] = useState<EmployerCompany | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = search.trim();
      setKeyword(next);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEmployerCompanies({
        mine: false,
        keyword: keyword || undefined,
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
  }, [keyword, currentPage, pageSize, t]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const sizeLabel = (size: string) => {
    const key = companySizeLabelKey(size);
    const translated = t(key);
    return translated === key ? size || "—" : translated;
  };

  const handleJoinSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!joinTarget || submitting) return;
    setSubmitting(true);
    try {
      await createCompanyJoinRequest(joinTarget.id, {
        message: joinMessage.trim(),
      });
      toast.success(t("company.joinRequestSent"));
      setJoinTarget(null);
      setJoinMessage("");
      await loadList();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.companyJoinRequestCreateFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={shell || undefined}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground-950">
            {t("company.findCompany")}
          </h2>
          <p className="text-sm text-foreground-500 mt-1">
            {t("company.findCompanyDesc")}
          </p>
        </div>
        <Link
          to="/employer/companies"
          className="inline-flex items-center gap-1.5 h-10 px-3 text-sm rounded-xl border border-background-200/70 bg-background-50 hover:bg-background-100 cursor-pointer"
        >
          <i className="ri-arrow-left-line"></i> {t("company.myCompanies")}
        </Link>
      </div>

      <div className="relative mb-4">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("company.findSearchPlaceholder")}
          className="w-full h-11 pl-10 pr-4 text-sm bg-background-50 border border-background-200/70 rounded-xl outline-none focus:border-primary-400"
        />
      </div>

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-background-200/70">
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.name").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.industry").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("dashboard.jobsTable.location").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("company.size").toUpperCase()}
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("dashboard.jobsTable.actions").toUpperCase()}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
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
                    className="border-b border-background-100 hover:bg-background-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
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
                        <div className="min-w-0">
                          <p className="font-medium text-foreground-900 truncate">
                            {company.name}
                          </p>
                          <p className="text-xs text-foreground-500 truncate">
                            {company.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-foreground-600 max-w-[180px]">
                      <span className="line-clamp-2">
                        {company.industries
                          .map((item) => item.name)
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-foreground-600 whitespace-nowrap">
                      {company.provinceName || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-foreground-600 whitespace-nowrap">
                      {sizeLabel(company.size)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setJoinTarget(company);
                          setJoinMessage("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 cursor-pointer min-h-[36px]"
                      >
                        <i className="ri-user-add-line"></i>
                        {t("company.requestAdmin")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && (
          <div className="p-12 text-center text-sm text-foreground-500">
            {keyword
              ? t("company.noCompanies")
              : t("company.findEmptyHint")}
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

      {joinTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !submitting && setJoinTarget(null)}
          ></div>
          <form
            onSubmit={handleJoinSubmit}
            className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-lg"
          >
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-1">
              {t("company.requestAdmin")}
            </h3>
            <p className="text-sm text-foreground-500 mb-4">
              {joinTarget.name}
            </p>
            <label className="block text-sm font-medium text-foreground-700 mb-1.5">
              {t("company.joinMessage")}
            </label>
            <textarea
              value={joinMessage}
              onChange={(event) => setJoinMessage(event.target.value)}
              rows={4}
              placeholder={t("company.joinMessagePlaceholder")}
              className="w-full px-3 py-2.5 text-sm border border-background-200 rounded-xl outline-none focus:border-primary-400 resize-y min-h-[100px]"
            />
            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 cursor-pointer disabled:opacity-60"
              >
                {submitting ? t("common.loading") : t("company.sendJoinRequest")}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setJoinTarget(null)}
                className="h-11 px-4 rounded-xl border border-background-300 text-sm cursor-pointer"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
