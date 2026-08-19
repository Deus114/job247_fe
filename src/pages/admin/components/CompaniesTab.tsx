import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateCompany, deleteCompany, restoreCompany, permanentDeleteCompany, approveCompany, rejectCompany, setRevisionNeeded, toggleCompanyActive } from '@/store/slices/companySlice';
import type { Company } from '@/store/slices/companySlice';
import CustomSelect from '@/components/base/CustomSelect';
import SortHeader from '@/components/base/SortHeader';
import ColumnVisibilityDropdown from '@/components/base/ColumnVisibilityDropdown';
import Pagination from '@/components/base/Pagination';

type SortField = 'name' | 'industry' | 'size' | 'createdAt';

export default function CompaniesTab() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const allCompanies = useAppSelector((state) => state.companies.items);
  const jobs = useAppSelector((state) => state.jobs.items);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Company['status']>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [revisionModal, setRevisionModal] = useState<{ open: boolean; companyId: string; companyName: string }>({ open: false, companyId: '', companyName: '' });
  const [revisionNote, setRevisionNote] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);

  const [form, setForm] = useState<Partial<Company>>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['name','industry','size','jobs','status','active','createdAt','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field as SortField); setSortOrder('asc'); }
  };

  const visibleCompanies = useMemo(() => {
    return viewMode === 'active'
      ? allCompanies.filter((c) => !c.deletedAt)
      : allCompanies.filter((c) => !!c.deletedAt);
  }, [allCompanies, viewMode]);

  const allIndustries = useMemo(() => [...new Set(allCompanies.filter((c) => !c.deletedAt).map((c) => c.industry).filter(Boolean))], [allCompanies]);
  const allSizes = useMemo(() => [...new Set(allCompanies.filter((c) => !c.deletedAt).map((c) => c.size).filter(Boolean))], [allCompanies]);
  const allLocations = useMemo(() => [...new Set(allCompanies.filter((c) => !c.deletedAt).map((c) => c.location).filter(Boolean))], [allCompanies]);

  const filtered = useMemo(() => {
    let list = visibleCompanies.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.contactEmail?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchIndustry = industryFilter === 'all' || c.industry === industryFilter;
      const matchSize = sizeFilter === 'all' || c.size === sizeFilter;
      const matchLocation = locationFilter === 'all' || c.location === locationFilter;
      const matchFrom = !dateFrom || c.createdAt >= dateFrom;
      const matchTo = !dateTo || c.createdAt <= dateTo;
      return matchSearch && matchStatus && matchIndustry && matchSize && matchLocation && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      const aVal = (a[sortField] ?? '') as string;
      const bVal = (b[sortField] ?? '') as string;
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visibleCompanies, search, statusFilter, industryFilter, sizeFilter, locationFilter, dateFrom, dateTo, sortField, sortOrder]);

  const paginatedCompanies = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useMemo(() => { setCurrentPage(1); }, [search, statusFilter, industryFilter, sizeFilter, locationFilter, dateFrom, dateTo, viewMode, pageSize]);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Chờ duyệt', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    approved: { label: 'Đã duyệt', color: 'text-accent-600', bg: 'bg-accent-100' },
    rejected: { label: 'Từ chối', color: 'text-red-600', bg: 'bg-red-100' },
    needs_revision: { label: 'Cần sửa', color: 'text-orange-700', bg: 'bg-orange-100' },
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
    { value: 'needs_revision', label: 'Cần sửa' },
  ];

  const industryOptions = [
    { value: 'all', label: 'Tất cả ngành' },
    ...allIndustries.map((ind) => ({ value: ind, label: ind })),
  ];

  const sizeOptions = [
    { value: 'all', label: 'Tất cả quy mô' },
    ...allSizes.map((s) => ({ value: s, label: `${s} NV` })),
  ];

  const locationOptions = [
    { value: 'all', label: 'Tất cả địa điểm' },
    ...allLocations.map((loc) => ({ value: loc, label: loc })),
  ];

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setForm({ ...company });
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSave = () => {
    if (editingCompany && form.name?.trim()) {
      dispatch(updateCompany({ id: editingCompany.id, ...form }));
      setModalOpen(false);
    }
  };

  const handleRevision = () => {
    if (!revisionNote.trim()) return;
    dispatch(setRevisionNeeded({ id: revisionModal.companyId, note: revisionNote.trim() }));
    setRevisionModal({ open: false, companyId: '', companyName: '' });
    setRevisionNote('');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || industryFilter !== 'all' || sizeFilter !== 'all' || locationFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setIndustryFilter('all'); setSizeFilter('all'); setLocationFilter('all'); setDateFrom(''); setDateTo('');
  };

  const activeCount = allCompanies.filter((c) => !c.deletedAt).length;
  const trashCount = allCompanies.filter((c) => !!c.deletedAt).length;

  const allColumns = [
    { key: 'name', label: 'Công ty' },
    { key: 'industry', label: 'Ngành' },
    { key: 'size', label: 'Quy mô' },
    { key: 'jobs', label: 'Tin tuyển' },
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
            <h2 className="text-xl font-heading font-bold text-foreground-950">Quản lý công ty</h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === 'active' ? `${filtered.length} / ${activeCount} công ty` : `${filtered.length} / ${trashCount} đã xóa`}
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
              <i className="ri-building-line mr-1"></i> Đang hoạt động
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
                placeholder="Tên công ty, email..."
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
              value={industryFilter}
              options={industryOptions}
              onChange={setIndustryFilter}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={sizeFilter}
              options={sizeOptions}
              onChange={setSizeFilter}
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
            Công ty trong thùng rác có thể được khôi phục hoặc xóa vĩnh viễn.
          </p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label="CÔNG TY" field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="NGÀNH" field="industry" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="QUY MÔ" field="size" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">TIN TUYỂN</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">TRẠNG THÁI</th>
                <SortHeader label="NGÀY TẠO" field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">KÍCH HOẠT</th>
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">NGÀY XÓA</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.map((company) => {
                const companyJobs = jobs.filter((j) => j.companyId === company.id && !j.deletedAt);
                return (
                  <tr key={company.id} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-background-200/50">
                          <img src={company.logo} alt={company.name} className="w-7 h-7 object-contain" />
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setDetailCompany(company)}
                            className="text-foreground-900 font-medium text-sm truncate hover:text-primary-500 transition-colors cursor-pointer text-left"
                          >
                            {company.name}
                          </button>
                          <p className="text-xs text-foreground-500">{company.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{company.industry}</td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{company.size} NV</td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{companyJobs.length}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[company.status].bg} ${statusConfig[company.status].color}`}>
                        {statusConfig[company.status].label}
                      </span>
                      {company.adminNote && (
                        <p className="text-[10px] text-orange-500 mt-1 max-w-[150px] truncate">{company.adminNote}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{company.createdAt}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {viewMode === 'active' ? (
                        <button
                          onClick={() => dispatch(toggleCompanyActive(company.id))}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${company.isActive !== false ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          {company.isActive !== false ? 'Bật' : 'Tắt'}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${company.isActive !== false ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                          {company.isActive !== false ? 'Bật' : 'Tắt'}
                        </span>
                      )}
                    </td>
                    {viewMode === 'trash' && (
                      <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                        {company.deletedAt ? new Date(company.deletedAt).toLocaleDateString('vi-VN') : ''}
                      </td>
                    )}
                    <td className="px-5 py-3 text-right whitespace-nowrap relative">
                      {confirmSoftDelete === company.id && viewMode === 'active' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(deleteCompany(company.id)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">Xóa</button>
                          <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                        </div>
                      ) : confirmPermanentDelete === company.id && viewMode === 'trash' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(permanentDeleteCompany(company.id)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">Xóa vĩnh viễn</button>
                          <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <button onClick={() => setDropdownOpen(dropdownOpen === company.id ? null : company.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer">
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
                          {dropdownOpen === company.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                              {viewMode === 'active' ? (
                                <>
                                  <button onClick={() => { setDetailCompany(company); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-eye-line text-primary-500"></i> Xem chi tiết
                                  </button>
                                  <button onClick={() => navigate(`/companies/${company.id}`)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-external-link-line text-accent-500"></i> Trang công ty
                                  </button>
                                  <button onClick={() => openEdit(company)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-edit-line text-secondary-500"></i> Chỉnh sửa
                                  </button>
                                  {company.status === 'pending' && (
                                    <>
                                      <button onClick={() => { dispatch(approveCompany(company.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                        <i className="ri-check-line"></i> Duyệt
                                      </button>
                                      <button onClick={() => { setRevisionModal({ open: true, companyId: company.id, companyName: company.name }); setRevisionNote(''); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer">
                                        <i className="ri-edit-line"></i> Cần sửa
                                      </button>
                                      <button onClick={() => { dispatch(rejectCompany(company.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                        <i className="ri-close-line"></i> Từ chối
                                      </button>
                                    </>
                                  )}
                                  <button onClick={() => { setConfirmSoftDelete(company.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                    <i className="ri-delete-bin-line"></i> Xóa
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { dispatch(restoreCompany(company.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                    <i className="ri-arrow-go-back-line"></i> Khôi phục
                                  </button>
                                  <button onClick={() => { setDetailCompany(company); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-eye-line text-primary-500"></i> Xem chi tiết
                                  </button>
                                  <button onClick={() => { setConfirmPermanentDelete(company.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
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
              <i className="ri-building-4-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === 'active'
                ? (hasActiveFilters ? 'Không có công ty phù hợp với bộ lọc' : 'Không có công ty nào')
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
      {detailCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailCompany(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">Chi tiết công ty</h3>
              <button onClick={() => setDetailCompany(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-background-100">
              <div className="w-16 h-16 rounded-xl bg-background-100 flex items-center justify-center overflow-hidden border border-background-200/50 flex-shrink-0">
                <img src={detailCompany.logo} alt={detailCompany.name} className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-foreground-950">{detailCompany.name}</h4>
                <p className="text-sm text-foreground-500">{detailCompany.nameEn}</p>
                <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mt-1 ${statusConfig[detailCompany.status].bg} ${statusConfig[detailCompany.status].color}`}>
                  {statusConfig[detailCompany.status].label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between py-2 border-b border-background-100 sm:col-span-2">
                <span className="text-sm text-foreground-500">Mô tả</span>
                <span className="text-sm text-foreground-800 text-right max-w-[60%]">{detailCompany.description}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Ngành nghề</span>
                <span className="text-sm font-medium text-foreground-800">{detailCompany.industry}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Quy mô</span>
                <span className="text-sm font-medium text-foreground-800">{detailCompany.size} nhân viên</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Địa điểm</span>
                <span className="text-sm font-medium text-foreground-800">{detailCompany.location}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Địa chỉ</span>
                <span className="text-sm font-medium text-foreground-800 text-right max-w-[55%]">{detailCompany.address}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Website</span>
                <a href={detailCompany.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-500 hover:underline">{detailCompany.website}</a>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Email liên hệ</span>
                <span className="text-sm font-medium text-foreground-800">{detailCompany.contactEmail}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Điện thoại</span>
                <span className="text-sm font-medium text-foreground-800">{detailCompany.contactPhone}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Mã số thuế</span>
                <span className="text-sm font-medium text-foreground-800">{detailCompany.taxCode}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Ngày tạo</span>
                <span className="text-sm font-medium text-foreground-800">{detailCompany.createdAt}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Cập nhật cuối</span>
                <span className="text-sm font-medium text-foreground-800">{detailCompany.updatedAt}</span>
              </div>
            </div>
            {detailCompany.adminNote && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-xs font-medium text-orange-600 mb-1">Ghi chú từ Admin:</p>
                <p className="text-sm text-orange-700">{detailCompany.adminNote}</p>
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailCompany(null)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Đóng</button>
              {viewMode === 'active' && (
                <button onClick={() => { setDetailCompany(null); openEdit(detailCompany); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                  Chỉnh sửa
                </button>
              )}
              {viewMode === 'trash' && (
                <button onClick={() => { dispatch(restoreCompany(detailCompany.id)); setDetailCompany(null); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">
                  Khôi phục
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">Chỉnh sửa công ty</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Tên công ty</label>
                <input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ngành nghề</label>
                <input type="text" value={form.industry || ''} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Quy mô</label>
                <input type="text" value={form.size || ''} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Địa điểm</label>
                <input type="text" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Email</label>
                <input type="email" value={form.contactEmail || ''} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Điện thoại</label>
                <input type="tel" value={form.contactPhone || ''} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
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

      {/* Revision Modal */}
      {revisionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRevisionModal({ open: false, companyId: '', companyName: '' })}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-lg">
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-1">Yêu cầu chỉnh sửa</h3>
            <p className="text-sm text-foreground-600 mb-4">Ghi chú cho <strong>{revisionModal.companyName}</strong></p>
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Nhập lý do cần chỉnh sửa..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 resize-none"
            ></textarea>
            <p className="text-xs text-foreground-400 mt-1 text-right">{revisionNote.length}/500</p>
            <div className="flex items-center gap-3 mt-5">
              <button onClick={() => setRevisionModal({ open: false, companyId: '', companyName: '' })} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Hủy</button>
              <button onClick={handleRevision} disabled={!revisionNote.trim()} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${revisionNote.trim() ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>Gửi yêu cầu</button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>}
    </div>
  );
}