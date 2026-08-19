import { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateApplicationStatus, type Application } from '@/store/slices/applicationsSlice';
import ColumnVisibilityDropdown from '@/components/base/ColumnVisibilityDropdown';
import Pagination from '@/components/base/Pagination';
import CustomSelect from '@/components/base/CustomSelect';

const PAGE_SIZE_DEFAULT = 20;

const jobStatusLabel: Record<string, string> = {
  approved: 'Đang tuyển',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
};

const jobStatusColor: Record<string, string> = {
  approved: 'bg-accent-100 text-accent-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

const appStatusLabel: Record<string, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem',
  accepted: 'Chấp nhận',
  rejected: 'Từ chối',
};

const appStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  reviewing: 'bg-accent-100 text-accent-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const JOB_COLUMNS = [
  { key: 'title', label: 'Tiêu đề' },
  { key: 'company', label: 'Công ty' },
  { key: 'category', label: 'Ngành nghề' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'salary', label: 'Lương' },
  { key: 'createdAt', label: 'Ngày đăng' },
  { key: 'deadline', label: 'Hạn nộp' },
  { key: 'status', label: 'Trạng thái' },
];

const APP_COLUMNS = [
  { key: 'fullName', label: 'Ứng viên' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Điện thoại' },
  { key: 'jobTitle', label: 'Vị trí' },
  { key: 'appliedAt', label: 'Ngày ứng tuyển' },
  { key: 'cvFileName', label: 'CV' },
  { key: 'status', label: 'Trạng thái' },
];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const jobs = useAppSelector((state) => state.jobs.items);
  const companies = useAppSelector((state) => state.companies.items);
  const allApplications = useAppSelector((state) => state.applications.items);

  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');

  // Jobs tab state
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [jobCompanyFilter, setJobCompanyFilter] = useState('');
  const [jobVisibleColumns, setJobVisibleColumns] = useState<string[]>(JOB_COLUMNS.map((c) => c.key));
  const [jobPage, setJobPage] = useState(1);
  const [jobPageSize, setJobPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Applications tab state
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'reviewing' | 'accepted' | 'rejected'>('all');
  const [appJobFilter, setAppJobFilter] = useState('');
  const [appCompanyFilter, setAppCompanyFilter] = useState('');
  const [appVisibleColumns, setAppVisibleColumns] = useState<string[]>(APP_COLUMNS.map((c) => c.key));
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);

  const myCompanies = useMemo(() => companies.filter((c) => c.createdBy === user?.id), [companies, user]);
  const myCompanyIds = useMemo(() => new Set(myCompanies.map((c) => c.id)), [myCompanies]);
  const myJobs = useMemo(() => jobs.filter((j) => myCompanyIds.has(j.companyId)), [jobs, myCompanyIds]);
  const myJobIds = useMemo(() => new Set(myJobs.map((j) => j.id)), [myJobs]);
  const myApplications = useMemo(() => allApplications.filter((a) => myJobIds.has(a.jobId)), [allApplications, myJobIds]);

  // Stats
  const stats = useMemo(() => {
    const activeJobs = myJobs.filter((j) => j.status === 'approved').length;
    const totalApps = myApplications.length;
    const newApps = myApplications.filter((a) => {
      const d = new Date(a.appliedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length;
    return {
      totalJobs: myJobs.length,
      activeJobs,
      totalApps,
      newApps,
    };
  }, [myJobs, myApplications]);

  const jobCompanyOptions = useMemo(() => {
    const set = new Set(myJobs.map((j) => j.company));
    return Array.from(set).sort();
  }, [myJobs]);

  const appCompanyOptions = useMemo(() => {
    const set = new Set<string>();
    myApplications.forEach((a) => {
      const job = myJobs.find((j) => j.id === a.jobId);
      if (job) set.add(job.company);
    });
    return Array.from(set).sort();
  }, [myApplications, myJobs]);
  const appJobOptions = useMemo(() => {
    const set = new Map<string, string>();
    myApplications.forEach((a) => set.set(a.jobId, a.jobTitle));
    return Array.from(set.entries());
  }, [myApplications]);

  // --- Jobs filtering ---
  const filteredJobs = useMemo(() => {
    let result = [...myJobs];
    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase();
      result = result.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
    }
    if (jobStatusFilter !== 'all') {
      result = result.filter((j) => j.status === jobStatusFilter);
    }
    if (jobCompanyFilter) {
      result = result.filter((j) => j.company === jobCompanyFilter);
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [myJobs, jobSearch, jobStatusFilter, jobCompanyFilter]);

  const paginatedJobs = useMemo(() => {
    const start = (jobPage - 1) * jobPageSize;
    return filteredJobs.slice(start, start + jobPageSize);
  }, [filteredJobs, jobPage, jobPageSize]);

  const totalJobPages = Math.ceil(filteredJobs.length / jobPageSize);

  // --- Applications filtering ---
  const filteredApps = useMemo(() => {
    let result = [...myApplications];
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      result = result.filter((a) => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q));
    }
    if (appStatusFilter !== 'all') {
      result = result.filter((a) => a.status === appStatusFilter);
    }
    if (appJobFilter) {
      result = result.filter((a) => a.jobId === appJobFilter);
    }
    if (appCompanyFilter) {
      result = result.filter((a) => {
        const job = myJobs.find((j) => j.id === a.jobId);
        return job?.company === appCompanyFilter;
      });
    }
    result.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    return result;
  }, [myApplications, myJobs, appSearch, appStatusFilter, appJobFilter, appCompanyFilter]);

  const paginatedApps = useMemo(() => {
    const start = (appPage - 1) * appPageSize;
    return filteredApps.slice(start, start + appPageSize);
  }, [filteredApps, appPage, appPageSize]);

  const totalAppPages = Math.ceil(filteredApps.length / appPageSize);

  if (user?.role !== 'employer') {
    return <Navigate to="/" replace />;
  }

  const handleStatusChange = (appId: string, newStatus: Application['status']) => {
    dispatch(updateApplicationStatus({ id: appId, status: newStatus }));
    setStatusDropdownOpen(null);
  };

  const handleAppFilterChange = (filter: typeof appStatusFilter) => {
    setAppStatusFilter(filter);
    setAppPage(1);
  };

  const handleJobFilterChange = (filter: typeof jobStatusFilter) => {
    setJobStatusFilter(filter);
    setJobPage(1);
  };

  const handleJobCompanyChange = (company: string) => {
    setJobCompanyFilter(company);
    setJobPage(1);
  };

  const handleAppCompanyChange = (company: string) => {
    setAppCompanyFilter(company);
    setAppPage(1);
  };

  const handleJobSearch = (val: string) => {
    setJobSearch(val);
    setJobPage(1);
  };

  const handleAppSearch = (val: string) => {
    setAppSearch(val);
    setAppPage(1);
  };

  return (
    <div className="min-h-screen pt-[70px] bg-background-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">Dashboard</h1>
          <p className="text-sm text-foreground-600 mt-1">Tổng quan hoạt động tuyển dụng của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-background-50 border border-background-200/70 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <i className="ri-briefcase-line text-lg text-primary-500"></i>
              </div>
              <p className="text-xs text-foreground-500">Tổng tin đăng</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground-950">{stats.totalJobs}</p>
          </div>
          <div className="bg-background-50 border border-background-200/70 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <i className="ri-check-double-line text-lg text-accent-500"></i>
              </div>
              <p className="text-xs text-foreground-500">Đang tuyển</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground-950">{stats.activeJobs}</p>
          </div>
          <div className="bg-background-50 border border-background-200/70 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                <i className="ri-file-user-line text-lg text-secondary-500"></i>
              </div>
              <p className="text-xs text-foreground-500">Tổng CV</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground-950">{stats.totalApps}</p>
          </div>
          <div className="bg-background-50 border border-background-200/70 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <i className="ri-notification-3-line text-lg text-primary-500"></i>
              </div>
              <p className="text-xs text-foreground-500">CV mới (7 ngày)</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground-950">{stats.newApps}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-background-200/50 rounded-full p-1 w-fit mb-6">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'jobs' ? 'bg-background-50 text-foreground-950' : 'text-foreground-600 hover:text-foreground-800'
            }`}
          >
            <i className="ri-briefcase-line mr-1.5"></i> Tin tuyển dụng ({myJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'applications' ? 'bg-background-50 text-foreground-950' : 'text-foreground-600 hover:text-foreground-800'
            }`}
          >
            <i className="ri-file-user-line mr-1.5"></i> Đơn ứng tuyển ({myApplications.length})
          </button>
        </div>

        {/* ========== JOBS TAB ========== */}
        {activeTab === 'jobs' && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => handleJobSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="pl-9 pr-4 py-2 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors w-[200px]"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <CustomSelect
                    value={jobCompanyFilter}
                    options={[{ value: '', label: 'Tất cả công ty' }, ...jobCompanyOptions.map((c) => ({ value: c, label: c }))]}
                    onChange={handleJobCompanyChange}
                    icon="ri-building-line"
                    className="w-[200px]"
                    compact
                  />
                  {(['all', 'approved', 'pending', 'rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => handleJobFilterChange(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        jobStatusFilter === f
                          ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                          : 'bg-background-50 border border-background-200/70 text-foreground-600 hover:bg-background-100'
                      }`}
                    >
                      {f === 'all' ? 'Tất cả' : jobStatusLabel[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/post-job"
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-xs font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line"></i> Đăng tin mới
                </Link>
                <ColumnVisibilityDropdown
                  columns={JOB_COLUMNS}
                  visibleKeys={jobVisibleColumns}
                  onChange={setJobVisibleColumns}
                />
              </div>
            </div>

            {/* Table */}
            {filteredJobs.length === 0 ? (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
                  <i className="ri-briefcase-line text-2xl text-foreground-400"></i>
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
                  {myJobs.length === 0 ? 'Bạn chưa có tin tuyển dụng nào' : 'Không tìm thấy tin nào'}
                </h3>
                <p className="text-sm text-foreground-500 mb-6">
                  {myJobs.length === 0 ? 'Tạo công ty và đăng tin tuyển dụng đầu tiên của bạn.' : 'Thử thay đổi bộ lọc.'}
                </p>
                {myJobs.length === 0 && (
                  <Link
                    to="/post-job"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line"></i> Đăng tin ngay
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-background-200/70 bg-background-100/50">
                        {jobVisibleColumns.includes('title') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">Tiêu đề</th>
                        )}
                        {jobVisibleColumns.includes('company') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">Công ty</th>
                        )}
                        {jobVisibleColumns.includes('category') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">Ngành nghề</th>
                        )}
                        {jobVisibleColumns.includes('location') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">Địa điểm</th>
                        )}
                        {jobVisibleColumns.includes('salary') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">Lương</th>
                        )}
                        {jobVisibleColumns.includes('createdAt') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">Ngày đăng</th>
                        )}
                        {jobVisibleColumns.includes('deadline') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">Hạn nộp</th>
                        )}
                        {jobVisibleColumns.includes('status') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">Trạng thái</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-background-200/70">
                      {paginatedJobs.map((job) => {
                        const appCount = myApplications.filter((a) => a.jobId === job.id).length;
                        return (
                          <tr key={job.id} className="hover:bg-background-100/50 transition-colors">
                            {jobVisibleColumns.includes('title') && (
                              <td className="px-5 py-4">
                                <Link to={`/jobs/${job.id}`} className="text-sm font-semibold text-foreground-900 hover:text-primary-500 transition-colors cursor-pointer line-clamp-1">
                                  {job.title}
                                </Link>
                                <p className="text-xs text-foreground-500 mt-0.5 md:hidden">{job.category} · {job.location}</p>
                              </td>
                            )}
                            {jobVisibleColumns.includes('company') && (
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    <img src={job.companyLogo} alt={job.company} className="w-6 h-6 object-contain" />
                                  </div>
                                  <span className="text-sm text-foreground-700">{job.company}</span>
                                </div>
                              </td>
                            )}
                            {jobVisibleColumns.includes('category') && (
                              <td className="px-5 py-4 hidden md:table-cell">
                                <span className="text-sm text-foreground-600">{job.category}</span>
                              </td>
                            )}
                            {jobVisibleColumns.includes('location') && (
                              <td className="px-5 py-4 hidden lg:table-cell">
                                <span className="text-sm text-foreground-600">{job.location}</span>
                              </td>
                            )}
                            {jobVisibleColumns.includes('salary') && (
                              <td className="px-5 py-4 hidden lg:table-cell">
                                <span className="text-sm font-medium text-foreground-700">{job.salary}</span>
                              </td>
                            )}
                            {jobVisibleColumns.includes('createdAt') && (
                              <td className="px-5 py-4 hidden md:table-cell">
                                <span className="text-sm text-foreground-600">{job.createdAt}</span>
                              </td>
                            )}
                            {jobVisibleColumns.includes('deadline') && (
                              <td className="px-5 py-4 hidden lg:table-cell">
                                <span className={`text-sm ${new Date(job.deadline) < new Date() ? 'text-red-500 font-medium' : 'text-foreground-600'}`}>
                                  {job.deadline}
                                </span>
                              </td>
                            )}
                            {jobVisibleColumns.includes('status') && (
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${jobStatusColor[job.status]}`}>
                                    {job.status === 'approved' && <i className="ri-check-line text-[10px]"></i>}
                                    {job.status === 'pending' && <i className="ri-time-line text-[10px]"></i>}
                                    {job.status === 'rejected' && <i className="ri-close-line text-[10px]"></i>}
                                    {jobStatusLabel[job.status]}
                                  </span>
                                  {appCount > 0 && (
                                    <span className="text-xs text-foreground-500 whitespace-nowrap">{appCount} CV</span>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={jobPage}
                  totalPages={totalJobPages}
                  pageSize={jobPageSize}
                  totalItems={filteredJobs.length}
                  onPageChange={setJobPage}
                  onPageSizeChange={(size) => { setJobPageSize(size); setJobPage(1); }}
                />
              </div>
            )}
          </>
        )}

        {/* ========== APPLICATIONS TAB ========== */}
        {activeTab === 'applications' && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => handleAppSearch(e.target.value)}
                    placeholder="Tìm ứng viên..."
                    className="pl-9 pr-4 py-2 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors w-[200px]"
                  />
                </div>
                <CustomSelect
                  value={appJobFilter}
                  options={[{ value: '', label: 'Tất cả vị trí' }, ...appJobOptions.map(([id, title]) => ({ value: id, label: title }))]}
                  onChange={(val) => { setAppJobFilter(val); setAppPage(1); }}
                  icon="ri-briefcase-line"
                  className="w-[200px]"
                  compact
                />
                <CustomSelect
                  value={appCompanyFilter}
                  options={[{ value: '', label: 'Tất cả công ty' }, ...appCompanyOptions.map((c) => ({ value: c, label: c }))]}
                  onChange={handleAppCompanyChange}
                  icon="ri-building-line"
                  className="w-[200px]"
                  compact
                />
                <div className="flex items-center gap-1">
                  {(['all', 'pending', 'reviewing', 'accepted', 'rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => handleAppFilterChange(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        appStatusFilter === f
                          ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                          : 'bg-background-50 border border-background-200/70 text-foreground-600 hover:bg-background-100'
                      }`}
                    >
                      {f === 'all' ? 'Tất cả' : appStatusLabel[f]}
                    </button>
                  ))}
                </div>
              </div>
              <ColumnVisibilityDropdown
                columns={APP_COLUMNS}
                visibleKeys={appVisibleColumns}
                onChange={setAppVisibleColumns}
              />
            </div>

            {/* Table */}
            {filteredApps.length === 0 ? (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
                  <i className="ri-file-user-line text-2xl text-foreground-400"></i>
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
                  {myApplications.length === 0 ? 'Chưa có đơn ứng tuyển nào' : 'Không tìm thấy đơn nào'}
                </h3>
                <p className="text-sm text-foreground-500">
                  {myApplications.length === 0 ? 'Khi có ứng viên nộp hồ sơ, bạn sẽ thấy chúng ở đây.' : 'Thử thay đổi bộ lọc.'}
                </p>
              </div>
            ) : (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-background-200/70 bg-background-100/50">
                        {appVisibleColumns.includes('fullName') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">Ứng viên</th>
                        )}
                        {appVisibleColumns.includes('email') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">Email</th>
                        )}
                        {appVisibleColumns.includes('phone') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">Điện thoại</th>
                        )}
                        {appVisibleColumns.includes('jobTitle') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">Vị trí</th>
                        )}
                        {appVisibleColumns.includes('appliedAt') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">Ngày ứng tuyển</th>
                        )}
                        {appVisibleColumns.includes('cvFileName') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden lg:table-cell">CV</th>
                        )}
                        {appVisibleColumns.includes('status') && (
                          <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">Trạng thái</th>
                        )}
                        <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-background-200/70">
                      {paginatedApps.map((app) => (
                        <tr key={app.id} className="hover:bg-background-100/50 transition-colors">
                          {appVisibleColumns.includes('fullName') && (
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-primary-600">{app.fullName.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground-900">{app.fullName}</p>
                                  {app.coverLetter && (
                                    <p className="text-xs text-foreground-500 line-clamp-1 mt-0.5 max-w-[220px]" title={app.coverLetter}>{app.coverLetter}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}
                          {appVisibleColumns.includes('email') && (
                            <td className="px-5 py-4 hidden md:table-cell">
                              <span className="text-sm text-foreground-600">{app.email}</span>
                            </td>
                          )}
                          {appVisibleColumns.includes('phone') && (
                            <td className="px-5 py-4 hidden lg:table-cell">
                              <span className="text-sm text-foreground-600">{app.phone || '—'}</span>
                            </td>
                          )}
                          {appVisibleColumns.includes('jobTitle') && (
                            <td className="px-5 py-4">
                              <span className="text-sm text-foreground-700 line-clamp-1 max-w-[160px]">{app.jobTitle}</span>
                            </td>
                          )}
                          {appVisibleColumns.includes('appliedAt') && (
                            <td className="px-5 py-4 hidden md:table-cell">
                              <span className="text-sm text-foreground-600">
                                {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                              </span>
                            </td>
                          )}
                          {appVisibleColumns.includes('cvFileName') && (
                            <td className="px-5 py-4 hidden lg:table-cell">
                              {app.cvFileName ? (
                                <span className="inline-flex items-center gap-1 text-xs text-primary-500 font-medium">
                                  <i className="ri-file-text-line"></i> {app.cvFileName}
                                </span>
                              ) : (
                                <span className="text-xs text-foreground-400">—</span>
                              )}
                            </td>
                          )}
                          {appVisibleColumns.includes('status') && (
                            <td className="px-5 py-4">
                              <div className="relative">
                                <button
                                  onClick={() => setStatusDropdownOpen(statusDropdownOpen === app.id ? null : app.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${appStatusColor[app.status]}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    app.status === 'pending' ? 'bg-yellow-500' :
                                    app.status === 'reviewing' ? 'bg-accent-500' :
                                    app.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                                  }`}></span>
                                  {appStatusLabel[app.status]}
                                  <i className="ri-arrow-down-s-line text-[10px]"></i>
                                </button>
                                {statusDropdownOpen === app.id && (
                                  <div className="absolute top-full mt-1 left-0 bg-background-50 border border-background-200 rounded-lg shadow-lg py-1 min-w-[140px] z-30">
                                    {(['pending', 'reviewing', 'accepted', 'rejected'] as const).map((s) => (
                                      <button
                                        key={s}
                                        onClick={() => handleStatusChange(app.id, s)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                          app.status === s ? 'font-semibold text-foreground-950' : 'text-foreground-600'
                                        }`}
                                      >
                                        <span className={`w-2 h-2 rounded-full ${
                                          s === 'pending' ? 'bg-yellow-500' :
                                          s === 'reviewing' ? 'bg-accent-500' :
                                          s === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                                        }`}></span>
                                        {appStatusLabel[s]}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-5 py-4 text-right">
                            <Link
                              to={`/jobs/${app.jobId}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-eye-line"></i> Xem tin
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={appPage}
                  totalPages={totalAppPages}
                  pageSize={appPageSize}
                  totalItems={filteredApps.length}
                  onPageChange={setAppPage}
                  onPageSizeChange={(size) => { setAppPageSize(size); setAppPage(1); }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}