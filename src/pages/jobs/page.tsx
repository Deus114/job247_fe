import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import JobCard from './components/JobCard';
import SkeletonCard from '@/components/base/SkeletonCard';
import FilterModal, { type FilterState } from './components/FilterModal';
import type { Job } from '@/store/slices/jobSlice';
import CustomSelect from '@/components/base/CustomSelect';

const JOBS_PER_PAGE = 9;

function parseSalaryRange(salary: string): [number, number] | null {
  const nums = salary.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(Number);
  if (values.length === 1) return [values[0], values[0]];
  return [values[0], values[1]];
}

function getSalaryAvg(job: Job): number {
  const parsed = parseSalaryRange(job.salary);
  if (!parsed) return 0;
  return (parsed[0] + parsed[1]) / 2;
}

export default function JobsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobsFromStore = useAppSelector((state) => state.jobs.items);
  const loading = useAppSelector((state) => state.jobs.loading);
  const categories = useAppSelector((state) => (state.jobs?.categories || []).filter((c: { name: string; isActive?: boolean }) => c.isActive !== false).map((c: { name: string }) => c.name));
  const educationLevels = useAppSelector((state) => (state.jobs?.educationLevels || []).filter((e: { name: string; isActive?: boolean }) => e.isActive !== false).map((e: { name: string }) => e.name));
  const locations = useAppSelector((state) => state.jobs?.locations || []);

  const companyNames = useMemo(() => {
    const set = new Set(jobsFromStore.filter((j) => j.status === 'approved' && !j.deletedAt && j.isActive !== false).map((j) => j.company));
    return Array.from(set).sort();
  }, [jobsFromStore]);

  const jobTypes = useMemo(() => {
    const set = new Set(jobsFromStore.filter((j) => j.status === 'approved' && !j.deletedAt && j.isActive !== false).map((j) => j.type));
    return Array.from(set);
  }, [jobsFromStore]);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedEducations, setSelectedEducations] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'salary_desc' | 'salary_asc'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    const cat = searchParams.get('categories');
    const loc = searchParams.get('locations');
    const edu = searchParams.get('educations');
    const typesParam = searchParams.get('types');
    const companiesParam = searchParams.get('companies');
    const kw = searchParams.get('keyword');
    const sMin = searchParams.get('salaryMin') || '';
    const sMax = searchParams.get('salaryMax') || '';
    const sort = searchParams.get('sort') as typeof sortBy;

    if (cat) setSelectedCategories(cat.split(',').filter(Boolean));
    if (loc) setSelectedLocations(loc.split(',').filter(Boolean));
    if (edu) setSelectedEducations(edu.split(',').filter(Boolean));
    if (typesParam) setSelectedTypes(typesParam.split(',').filter(Boolean));
    if (companiesParam) setSelectedCompanies(companiesParam.split(',').filter(Boolean));
    if (kw) setKeyword(kw);
    if (sMin) setSalaryMin(sMin);
    if (sMax) setSalaryMax(sMax);
    if (sort && ['newest', 'oldest', 'salary_desc', 'salary_asc'].includes(sort)) setSortBy(sort);
  }, [searchParams]);

  const filteredJobs = useMemo(() => {
    let result = jobsFromStore.filter((j) => j.status === 'approved' && !j.deletedAt && j.isActive !== false);

    if (keyword.trim()) {
      const kw = keyword.toLowerCase().trim();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(kw) ||
          j.company.toLowerCase().includes(kw) ||
          j.category.toLowerCase().includes(kw)
      );
    }

    if (selectedCompanies.length > 0) {
      result = result.filter((j) => selectedCompanies.includes(j.company));
    }
    if (selectedCategories.length > 0) {
      result = result.filter((j) => selectedCategories.includes(j.category));
    }
    if (selectedLocations.length > 0) {
      result = result.filter((j) => selectedLocations.includes(j.location));
    }
    if (selectedEducations.length > 0) {
      result = result.filter((j) => {
        const jobEdus = j.educationLevel.split(', ').map((e) => e.trim());
        return selectedEducations.some((sel) => jobEdus.includes(sel));
      });
    }
    if (selectedTypes.length > 0) {
      result = result.filter((j) => {
        const jobTypes = j.type.split(', ').map((t) => t.trim());
        return selectedTypes.some((sel) => jobTypes.includes(sel));
      });
    }

    if (salaryMin || salaryMax) {
      const min = salaryMin ? Number(salaryMin) : 0;
      const max = salaryMax ? Number(salaryMax) : Infinity;
      result = result.filter((j) => {
        const parsed = parseSalaryRange(j.salary);
        if (!parsed) return true;
        const [jobMin, jobMax] = parsed;
        return jobMax >= min && jobMin <= max;
      });
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'salary_desc':
        result.sort((a, b) => getSalaryAvg(b) - getSalaryAvg(a));
        break;
      case 'salary_asc':
        result.sort((a, b) => getSalaryAvg(a) - getSalaryAvg(b));
        break;
    }

    return result;
  }, [jobsFromStore, keyword, selectedCategories, selectedLocations, selectedEducations, selectedTypes, salaryMin, salaryMax, sortBy]);

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  const activeFilterCount =
    selectedCategories.length +
    selectedLocations.length +
    selectedEducations.length +
    selectedTypes.length +
    selectedCompanies.length +
    (salaryMin || salaryMax ? 1 : 0);

  const hasFilter = activeFilterCount > 0 || keyword.trim().length > 0;

  const syncUrl = (
    kw: string,
    cats: string[],
    locs: string[],
    edus: string[],
    typesArr: string[],
    companiesArr: string[],
    sMin: string,
    sMax: string,
    sort: typeof sortBy,
    page: number
  ) => {
    const params = new URLSearchParams();
    if (kw.trim()) params.set('keyword', kw.trim());
    if (cats.length) params.set('categories', cats.join(','));
    if (locs.length) params.set('locations', locs.join(','));
    if (edus.length) params.set('educations', edus.join(','));
    if (typesArr.length) params.set('types', typesArr.join(','));
    if (companiesArr.length) params.set('companies', companiesArr.join(','));
    if (sMin) params.set('salaryMin', sMin);
    if (sMax) params.set('salaryMax', sMax);
    if (sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    syncUrl(keyword, selectedCategories, selectedLocations, selectedEducations, selectedTypes, selectedCompanies, salaryMin, salaryMax, sortBy, 1);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setSelectedCategories(filters.categories);
    setSelectedLocations(filters.locations);
    setSelectedEducations(filters.educations);
    setSelectedTypes(filters.types);
    setSelectedCompanies(filters.companies);
    setSalaryMin(filters.salaryMin);
    setSalaryMax(filters.salaryMax);
    setCurrentPage(1);
    syncUrl(keyword, filters.categories, filters.locations, filters.educations, filters.types, filters.companies, filters.salaryMin, filters.salaryMax, sortBy, 1);
  };

  const handleClearFilter = () => {
    setKeyword('');
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedEducations([]);
    setSelectedTypes([]);
    setSelectedCompanies([]);
    setSalaryMin('');
    setSalaryMax('');
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const removeFilter = (key: 'categories' | 'locations' | 'educations' | 'types' | 'companies' | 'salary', value?: string) => {
    let newCats = selectedCategories;
    let newLocs = selectedLocations;
    let newEdus = selectedEducations;
    let newTypes = selectedTypes;
    let newCompanies = selectedCompanies;
    let newMin = salaryMin;
    let newMax = salaryMax;

    if (key === 'categories' && value) newCats = newCats.filter((v) => v !== value);
    if (key === 'locations' && value) newLocs = newLocs.filter((v) => v !== value);
    if (key === 'educations' && value) newEdus = newEdus.filter((v) => v !== value);
    if (key === 'types' && value) newTypes = newTypes.filter((v) => v !== value);
    if (key === 'companies' && value) newCompanies = newCompanies.filter((v) => v !== value);
    if (key === 'salary') { newMin = ''; newMax = ''; }

    setSelectedCategories(newCats);
    setSelectedLocations(newLocs);
    setSelectedEducations(newEdus);
    setSelectedTypes(newTypes);
    setSelectedCompanies(newCompanies);
    setSalaryMin(newMin);
    setSalaryMax(newMax);
    setCurrentPage(1);
    syncUrl(keyword, newCats, newLocs, newEdus, newTypes, newCompanies, newMin, newMax, sortBy, 1);
  };

  const handleSortChange = (val: typeof sortBy) => {
    setSortBy(val);
    setCurrentPage(1);
    syncUrl(keyword, selectedCategories, selectedLocations, selectedEducations, selectedTypes, selectedCompanies, salaryMin, salaryMax, val, 1);
  };

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'salary_desc', label: 'Lương cao nhất' },
    { value: 'salary_asc', label: 'Lương thấp nhất' },
  ];

  return (
    <div className="min-h-screen pt-[70px]">
      {/* Header + Search */}
      <div className="bg-background-100 border-b border-background-200/70">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('nav.jobs')}</h1>
          <p className="text-sm text-foreground-600 mt-1">
            {loading ? 'Đang tải...' : `${filteredJobs.length} ${t('job.results')}`}
          </p>

          <form onSubmit={handleSearch} className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400 text-lg"></i>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full pl-11 pr-4 py-3 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 justify-center"
            >
              <i className="ri-search-line"></i> {t('job.search')}
            </button>
          </form>
        </div>
      </div>

      {/* Filters + Results */}
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter button */}
            <button
              onClick={() => setFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-background-200/70 rounded-xl text-sm text-foreground-700 hover:bg-background-100 hover:border-primary-300 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-equalizer-line"></i> Bộ lọc
              {activeFilterCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary-500 text-white text-[11px] flex items-center justify-center font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Active filter tags */}
            <div className="flex flex-wrap gap-2">
              {selectedCompanies.map((company) => (
                <span
                  key={`comp-${company}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full whitespace-nowrap border border-primary-200/50"
                >
                  <i className="ri-building-line text-[10px]"></i> {company}
                  <button
                    onClick={() => removeFilter('companies', company)}
                    className="cursor-pointer hover:text-primary-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {selectedCategories.map((cat) => (
                <span
                  key={`cat-${cat}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap"
                >
                  {cat}
                  <button
                    onClick={() => removeFilter('categories', cat)}
                    className="cursor-pointer hover:text-primary-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {selectedLocations.map((loc) => (
                <span
                  key={`loc-${loc}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-100 text-accent-700 text-xs font-medium rounded-full whitespace-nowrap"
                >
                  {loc}
                  <button
                    onClick={() => removeFilter('locations', loc)}
                    className="cursor-pointer hover:text-accent-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {selectedEducations.map((edu) => (
                <span
                  key={`edu-${edu}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full whitespace-nowrap"
                >
                  {edu}
                  <button
                    onClick={() => removeFilter('educations', edu)}
                    className="cursor-pointer hover:text-secondary-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {selectedTypes.map((tp) => (
                <span
                  key={`type-${tp}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full whitespace-nowrap border border-primary-200/50"
                >
                  {tp}
                  <button
                    onClick={() => removeFilter('types', tp)}
                    className="cursor-pointer hover:text-primary-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
              {(salaryMin || salaryMax) && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-50 text-accent-600 text-xs font-medium rounded-full whitespace-nowrap border border-accent-200/50">
                  {salaryMin || '0'} - {salaryMax || '∞'} triệu
                  <button
                    onClick={() => removeFilter('salary')}
                    className="cursor-pointer hover:text-accent-900 w-4 h-4 flex items-center justify-center"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              )}
              {hasFilter && (
                <button
                  onClick={handleClearFilter}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground-500 hover:text-primary-500 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-refresh-line"></i> Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Sort dropdown - custom */}
          <CustomSelect
            value={sortBy}
            options={sortOptions}
            onChange={(val) => handleSortChange(val as typeof sortBy)}
            className="w-full sm:w-[180px]"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: JOBS_PER_PAGE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
              <i className="ri-file-search-line text-3xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">{t('job.noResults')}</h3>
            <p className="text-sm text-foreground-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <button
              onClick={handleClearFilter}
              className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('job.clearFilter')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-product-shop="">
              {paginatedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    syncUrl(keyword, selectedCategories, selectedLocations, selectedEducations, selectedTypes, selectedCompanies, salaryMin, salaryMax, sortBy, Math.max(1, currentPage - 1));
                  }}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-background-200/70 text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <i className="ri-arrow-left-s-line"></i>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      syncUrl(keyword, selectedCategories, selectedLocations, selectedEducations, selectedTypes, selectedCompanies, salaryMin, salaryMax, sortBy, page);
                    }}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                        : 'text-foreground-600 hover:bg-background-100 border border-background-200/70'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    syncUrl(keyword, selectedCategories, selectedLocations, selectedEducations, selectedTypes, selectedCompanies, salaryMin, salaryMax, sortBy, Math.min(totalPages, currentPage + 1));
                  }}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-background-200/70 text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <i className="ri-arrow-right-s-line"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        categories={categories}
        locations={locations}
        educationLevels={educationLevels}
        types={jobTypes}
        companies={companyNames}
        filters={{
          categories: selectedCategories,
          locations: selectedLocations,
          educations: selectedEducations,
          types: selectedTypes,
          companies: selectedCompanies,
          salaryMin,
          salaryMax,
        }}
        onApply={handleApplyFilters}
        onClear={handleClearFilter}
      />
    </div>
  );
}