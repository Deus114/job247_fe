import {
  fetchPublicEducationLevels,
  fetchPublicIndustryGroups,
  fetchPublicJobs,
  fetchPublicProvinces,
} from "@/api";
import Pagination from "@/components/ui/Pagination";
import SkeletonCard from "@/components/ui/SkeletonCard";
import {
  EMPLOYMENT_TYPE_VALUES,
  employmentTypeLabelKey,
} from "@/constants/employerJob";
import { useAuth } from "@/features/auth";
import {
  FilterModal,
  JobCard,
  JobPreviewPanel,
  useJobs,
  type FilterState,
} from "@/features/jobs";
import {
  expandIndustryGroupIds,
  resolveIndustrySelection,
} from "@/lib/industryFilter";
import type {
  PublicEducationLevel,
  PublicIndustryGroup,
  PublicProvince,
} from "@/types/catalog";
import type { Job } from "@/types/job";
import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

const JOBS_PER_PAGE = 9;

type SortKey = "newest" | "oldest" | "salary_desc" | "salary_asc";

const SORT_QUERY: Record<SortKey, string> = {
  newest: "createdAt,DESC",
  oldest: "createdAt,ASC",
  salary_desc: "salaryMax,DESC",
  salary_asc: "salaryMin,ASC",
};

function parseIdList(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
}

function salaryQueryBound(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n) * 1_000_000;
}

export default function JobsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { locations: storeLocations } = useJobs();

  const [industryGroups, setIndustryGroups] = useState<PublicIndustryGroup[]>(
    [],
  );
  const [provinces, setProvinces] = useState<PublicProvince[]>([]);
  const [educationLevels, setEducationLevels] = useState<
    PublicEducationLevel[]
  >([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [appliedKeyword, setAppliedKeyword] = useState(
    searchParams.get("keyword") || "",
  );
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedEducationIds, setSelectedEducationIds] = useState<string[]>(
    [],
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [urlProvinceIds, setUrlProvinceIds] = useState<number[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const locationOptions = useMemo(() => {
    if (provinces.length > 0) return provinces.map((p) => p.name);
    return storeLocations;
  }, [provinces, storeLocations]);

  const employmentTypeOptions = useMemo(
    () =>
      EMPLOYMENT_TYPE_VALUES.map((value) => t(employmentTypeLabelKey(value))),
    [t],
  );

  const industryById = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of industryGroups) {
      for (const industry of group.industries) {
        map.set(String(industry.id), industry.name);
      }
    }
    return map;
  }, [industryGroups]);

  const educationById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of educationLevels) {
      map.set(String(item.id), item.name);
    }
    return map;
  }, [educationLevels]);

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
    let cancelled = false;
    void fetchPublicProvinces({ page: 1, size: 100, sort: "sortOrder,ASC" })
      .then((res) => {
        if (!cancelled) setProvinces(res.data);
      })
      .catch(() => {
        if (!cancelled) setProvinces([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicEducationLevels({
      page: 1,
      size: 100,
      sort: "sortOrder,ASC",
    })
      .then((res) => {
        if (!cancelled) setEducationLevels(res.data);
      })
      .catch(() => {
        if (!cancelled) setEducationLevels([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hydrate filters from URL (after industry groups load for group expansion).
  useEffect(() => {
    const loc = searchParams.get("locations");
    const typesParam = searchParams.get("types");
    const kw = searchParams.get("keyword");
    const sMin = searchParams.get("salaryMin") || "";
    const sMax = searchParams.get("salaryMax") || "";
    const sort = searchParams.get("sort") as SortKey | null;
    const page = Number(searchParams.get("page") || "1");
    const groupIds = parseIdList(searchParams.get("industryGroupIds"));
    const industryIds = parseIdList(searchParams.get("industryIds"));
    const provinceIds = parseIdList(searchParams.get("provinceIds"));
    const educationIds = parseIdList(searchParams.get("educationLevelIds"));

    const expandedFromGroups = expandIndustryGroupIds(industryGroups, groupIds);
    const mergedIndustryIds = Array.from(
      new Set([...industryIds, ...expandedFromGroups].map(String)),
    );

    setSelectedIndustryIds(mergedIndustryIds);
    setSelectedLocations(loc ? loc.split(",").filter(Boolean) : []);
    setSelectedEducationIds(educationIds.map(String));
    setSelectedTypes(typesParam ? typesParam.split(",").filter(Boolean) : []);
    setKeyword(kw || "");
    setAppliedKeyword(kw || "");
    setSalaryMin(sMin);
    setSalaryMax(sMax);
    if (sort && sort in SORT_QUERY) setSortBy(sort);
    else setSortBy("newest");
    setCurrentPage(Number.isFinite(page) && page > 0 ? page : 1);
    setUrlProvinceIds(provinceIds);
  }, [searchParams, industryGroups]);

  const resolvedIndustry = useMemo(
    () => resolveIndustrySelection(industryGroups, selectedIndustryIds),
    [industryGroups, selectedIndustryIds],
  );

  const provinceIds = useMemo(() => {
    const fromNames = provinces
      .filter((p) => selectedLocations.includes(p.name))
      .map((p) => p.id);
    return Array.from(new Set([...urlProvinceIds, ...fromNames]));
  }, [provinces, selectedLocations, urlProvinceIds]);

  const educationLevelIds = useMemo(
    () =>
      selectedEducationIds
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0),
    [selectedEducationIds],
  );

  const employmentTypes = useMemo(() => {
    return EMPLOYMENT_TYPE_VALUES.filter((value) =>
      selectedTypes.includes(t(employmentTypeLabelKey(value))),
    );
  }, [selectedTypes, t]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPublicJobs({
      keyword: appliedKeyword.trim() || undefined,
      industryGroupIds:
        resolvedIndustry.industryGroupIds.length > 0
          ? resolvedIndustry.industryGroupIds
          : undefined,
      industryIds:
        resolvedIndustry.industryIds.length > 0
          ? resolvedIndustry.industryIds
          : undefined,
      provinceIds: provinceIds.length > 0 ? provinceIds : undefined,
      educationLevelIds:
        educationLevelIds.length > 0 ? educationLevelIds : undefined,
      employmentTypes:
        employmentTypes.length > 0 ? [...employmentTypes] : undefined,
      salaryFrom: salaryQueryBound(salaryMin),
      salaryTo: salaryQueryBound(salaryMax),
      page: currentPage,
      size: JOBS_PER_PAGE,
      sort: SORT_QUERY[sortBy],
    })
      .then((res) => {
        if (cancelled) return;
        setJobs(res.data);
        setTotalItems(res.pagination.total);
        setTotalPages(
          Math.max(
            1,
            res.pagination.last_page ||
              Math.ceil(res.pagination.total / JOBS_PER_PAGE) ||
              1,
          ),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setJobs([]);
        setTotalItems(0);
        setTotalPages(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    appliedKeyword,
    resolvedIndustry,
    provinceIds,
    educationLevelIds,
    employmentTypes,
    salaryMin,
    salaryMax,
    currentPage,
    sortBy,
    isAuthenticated,
  ]);

  const displayedJobs = jobs;

  useEffect(() => {
    if (displayedJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    setSelectedJobId((prev) =>
      prev && displayedJobs.some((j) => j.id === prev)
        ? prev
        : displayedJobs[0].id,
    );
  }, [displayedJobs]);

  const selectedJob = useMemo(
    () => displayedJobs.find((j) => j.id === selectedJobId) ?? null,
    [displayedJobs, selectedJobId],
  );

  const activeFilterCount =
    selectedIndustryIds.length +
    selectedLocations.length +
    selectedEducationIds.length +
    selectedTypes.length +
    urlProvinceIds.length +
    (salaryMin || salaryMax ? 1 : 0) +
    (appliedKeyword ? 1 : 0);

  const hasFilter = activeFilterCount > 0;

  const syncUrl = (next: {
    kw?: string;
    industryIds?: string[];
    locs?: string[];
    educationIds?: string[];
    typesArr?: string[];
    sMin?: string;
    sMax?: string;
    sort?: SortKey;
    page?: number;
    provIds?: number[];
  }) => {
    const kw = next.kw ?? keyword;
    const industryIds = next.industryIds ?? selectedIndustryIds;
    const locs = next.locs ?? selectedLocations;
    const educationIds = next.educationIds ?? selectedEducationIds;
    const typesArr = next.typesArr ?? selectedTypes;
    const sMin = next.sMin ?? salaryMin;
    const sMax = next.sMax ?? salaryMax;
    const sort = next.sort ?? sortBy;
    const page = next.page ?? currentPage;
    const provIds = next.provIds ?? urlProvinceIds;

    const resolved = resolveIndustrySelection(industryGroups, industryIds);

    const params = new URLSearchParams();
    if (kw.trim()) params.set("keyword", kw.trim());
    if (resolved.industryGroupIds.length) {
      params.set("industryGroupIds", resolved.industryGroupIds.join(","));
    }
    if (resolved.industryIds.length) {
      params.set("industryIds", resolved.industryIds.join(","));
    }
    if (locs.length) params.set("locations", locs.join(","));
    if (educationIds.length) {
      params.set("educationLevelIds", educationIds.join(","));
    }
    if (typesArr.length) params.set("types", typesArr.join(","));
    if (sMin) params.set("salaryMin", sMin);
    if (sMax) params.set("salaryMax", sMax);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (provIds.length) params.set("provinceIds", provIds.join(","));
    setSearchParams(params);
  };

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAppliedKeyword(keyword.trim());
    setCurrentPage(1);
    syncUrl({ kw: keyword.trim(), page: 1 });
  };

  const handleApplyFilters = (filters: FilterState) => {
    setSelectedIndustryIds(filters.industryIds);
    setSelectedLocations(filters.locations);
    setSelectedEducationIds(filters.educationIds);
    setSelectedTypes(filters.types);
    setSalaryMin(filters.salaryMin);
    setSalaryMax(filters.salaryMax);
    setUrlProvinceIds([]);
    setCurrentPage(1);
    syncUrl({
      industryIds: filters.industryIds,
      locs: filters.locations,
      educationIds: filters.educationIds,
      typesArr: filters.types,
      sMin: filters.salaryMin,
      sMax: filters.salaryMax,
      page: 1,
      provIds: [],
    });
  };

  const handleClearFilter = () => {
    setKeyword("");
    setAppliedKeyword("");
    setSelectedIndustryIds([]);
    setSelectedLocations([]);
    setSelectedEducationIds([]);
    setSelectedTypes([]);
    setSalaryMin("");
    setSalaryMax("");
    setSortBy("newest");
    setCurrentPage(1);
    setUrlProvinceIds([]);
    setSearchParams({});
  };

  const removeFilter = (
    key:
      | "industry"
      | "locations"
      | "educations"
      | "types"
      | "salary"
      | "provinceIds",
    value?: string,
  ) => {
    let newIndustryIds = selectedIndustryIds;
    let newLocs = selectedLocations;
    let newEducationIds = selectedEducationIds;
    let newTypes = selectedTypes;
    let newMin = salaryMin;
    let newMax = salaryMax;
    let newProvIds = urlProvinceIds;

    if (key === "industry" && value) {
      newIndustryIds = newIndustryIds.filter((v) => v !== value);
    }
    if (key === "locations" && value)
      newLocs = newLocs.filter((v) => v !== value);
    if (key === "educations" && value)
      newEducationIds = newEducationIds.filter((v) => v !== value);
    if (key === "types" && value)
      newTypes = newTypes.filter((v) => v !== value);
    if (key === "salary") {
      newMin = "";
      newMax = "";
    }
    if (key === "provinceIds") newProvIds = [];

    setSelectedIndustryIds(newIndustryIds);
    setSelectedLocations(newLocs);
    setSelectedEducationIds(newEducationIds);
    setSelectedTypes(newTypes);
    setSalaryMin(newMin);
    setSalaryMax(newMax);
    setUrlProvinceIds(newProvIds);
    setCurrentPage(1);
    syncUrl({
      industryIds: newIndustryIds,
      locs: newLocs,
      educationIds: newEducationIds,
      typesArr: newTypes,
      sMin: newMin,
      sMax: newMax,
      page: 1,
      provIds: newProvIds,
    });
  };

  const handleSortChange = (val: SortKey) => {
    setSortBy(val);
    setCurrentPage(1);
    syncUrl({ sort: val, page: 1 });
  };

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(next);
    syncUrl({ page: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortOptions = [
    { value: "newest", label: t("job.sortNewest") },
    { value: "oldest", label: t("job.sortOldest") },
    { value: "salary_desc", label: t("job.sortSalaryDesc") },
    { value: "salary_asc", label: t("job.sortSalaryAsc") },
  ];

  const provinceFilterLabels = useMemo(() => {
    if (urlProvinceIds.length === 0) return [];
    return urlProvinceIds.map((id) => {
      const found = provinces.find((p) => p.id === id);
      return found?.name || `#${id}`;
    });
  }, [provinces, urlProvinceIds]);

  return (
    <div className="min-h-screen pt-[70px] bg-background-100/60">
      <div className="bg-primary-50/80 border-b border-primary-100">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 md:py-5">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-2.5 bg-background-50 border border-background-200 rounded-xl shadow-sm"
          >
            <div className="flex-1 relative min-w-0">
              <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 text-lg"></i>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("hero.searchPlaceholder")}
                className="w-full pl-10 pr-3 py-2.5 text-sm text-foreground-900 bg-transparent border-0 outline-none focus:ring-0 min-h-[44px]"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFilterModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-primary-600 bg-primary-100 hover:bg-primary-200/70 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <i className="ri-equalizer-line"></i>
                <span className="hidden sm:inline">{t("job.filter")}</span>
                {activeFilterCount > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[11px] flex items-center justify-center font-semibold">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 justify-center min-h-[44px]"
              >
                {t("job.search")}
              </button>
            </div>
          </form>

          {(hasFilter || activeFilterCount > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {selectedIndustryIds.map((id) => (
                <span
                  key={`ind-${id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-background-50 border border-primary-200 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap"
                >
                  {industryById.get(id) || `#${id}`}
                  <button
                    type="button"
                    onClick={() => removeFilter("industry", id)}
                    className="cursor-pointer hover:text-primary-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {provinceFilterLabels.map((label) => (
                <span
                  key={`prov-${label}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-background-50 border border-accent-200 text-accent-700 text-xs font-medium rounded-full whitespace-nowrap"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeFilter("provinceIds")}
                    className="cursor-pointer hover:text-accent-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {selectedLocations.map((loc) => (
                <span
                  key={`loc-${loc}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-background-50 border border-accent-200 text-accent-700 text-xs font-medium rounded-full whitespace-nowrap"
                >
                  {loc}
                  <button
                    type="button"
                    onClick={() => removeFilter("locations", loc)}
                    className="cursor-pointer hover:text-accent-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {selectedEducationIds.map((id) => (
                <span
                  key={`edu-${id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-background-50 border border-secondary-200 text-secondary-700 text-xs font-medium rounded-full whitespace-nowrap"
                >
                  {educationById.get(id) || `#${id}`}
                  <button
                    type="button"
                    onClick={() => removeFilter("educations", id)}
                    className="cursor-pointer hover:text-secondary-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {selectedTypes.map((tp) => (
                <span
                  key={`type-${tp}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-background-50 border border-primary-200 text-primary-600 text-xs font-medium rounded-full whitespace-nowrap"
                >
                  {tp}
                  <button
                    type="button"
                    onClick={() => removeFilter("types", tp)}
                    className="cursor-pointer hover:text-primary-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {(salaryMin || salaryMax) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-background-50 border border-accent-200 text-accent-600 text-xs font-medium rounded-full whitespace-nowrap">
                  {salaryMin || "0"} - {salaryMax || "∞"}{" "}
                  {t("job.salaryMillion")}
                  <button
                    type="button"
                    onClick={() => removeFilter("salary")}
                    className="cursor-pointer hover:text-accent-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              )}
              {hasFilter ? (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-foreground-500 hover:text-primary-500 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-refresh-line"></i> {t("job.clearFilter")}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground-500 mr-1">
              {t("job.sortBy")}:
            </span>
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSortChange(opt.value as SortKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap min-h-[36px] ${
                  sortBy === opt.value
                    ? "bg-primary-500 border-primary-500 text-background-50 dark:text-foreground-950"
                    : "bg-background-50 border-background-200 text-foreground-600 hover:border-primary-300 hover:text-primary-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-foreground-700">
            {loading
              ? t("common.loading")
              : `${totalItems} ${t("job.results")}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="hidden lg:block lg:col-span-7">
              <SkeletonCard />
            </div>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="text-center py-16 bg-background-50 border border-background-200 rounded-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-file-search-line text-2xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              {t("job.noResults")}
            </h3>
            <p className="text-sm text-foreground-500 mb-5">
              {t("job.tryChangeFilter")}
            </p>
            <button
              type="button"
              onClick={handleClearFilter}
              className="px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              {t("job.clearFilter")}
            </button>
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
              data-product-shop=""
            >
              <div className="lg:col-span-5 space-y-3">
                {displayedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    compact
                    selected={job.id === selectedJobId}
                    onSelect={() => setSelectedJobId(job.id)}
                  />
                ))}
              </div>
              <div className="lg:col-span-7">
                {selectedJob ? <JobPreviewPanel job={selectedJob} /> : null}
              </div>
            </div>

            {totalItems > 0 ? (
              <div className="mt-6 bg-background-50 border border-background-200 rounded-xl overflow-hidden">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={JOBS_PER_PAGE}
                  totalItems={totalItems}
                  onPageChange={goToPage}
                  hidePageSize
                  className="border-t-0"
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        industryGroups={industryGroups}
        locations={locationOptions}
        educationLevels={educationLevels}
        types={employmentTypeOptions}
        filters={{
          industryIds: selectedIndustryIds,
          locations: selectedLocations,
          educationIds: selectedEducationIds,
          types: selectedTypes,
          salaryMin,
          salaryMax,
        }}
        onApply={handleApplyFilters}
        onClear={handleClearFilter}
      />
    </div>
  );
}
