import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addBanner,
  updateBanner,
  deleteBanner,
  restoreBanner,
  permanentDeleteBanner,
  toggleBannerStatus,
} from '@/store/slices/bannerSlice';
import type { Banner } from '@/types/banner';
import CustomSelect from '@/components/ui/CustomSelect';
import SortHeader from '@/components/ui/SortHeader';
import ColumnVisibilityDropdown from '@/components/ui/ColumnVisibilityDropdown';
import Pagination from '@/components/ui/Pagination';

type SortField = 'title' | 'position' | 'order' | 'createdAt';

export default function BannersPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const allBanners = useAppSelector((state) => state.banners.items);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [detailBanner, setDetailBanner] = useState<Banner | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [imagePreview, setImagePreview] = useState('');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['banner','position','status','order','time','createdAt','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field as SortField); setSortOrder('asc'); }
  };

  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'hero' as Banner['position'],
    status: 'active' as Banner['status'],
    order: 1,
    startDate: '',
    endDate: '',
  });

  const visibleBanners = useMemo(() => {
    return viewMode === 'active'
      ? allBanners.filter((b) => !b.deletedAt)
      : allBanners.filter((b) => !!b.deletedAt);
  }, [allBanners, viewMode]);

  const filtered = useMemo(() => {
    let list = visibleBanners.filter((b) => {
      const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase());
      const matchPosition = positionFilter === 'all' || b.position === positionFilter;
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchFrom = !dateFrom || b.createdAt >= dateFrom;
      const matchTo = !dateTo || b.createdAt <= dateTo;
      return matchSearch && matchPosition && matchStatus && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      if (sortField === 'order') return sortOrder === 'asc' ? a.order - b.order : b.order - a.order;
      const aVal = (a[sortField] ?? '') as string;
      const bVal = (b[sortField] ?? '') as string;
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visibleBanners, search, positionFilter, statusFilter, dateFrom, dateTo, sortField, sortOrder]);

  const paginatedBanners = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [search, positionFilter, statusFilter, dateFrom, dateTo, viewMode, pageSize]);

  const positionConfig: Record<string, { label: string; icon: string }> = {
    hero: { label: 'Hero', icon: 'ri-image-line' },
    sidebar: { label: 'Sidebar', icon: 'ri-layout-right-line' },
    footer: { label: 'Footer', icon: 'ri-layout-bottom-line' },
    popup: { label: 'Popup', icon: 'ri-windows-line' },
  };

  const positionOptions = [
    { value: 'all', label: t('adminUi.banners.allPositions') },
    { value: 'hero', label: 'Hero' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'footer', label: 'Footer' },
    { value: 'popup', label: 'Popup' },
  ];

  const statusOptions = [
    { value: 'all', label: t('adminUi.filters.allStatuses') },
    { value: 'active', label: t('adminUi.banners.displaying') },
    { value: 'inactive', label: t('adminUi.banners.hidden') },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAdd = () => {
    setEditingBanner(null);
    setForm({ title: '', imageUrl: '', linkUrl: '', position: 'hero', status: 'active', order: 1, startDate: '', endDate: '' });
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({ title: banner.title, imageUrl: banner.imageUrl, linkUrl: banner.linkUrl, position: banner.position, status: banner.status, order: banner.order, startDate: banner.startDate || '', endDate: banner.endDate || '' });
    setImagePreview(banner.imageUrl);
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.imageUrl.trim()) return;
    const now = new Date().toISOString().split('T')[0];
    if (editingBanner) {
      dispatch(updateBanner({
        ...editingBanner,
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim(),
        position: form.position,
        status: form.status,
        order: form.order,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        updatedAt: now,
      }));
    } else {
      const newBanner: Banner = {
        id: `b-${Date.now()}`,
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim(),
        position: form.position,
        status: form.status,
        order: form.order,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        createdAt: now,
        updatedAt: now,
      };
      dispatch(addBanner(newBanner));
    }
    setModalOpen(false);
  };

  const hasActiveFilters = search || positionFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch('');
    setPositionFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const activeCount = allBanners.filter((b) => !b.deletedAt).length;
  const trashCount = allBanners.filter((b) => !!b.deletedAt).length;

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">{t('adminUi.pageTitles.banners')}</h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === 'active' ? `${filtered.length} / ${activeCount} ${t('adminUi.banners.banners')}` : `${filtered.length} / ${trashCount} ${t('adminUi.jobs.deleted')}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'banner', label: t('adminUi.columns.banner') },
                { key: 'position', label: t('adminUi.columns.position') },
                { key: 'status', label: t('adminUi.columns.status') },
                { key: 'order', label: t('adminUi.columns.order') },
                { key: 'time', label: t('adminUi.columns.time') },
                { key: 'createdAt', label: t('adminUi.columns.createdAt') },
                { key: 'actions', label: t('adminUi.columns.actions') },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === 'active' && (
              <button
                onClick={openAdd}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
              >
                <i className="ri-add-line"></i> {t('adminUi.banners.addBanner')}
              </button>
            )}
            <button
              onClick={() => { setViewMode('active'); clearFilters(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'active' ? 'bg-primary-100 text-primary-700' : 'text-foreground-500 hover:bg-background-100'
              }`}
            >
              <i className="ri-image-line mr-1"></i>{t('adminUi.actions.active')}</button>
            <button
              onClick={() => { setViewMode('trash'); clearFilters(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'text-foreground-500 hover:bg-background-100'
              }`}
            >
              <i className="ri-delete-bin-line mr-1"></i>{t('adminUi.actions.trash')} {trashCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{trashCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="relative flex-1 w-full sm:max-w-[240px]">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('adminUi.banners.titlePlaceholder')}
                className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
              />
            </div>
            <CustomSelect
              value={positionFilter}
              options={positionOptions}
              onChange={setPositionFilter}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              compact
              className="w-full sm:w-[160px]"
            />
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title={t('adminUi.jobs.dateFrom')} />
            <span className="text-xs text-foreground-400">{t('adminUi.jobs.to')}</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title={t('adminUi.jobs.dateTo')} />
          </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-foreground-500 hover:text-foreground-700 hover:bg-background-100 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <i className="ri-filter-off-line"></i>{t('adminUi.actions.clearFilters')}</button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'trash' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            {t('adminUi.banners.trashInfo')}
          </p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label="BANNER" field="title" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label={t('adminUi.columns.position').toUpperCase()} field="position" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.status').toUpperCase()}</th>
                <SortHeader label={t('adminUi.columns.order').toUpperCase()} field="order" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.time').toUpperCase()}</th>
                <SortHeader label={t('adminUi.columns.createdAt').toUpperCase()} field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.deletedAt').toUpperCase()}</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.actions').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBanners.map((banner) => (
                <tr key={banner.id} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded-lg bg-background-100 overflow-hidden border border-background-200/50 flex-shrink-0">
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => setDetailBanner(banner)}
                          className="text-foreground-900 font-medium text-sm truncate hover:text-primary-500 transition-colors cursor-pointer text-left block"
                        >
                          {banner.title}
                        </button>
                        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline truncate block">
                          {banner.linkUrl}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium flex items-center gap-1 inline-flex">
                      <i className={`${positionConfig[banner.position]?.icon || 'ri-image-line'} text-[10px]`}></i>
                      {positionConfig[banner.position]?.label || banner.position}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {viewMode === 'active' ? (
                      <button
                        onClick={() => dispatch(toggleBannerStatus(banner.id))}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                          banner.status === 'active'
                            ? 'bg-accent-100 text-accent-600 hover:bg-accent-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {banner.status === 'active' ? t('adminUi.banners.show') : t('adminUi.banners.hide')}
                      </button>
                    ) : (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        banner.status === 'active' ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {banner.status === 'active' ? t('adminUi.banners.show') : t('adminUi.banners.hide')}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">{banner.order}</td>
                  <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                    {banner.startDate ? `${banner.startDate}` : '—'}
                    {banner.endDate ? ` → ${banner.endDate}` : ''}
                  </td>
                  <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{banner.createdAt}</td>
                  {viewMode === 'trash' && (
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {banner.deletedAt ? new Date(banner.deletedAt).toLocaleDateString('vi-VN') : ''}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right whitespace-nowrap relative">
                    {confirmSoftDelete === banner.id && viewMode === 'active' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(deleteBanner(banner.id)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">{t('adminUi.jobs.confirmDelete')}</button>
                        <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                      </div>
                    ) : confirmPermanentDelete === banner.id && viewMode === 'trash' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(permanentDeleteBanner(banner.id)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">{t('adminUi.jobs.deletePermanent')}</button>
                        <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <button onClick={() => setDropdownOpen(dropdownOpen === banner.id ? null : banner.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer">
                          <i className="ri-more-2-fill text-foreground-500"></i>
                        </button>
                        {dropdownOpen === banner.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                            {viewMode === 'active' ? (
                              <>
                                <button onClick={() => { setDetailBanner(banner); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
                                <button onClick={() => openEdit(banner)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-edit-line text-accent-500"></i>{t('adminUi.jobs.edit')}</button>
                                <button onClick={() => { setConfirmSoftDelete(banner.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                  <i className="ri-delete-bin-line"></i>{t('adminUi.jobs.confirmDelete')}</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { dispatch(restoreBanner(banner.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                  <i className="ri-arrow-go-back-line"></i>{t('adminUi.jobs.restore')}</button>
                                <button onClick={() => { setDetailBanner(banner); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
                                <button onClick={() => { setConfirmPermanentDelete(banner.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                  <i className="ri-delete-bin-6-line"></i>{t('adminUi.jobs.deletePermanent')}</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-image-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === 'active'
                ? (hasActiveFilters ? t('adminUi.banners.noBannersFiltered') : t('adminUi.banners.noBannersFound'))
                : t('adminUi.jobs.trashEmpty')}
            </p>
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        )}
      </div>

      {/* Detail Modal */}
      {detailBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailBanner(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{detailBanner.title}</h3>
              <button onClick={() => setDetailBanner(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="mb-5 rounded-xl overflow-hidden border border-background-200/50">
              <img src={detailBanner.imageUrl} alt={detailBanner.title} className="w-full h-48 object-cover" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.columns.position')}</span>
                <span className="text-sm font-medium text-foreground-800">{positionConfig[detailBanner.position]?.label || detailBanner.position}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.columns.status')}</span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${detailBanner.status === 'active' ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                  {detailBanner.status === 'active' ? t('adminUi.banners.show') : t('adminUi.banners.hide')}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.columns.order')}</span>
                <span className="text-sm font-medium text-foreground-800">{detailBanner.order}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Link</span>
                <a href={detailBanner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-500 hover:underline max-w-[60%] truncate">{detailBanner.linkUrl}</a>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.banners.startDate')}</span>
                <span className="text-sm font-medium text-foreground-800">{detailBanner.startDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.banners.endDate')}</span>
                <span className="text-sm font-medium text-foreground-800">{detailBanner.endDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.columns.createdAt')}</span>
                <span className="text-sm font-medium text-foreground-800">{detailBanner.createdAt}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.banners.updated')}</span>
                <span className="text-sm font-medium text-foreground-800">{detailBanner.updatedAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDetailBanner(null)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.close')}</button>
              {viewMode === 'active' && (
                <button onClick={() => { setDetailBanner(null); openEdit(detailBanner); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.edit')}</button>
              )}
              {viewMode === 'trash' && (
                <button onClick={() => { dispatch(restoreBanner(detailBanner.id)); setDetailBanner(null); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.restore')}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{editingBanner ? t('adminUi.banners.editBanner') : t('adminUi.banners.addBanner')}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.title')}</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder={t('adminUi.banners.titleExample')} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.image')}</label>
                {imagePreview ? (
                  <div className="relative mb-3">
                    <img src={imagePreview} alt="Preview" className="w-full h-36 rounded-xl object-cover" />
                    <button onClick={() => { setImagePreview(''); setForm((p) => ({ ...p, imageUrl: '' })); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"><i className="ri-close-line text-xs"></i></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-background-200/70 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-background-100 transition-colors mb-2">
                    <i className="ri-image-add-line text-2xl text-foreground-400 mb-1"></i>
                    <span className="text-sm text-foreground-500">{t('adminUi.banners.uploadImage')}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
                <input type="text" value={form.imageUrl} onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setImagePreview(e.target.value); }} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder={t('adminUi.businessConfig.orEnterUrl')} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.banners.targetLink')}</label>
                <input type="text" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="/jobs hoặc https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.position')}</label>
                <CustomSelect
                  value={form.position}
                  options={[
                    { value: 'hero', label: 'Hero' },
                    { value: 'sidebar', label: 'Sidebar' },
                    { value: 'footer', label: 'Footer' },
                    { value: 'popup', label: 'Popup' },
                  ]}
                  onChange={(v) => setForm({ ...form, position: v as Banner['position'] })}
                  compact
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.status')}</label>
                <CustomSelect
                  value={form.status}
                  options={[
                    { value: 'active', label: t('adminUi.banners.show') },
                    { value: 'inactive', label: t('adminUi.banners.hide') },
                  ]}
                  onChange={(v) => setForm({ ...form, status: v as Banner['status'] })}
                  compact
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.order')}</label>
                <input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.banners.startDate')}</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.banners.endDate')}</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.actions.cancel')}</button>
              <button onClick={handleSave} disabled={!form.title.trim() || !form.imageUrl.trim()} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${form.title.trim() && form.imageUrl.trim() ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>
                {editingBanner ? t('adminUi.jobs.saveChanges') : t('adminUi.banners.addBanner')}
              </button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>}
    </div>
  );
}