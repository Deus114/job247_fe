import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { deleteJob, restoreJob, permanentDeleteJob, updateJob, toggleJobActive } from '@/store/slices/jobSlice';
import type { Job } from '@/store/slices/jobSlice';
import CustomSelect from '@/components/base/CustomSelect';
import SortHeader from '@/components/base/SortHeader';
import ColumnVisibilityDropdown from '@/components/base/ColumnVisibilityDropdown';
import Pagination from '@/components/base/Pagination';

type SortField = 'title' | 'company' | 'salary' | 'createdAt';

export default function JobsTab() {
  const dispatch = useAppDispatch();
  const allJobs = useAppSelector((state) => state.jobs.items);
  const categories = useAppSelector((state) => state.jobs.categories);
  const locations = useAppSelector((state) => state.jobs.locations);
  const educationLevels = useAppSelector((state) => state.jobs.educationLevels);

  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Job['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [educationFilter, setEducationFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  const [form, setForm] = useState<Partial<Job>>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['title','company','category','location','salary','status','active','createdAt','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field as SortField); setSortOrder('asc'); }
  };

  const visibleJobs = useMemo(() => {
    return viewMode === 'active'
      ? allJobs.filter((j) => !j.deletedAt)
      : allJobs.filter((j) => !!j.deletedAt);
  }, [allJobs, viewMode]);

  const allTypes = useMemo(() => [...new Set(allJobs.filter((j) => !j.deletedAt).map((j) => j.type).filter(Boolean))], [allJobs]);

  const filtered = useMemo(() => {
    let list = visibleJobs.filter((j) => {
      const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || j.category === categoryFilter;
      const matchLocation = locationFilter === 'all' || j.location === locationFilter;
      const matchType = typeFilter === 'all' || j.type === typeFilter;
      const matchEducation = educationFilter === 'all' || j.educationLevel === educationFilter;
      const matchFrom = !dateFrom || j.createdAt >= dateFrom;
      const matchTo = !dateTo || j.createdAt <= dateTo;
      return matchSearch && matchStatus && matchCategory && matchLocation && matchType && matchEducation && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      const aVal = (a[sortField] ?? '') as string;
      const bVal = (b[sortField] ?? '') as string;
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visibleJobs, search, statusFilter, categoryFilter, locationFilter, typeFilter, educationFilter, dateFrom, dateTo, sortField, sortOrder]);

  const paginatedJobs = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useMemo(() => { setCurrentPage(1); }, [search, statusFilter, categoryFilter, locationFilter, typeFilter, educationFilter, dateFrom, dateTo, viewMode, pageSize]);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Chờ duyệt', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    approved: { label: 'Đã duyệt', color: 'text-accent-600', bg: 'bg-accent-100' },
    rejected: { label: 'Từ chối', color: 'text-red-600', bg: 'bg-red-100' },
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'Tất cả ngành' },
    ...categories.map((c) => ({ value: c.name, label: c.name })),
  ];

  const locationOptions = [
    { value: 'all', label: 'Tất cả địa điểm' },
    ...locations.map((l) => ({ value: l, label: l })),
  ];

  const typeOptions = [
    { value: 'all', label: 'Tất cả loại' },
    ...allTypes.map((t) => ({ value: t, label: t })),
  ];

  const educationOptions = [
    { value: 'all', label: 'Tất cả trình độ' },
    ...educationLevels.map((e) => ({ value: e.name, label: e.name })),
  ];

  const openEdit = (job: Job) => {
    setEditingJob(job);
    setForm({ ...job });
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSave = () => {
    if (editingJob && form.title?.trim()) {
      dispatch(updateJob({ ...editingJob, ...form } as Job));
      setModalOpen(false);
    }
  };

  const hasActiveFilters = search || statusFilter !== 'all' || categoryFilter !== 'all' || locationFilter !== 'all' || typeFilter !== 'all' || educationFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setLocationFilter('all'); setTypeFilter('all'); setEducationFilter('all'); setDateFrom(''); setDateTo('');
  };

  const activeCount = allJobs.filter((j) => !j.deletedAt).length;
  const trashCount = allJobs.filter((j) => !!j.deletedAt).length;

  const allColumns = [
    { key: 'title', label: 'Tiêu đề' },
    { key: 'company', label: 'Công ty' },
    { key: 'category', label: 'Ngành' },
    { key: 'location', label: 'Địa điểm' },
    { key: 'salary', label: 'Mức lương' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'createdAt', label: 'Ngày tạo' },
    ...(viewMode === 'trash' ? [{ key: 'deletedAt', label: 'Ngày xóa' }] : []),
    { key: 'active', label: 'Kích hoạt' },
    { key: 'actions', label: 'Hành động' },
  ];

  const isColVisible = (key: string) => visibleColumns.includes(key);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">Quản lý việc làm</h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === 'active' ? `${filtered.length} / ${activeCount} tin tuyển dụng` : `${filtered.length} / ${trashCount} đã xóa`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown columns={allColumns} visibleKeys={visibleColumns} onChange={setVisibleColumns} />
            <button
              onClick={() => { setViewMode('active'); clearFilters(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'active' ? 'bg-primary-100 text-primary-700' : 'text-foreground-500 hover:bg-background-100'
              }`}
            >
              <i className="ri-briefcase-line mr-1"></i> Đang hoạt động
            </button>
            <button
              onClick={() => { setViewMode('trash'); clearFilters(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'text-foreground-500 hover:bg-background-100'
              }`}
            >
              <i className="ri-delete-bin-line mr-1"></i> Thùng rác {trashCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{trashCount}</span>}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="relative flex-1 w-full sm:max-w-[200px]">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tiêu đề, công ty..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              options={statusOptions}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={categoryFilter}
              options={categoryOptions}
              onChange={setCategoryFilter}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={locationFilter}
              options={locationOptions}
              onChange={setLocationFilter}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={typeFilter}
              options={typeOptions}
              onChange={setTypeFilter}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={educationFilter}
              options={educationOptions}
              onChange={setEducationFilter}
              compact
              className="w-full sm:w-[160px]"
            />
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title="Từ ngày" />
            <span className="text-xs text-foreground-400">đến</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title="Đến ngày" />
          </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-foreground-500 hover:text-foreground-700 hover:bg-background-100 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <i className="ri-filter-off-line"></i> Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'trash' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            Các tin tuyển dụng trong thùng rác sẽ tự động bị xóa sau 30 ngày. Bạn có thể khôi phục hoặc xóa vĩnh viễn.
          </p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label="TIÊU ĐỀ" field="title" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="CÔNG TY" field="company" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">NGÀNH</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">ĐỊA ĐIỂM</th>
                <SortHeader label="MỨC LƯƠNG" field="salary" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">TRẠNG THÁI</th>
                <SortHeader label="NGÀY TẠO" field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">KÍCH HOẠT</th>
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">NGÀY XÓA</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.map((job) => {
                const isExpired = new Date(job.deadline) < new Date();
                return (
                  <tr key={job.id} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setDetailJob(job)}
                        className="text-foreground-900 font-medium text-sm max-w-[200px] truncate hover:text-primary-500 transition-colors cursor-pointer text-left block"
                      >
                        {job.title}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{job.company}</td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{job.category}</td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{job.location}</td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">{job.salary}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${isExpired ? 'bg-red-100 text-red-600' : statusConfig[job.status].bg + ' ' + statusConfig[job.status].color}`}>
                        {isExpired ? 'Hết hạn' : statusConfig[job.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{job.createdAt}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {viewMode === 'active' ? (
                        <button
                          onClick={() => dispatch(toggleJobActive(job.id))}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${job.isActive !== false ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          {job.isActive !== false ? 'Bật' : 'Tắt'}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${job.isActive !== false ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                          {job.isActive !== false ? 'Bật' : 'Tắt'}
                        </span>
                      )}
                    </td>
                    {viewMode === 'trash' && (
                      <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                        {job.deletedAt ? new Date(job.deletedAt).toLocaleDateString('vi-VN') : ''}
                      </td>
                    )}
                    <td className="px-5 py-3 text-right whitespace-nowrap relative">
                      {confirmSoftDelete === job.id && viewMode === 'active' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(deleteJob(job.id)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">Xóa</button>
                          <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                        </div>
                      ) : confirmPermanentDelete === job.id && viewMode === 'trash' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(permanentDeleteJob(job.id)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">Xóa vĩnh viễn</button>
                          <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <button onClick={() => setDropdownOpen(dropdownOpen === job.id ? null : job.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer">
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
                          {dropdownOpen === job.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                              {viewMode === 'active' ? (
                                <>
                                  <button onClick={() => { setDetailJob(job); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-eye-line text-primary-500"></i> Xem chi tiết
                                  </button>
                                  <button onClick={() => openEdit(job)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-edit-line text-accent-500"></i> Chỉnh sửa
                                  </button>
                                  <button onClick={() => { setConfirmSoftDelete(job.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                    <i className="ri-delete-bin-line"></i> Xóa
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { dispatch(restoreJob(job.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                    <i className="ri-arrow-go-back-line"></i> Khôi phục
                                  </button>
                                  <button onClick={() => { setDetailJob(job); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-eye-line text-primary-500"></i> Xem chi tiết
                                  </button>
                                  <button onClick={() => { setConfirmPermanentDelete(job.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                    <i className="ri-delete-bin-6-line"></i> Xóa vĩnh viễn
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className={`ri-briefcase-line text-2xl text-foreground-400`}></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === 'active'
                ? (hasActiveFilters ? 'Không có tin tuyển dụng phù hợp với bộ lọc' : 'Không có tin tuyển dụng nào')
                : 'Thùng rác trống'}
            </p>
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* Detail Modal */}
      {detailJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailJob(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-heading font-semibold text-foreground-950">{detailJob.title}</h3>
                <p className="text-sm text-foreground-500">{detailJob.company}</p>
              </div>
              <button onClick={() => setDetailJob(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${(new Date(detailJob.deadline) < new Date()) ? 'bg-red-100 text-red-600' : statusConfig[detailJob.status].bg + ' ' + statusConfig[detailJob.status].color}`}>
                {(new Date(detailJob.deadline) < new Date()) ? 'Hết hạn' : statusConfig[detailJob.status].label}
              </span>
              <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">{detailJob.type}</span>
              <span className="px-2.5 py-1 bg-background-200 text-foreground-600 rounded-full text-xs font-medium">{detailJob.experience}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="flex items-center justify-between py-2 border-b border-background-100 sm:col-span-2">
                <span className="text-sm text-foreground-500">Mô tả</span>
                <span className="text-sm text-foreground-800 text-right max-w-[65%]">{detailJob.description}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Ngành nghề</span>
                <span className="text-sm font-medium text-foreground-800">{detailJob.category}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Địa điểm</span>
                <span className="text-sm font-medium text-foreground-800">{detailJob.location}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Mức lương</span>
                <span className="text-sm font-medium text-foreground-800">{detailJob.salary}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Trình độ</span>
                <span className="text-sm font-medium text-foreground-800">{detailJob.educationLevel}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Hạn nộp</span>
                <span className="text-sm font-medium text-foreground-800">{detailJob.deadline}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Ngày tạo</span>
                <span className="text-sm font-medium text-foreground-800">{detailJob.createdAt}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Nổi bật</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${detailJob.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-background-200 text-foreground-500'}`}>
                  {detailJob.featured ? 'Có' : 'Không'}
                </span>
              </div>
            </div>
            {detailJob.requirements.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground-800 mb-2">Yêu cầu</h4>
                <ul className="space-y-1">
                  {detailJob.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailJob.benefits.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground-800 mb-2">Phúc lợi</h4>
                <ul className="space-y-1">
                  {detailJob.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0"></span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailJob(null)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Đóng</button>
              {viewMode === 'active' && (
                <button onClick={() => { setDetailJob(null); openEdit(detailJob); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                  Chỉnh sửa
                </button>
              )}
              {viewMode === 'trash' && (
                <button onClick={() => { dispatch(restoreJob(detailJob.id)); setDetailJob(null); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">
                  Khôi phục
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalOpen && editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">Chỉnh sửa việc làm</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Tiêu đề</label>
                <input type="text" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Công ty</label>
                <input type="text" value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ngành nghề</label>
                <input type="text" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Địa điểm</label>
                <input type="text" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Mức lương</label>
                <input type="text" value={form.salary || ''} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Trạng thái</label>
                <CustomSelect
                  value={form.status || 'approved'}
                  options={[
                    { value: 'pending', label: 'Chờ duyệt' },
                    { value: 'approved', label: 'Đã duyệt' },
                    { value: 'rejected', label: 'Từ chối' },
                  ]}
                  onChange={(v) => setForm({ ...form, status: v as Job['status'] })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Mô tả</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 resize-none" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Hủy</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>}
    </div>
  );
}