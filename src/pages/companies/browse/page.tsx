import { fetchPublicCompanies, fetchPublicIndustryGroups } from "@/api";
import CustomSelect from "@/components/ui/CustomSelect";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import MultiSelect from "@/components/ui/MultiSelect";
import Pagination from "@/components/ui/Pagination";
import { companySizeLabelKey, companySizeValues } from "@/constants/company";
import { resolveIndustrySelection } from "@/lib/industryFilter";
import { companyPath } from "@/lib/paths";
import type { ApiPagination, PublicIndustryGroup } from "@/types/catalog";
import type { Company } from "@/types/company";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const COMPANIES_PER_PAGE = 9;

const emptyPagination: ApiPagination = {
  current_page: 1,
  last_page: 1,
  per_page: COMPANIES_PER_PAGE,
  total: 0,
  from: 0,
  to: 0,
};

export default function CompaniesBrowsePage() {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState("");
  const [industryGroups, setIndustryGroups] = useState<PublicIndustryGroup[]>(
    [],
  );
  const [page, setPage] = useState(1);

  const industrySelectGroups = useMemo(
    () =>
      industryGroups.map((group) => ({
        label: group.name,
        options: group.industries.map((ind) => ({
          value: String(ind.id),
          label: ind.name,
        })),
      })),
    [industryGroups],
  );

  const sizeOptions = useMemo(
    () => [
      { value: "", label: t("common.all") },
      ...companySizeValues.map((size) => ({
        value: size,
        label: t(companySizeLabelKey(size)),
      })),
    ],
    [t],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchPublicIndustryGroups({ page: 1, size: 100 })
      .then((res) => {
        if (!cancelled) setIndustryGroups(res.data);
      })
      .catch(() => {
        if (!cancelled) setIndustryGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const resolved = resolveIndustrySelection(
      industryGroups,
      selectedIndustryIds,
    );
    void fetchPublicCompanies({
      keyword: keyword || undefined,
      industryGroupIds:
        resolved.industryGroupIds.length > 0
          ? resolved.industryGroupIds
          : undefined,
      industryIds:
        resolved.industryIds.length > 0 ? resolved.industryIds : undefined,
      companySize: companySize || undefined,
      page,
      size: COMPANIES_PER_PAGE,
      sort: "createdAt,DESC",
    })
      .then((res) => {
        if (cancelled) return;
        setCompanies(res.data);
        setPagination(res.pagination);
      })
      .catch(() => {
        if (!cancelled) {
          setCompanies([]);
          setPagination(emptyPagination);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keyword, selectedIndustryIds, companySize, page, industryGroups]);

  const clearFilters = () => {
    setSearch("");
    setKeyword("");
    setSelectedIndustryIds([]);
    setCompanySize("");
    setPage(1);
  };

  const hasFilter =
    keyword.length > 0 ||
    selectedIndustryIds.length > 0 ||
    companySize.length > 0;

  const sizeLabel = (size: string) => {
    const key = companySizeLabelKey(size);
    const label = t(key);
    return label === key ? size : label;
  };

  return (
    <div className="min-h-screen pt-[70px] bg-background-100/60">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-5 md:py-7">
        <div className="mb-5 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary-600">
            {t("company.discoverTitle")}
          </h1>
          <p className="text-sm md:text-base text-foreground-600 mt-1.5 max-w-2xl">
            {t("company.browseDesc")}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2 p-2 sm:p-2.5 bg-background-50 border border-background-200 rounded-xl shadow-sm">
          <div className="relative flex-1 min-w-0">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 text-lg"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("company.searchPlaceholder")}
              className="w-full pl-10 pr-3 py-2.5 text-sm text-foreground-900 bg-transparent border-0 outline-none focus:ring-0 min-h-[44px]"
            />
          </div>
          <MultiSelect
            values={selectedIndustryIds}
            onChange={(values) => {
              setSelectedIndustryIds(values);
              setPage(1);
            }}
            groups={industrySelectGroups}
            placeholder={t("company.industryFilter")}
            className="w-full md:w-[220px] lg:w-[260px] shrink-0"
            outlined
            hideChips
          />
          <CustomSelect
            value={companySize}
            onChange={(value) => {
              setCompanySize(value);
              setPage(1);
            }}
            options={sizeOptions}
            className="w-full md:w-[150px] shrink-0"
            outlined
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 mb-4">
          <h2 className="text-base md:text-lg font-heading font-bold text-primary-600">
            {loading
              ? t("company.browse")
              : t("company.topCompanies", { count: pagination.total })}
          </h2>
          {hasFilter ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-foreground-500 hover:text-primary-500 cursor-pointer whitespace-nowrap min-h-[36px]"
            >
              <i className="ri-refresh-line mr-1"></i>
              {t("job.clearFilter")}
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16 bg-background-50 border border-background-200 rounded-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-building-line text-2xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              {t("company.noCompanies")}
            </h3>
            <p className="text-sm text-foreground-500 mb-5">
              {t("company.noCompaniesDesc")}
            </p>
            {hasFilter ? (
              <button
                type="button"
                onClick={clearFilters}
                className="px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                {t("job.clearFilter")}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => {
                const desc =
                  company.description.replace(/<[^>]*>/g, " ").trim() || "";
                return (
                  <Link
                    key={company.id}
                    to={companyPath(company)}
                    className="group flex flex-col bg-background-50 border border-background-200 rounded-xl overflow-hidden hover:border-primary-400 hover:shadow-md hover:shadow-primary-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <div className="h-28 bg-background-100 overflow-hidden shrink-0">
                      {company.banner ? (
                        <img
                          src={company.banner}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 via-background-100 to-accent-100" />
                      )}
                    </div>

                    <div className="flex flex-col flex-1 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 -mt-8 rounded-lg bg-background-50 border border-background-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 relative z-10 ring-2 ring-background-50">
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt=""
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <i className="ri-building-line text-foreground-400"></i>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <h3 className="font-heading text-[15px] font-semibold text-primary-600 truncate group-hover:text-primary-500 transition-colors">
                            {company.name}
                          </h3>
                          {company.industry ? (
                            <p className="text-xs text-foreground-500 mt-0.5 truncate">
                              {company.industry}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <p className="text-xs text-foreground-500 mt-3 line-clamp-2 min-h-[2.5rem]">
                        {desc || "—"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-500">
                        <span className="inline-flex items-center gap-1 min-w-0">
                          <i className="ri-map-pin-line text-primary-500 shrink-0"></i>
                          <span className="truncate">
                            {company.location || company.address || "—"}
                          </span>
                        </span>
                        {company.size ? (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <i className="ri-team-line text-accent-500 shrink-0"></i>
                            {sizeLabel(company.size)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-auto pt-3">
                        <span className="inline-flex items-center justify-center w-full min-h-[40px] px-3 rounded-lg border border-primary-300 text-sm font-medium text-primary-600 group-hover:bg-primary-50 transition-colors">
                          {t("company.viewCompany")}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {pagination.total > 0 ? (
              <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
                <Pagination
                  currentPage={pagination.current_page || page}
                  totalPages={Math.max(1, pagination.last_page)}
                  pageSize={COMPANIES_PER_PAGE}
                  totalItems={pagination.total}
                  onPageChange={setPage}
                  hidePageSize
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
