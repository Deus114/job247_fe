import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import LoadingSpinner from '@/components/base/LoadingSpinner';
import CustomSelect from '@/components/base/CustomSelect';

export default function CompaniesBrowsePage() {
  const companies = useAppSelector((state) => state.companies.items);
  const loading = useAppSelector((state) => state.companies.loading);
  const jobs = useAppSelector((state) => state.jobs.items);

  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const industries = useMemo(() => {
    const set = new Set(companies.filter((c) => c.status === 'approved').map((c) => c.industry));
    return Array.from(set).sort();
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies
      .filter((c) => c.status === 'approved' && c.isActive !== false)
      .filter((c) => {
        if (search) {
          const q = search.toLowerCase();
          return c.name.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q);
        }
        return true;
      })
      .filter((c) => {
        if (industryFilter) return c.industry === industryFilter;
        return true;
      });
  }, [companies, search, industryFilter]);

  const getCompanyJobCount = (companyId: string) => jobs.filter((j) => j.companyId === companyId && j.status === 'approved').length;

  return (
    <div className="min-h-screen pt-[70px] bg-background-100">
      <div className="relative bg-background-50 border-b border-background-200/60">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-heading font-bold text-foreground-950 mb-3">
              Khám phá các công ty hàng đầu
            </h1>
            <p className="text-sm md:text-base text-foreground-600 mb-6">
              Tìm hiểu về môi trường làm việc, văn hóa và cơ hội nghề nghiệp tại các doanh nghiệp uy tín trên toàn quốc
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm công ty theo tên hoặc ngành nghề..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
                />
              </div>
              <CustomSelect
                value={industryFilter}
                onChange={setIndustryFilter}
                options={[
                  { value: '', label: 'Tất cả ngành nghề' },
                  ...industries.map((ind) => ({ value: ind, label: ind })),
                ]}
                placeholder="Tất cả ngành nghề"
                className="min-w-[180px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-foreground-600">
            {loading ? 'Đang tải...' : (
              <>Hiển thị <strong className="text-foreground-950">{filteredCompanies.length}</strong> công ty</>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="bg-background-50 border border-background-200/70 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
              <i className="ri-building-2-line text-2xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              {search || industryFilter ? 'Không tìm thấy công ty phù hợp' : 'Chưa có công ty nào'}
            </h3>
            <p className="text-sm text-foreground-500">
              {search || industryFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Hiện chưa có công ty nào được duyệt trong hệ thống.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCompanies.map((company) => {
              const jobCount = getCompanyJobCount(company.id);
              return (
                <Link
                  key={company.id}
                  to={`/companies/${company.id}`}
                  className="bg-background-50 border border-background-200/70 rounded-2xl p-6 hover:border-primary-200 transition-all group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-xl bg-background-100 flex items-center justify-center mb-4 overflow-hidden border border-background-200/50 group-hover:border-primary-200 transition-colors">
                    <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain" />
                  </div>

                  <h3 className="font-heading text-base font-semibold text-foreground-950 mb-1 group-hover:text-primary-500 transition-colors line-clamp-1">
                    {company.name}
                  </h3>
                  <p className="text-xs text-foreground-500 mb-3 line-clamp-2">{company.description}</p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-foreground-500 mb-4">
                    <span className="flex items-center gap-1">
                      <i className="ri-price-tag-3-line"></i> {company.industry}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-group-line"></i> {company.size}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-map-pin-line"></i> {company.location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-background-200/40">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-accent-600">
                      <i className="ri-briefcase-line"></i> {jobCount} việc làm
                    </span>
                    <span className="flex items-center gap-1 text-xs text-primary-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Chi tiết <i className="ri-arrow-right-line"></i>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}