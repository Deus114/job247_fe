import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addCategory, updateCategory, softDeleteCategory, restoreCategory, permanentDeleteCategory, toggleCategoryActive } from '@/store/slices/jobSlice';
import type { CategoryItem } from '@/types/job';
import SortHeader from '@/components/ui/SortHeader';
import ColumnVisibilityDropdown from '@/components/ui/ColumnVisibilityDropdown';
import Pagination from '@/components/ui/Pagination';

type SortField = 'name' | 'count' | 'createdAt';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const allCategories = useAppSelector((state) => state.jobs.categories);
  const deletedCategories = useAppSelector((state) => state.jobs.deletedCategories || []);
  const allJobs = useAppSelector((state) => state.jobs.items);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailCat, setDetailCat] = useState<CategoryItem | null>(null);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', image: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['image','name','count','companies','active','createdAt','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field as SortField); setSortOrder('asc'); }
  };

  const visibleCategories = useMemo(() => {
    return viewMode === 'active' ? allCategories : deletedCategories;
  }, [viewMode, allCategories, deletedCategories]);

  const filtered = useMemo(() => {
    let list = visibleCategories.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      const matchFrom = !dateFrom || (c.createdAt || '') >= dateFrom;
      const matchTo = !dateTo || (c.createdAt || '') <= dateTo;
      return matchSearch && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      if (sortField === 'count') {
        const aCount = allJobs.filter((j) => !j.deletedAt && j.category === a.name).length;
        const bCount = allJobs.filter((j) => !j.deletedAt && j.category === b.name).length;
        return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
      }
      const aVal = (sortField === 'name' ? a.name : a.createdAt) || '';
      const bVal = (sortField === 'name' ? b.name : b.createdAt) || '';
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visibleCategories, search, dateFrom, dateTo, sortField, sortOrder, allJobs]);

  const paginatedCats = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [search, dateFrom, dateTo, viewMode, pageSize]);

  const openAdd = () => {
    setEditingCat(null);
    setForm({ name: '', image: '' });
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryItem) => {
    setEditingCat(cat);
    setForm({ name: cat.name, image: cat.image || '' });
    setImagePreview(cat.image || '');
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const openDetail = (cat: CategoryItem) => {
    setDetailCat(cat);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setForm({ ...form, image: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const trimmed = form.name.trim();
    if (!trimmed) return;
    if (editingCat) {
      dispatch(updateCategory({ oldName: editingCat.name, newName: trimmed, image: form.image || undefined }));
    } else {
      if (allCategories.some((c) => c.name === trimmed) || deletedCategories.some((c) => c.name === trimmed)) return;
      dispatch(addCategory({ name: trimmed, image: form.image || undefined }));
    }
    setModalOpen(false);
  };

  const activeCount = allCategories.length;
  const trashCount = deletedCategories.length;

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">{t('adminUi.pageTitles.categories')}</h2>
            <p className="text-sm text-foreground-500 mt-1">{viewMode === 'active' ? `${filtered.length} / ${activeCount} ${t('adminUi.categories.categories')}` : `${filtered.length} / ${trashCount} ${t('adminUi.jobs.deleted')}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'image', label: t('adminUi.columns.image') },
                { key: 'name', label: t('adminUi.columns.category') },
                { key: 'count', label: t('adminUi.columns.postCount') },
                { key: 'companies', label: t('adminUi.columns.company') },
                { key: 'active', label: t('adminUi.columns.active') },
                { key: 'createdAt', label: t('adminUi.columns.createdAt') },
                { key: 'actions', label: t('adminUi.columns.actions') },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === 'active' && (
              <button onClick={openAdd} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
                <i className="ri-add-line"></i> {t('adminUi.categories.addCategory')}
              </button>
            )}
            <button onClick={() => { setViewMode('active'); setSearch(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${viewMode === 'active' ? 'bg-primary-100 text-primary-700' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-price-tag-3-line mr-1"></i>{t('adminUi.actions.active')}</button>
            <button onClick={() => { setViewMode('trash'); setSearch(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-delete-bin-line mr-1"></i>{t('adminUi.actions.trash')} {trashCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{trashCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[200px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminUi.categories.searchPlaceholder')} className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" />
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title={t('adminUi.jobs.dateFrom')} />
            <span className="text-xs text-foreground-400">{t('adminUi.jobs.to')}</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title={t('adminUi.jobs.dateTo')} />
          </div>
          {(search || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }} className="px-3 py-2 text-sm text-foreground-500 hover:text-foreground-700 hover:bg-background-100 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1">
              <i className="ri-filter-off-line"></i>{t('adminUi.actions.clearFilters')}</button>
          )}
        </div>
      </div>

      {viewMode === 'trash' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700"><i className="ri-information-line mr-1"></i>{t('adminUi.categories.trashInfo')}</p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 w-[60px]">{t('adminUi.columns.image').toUpperCase()}</th>
                <SortHeader label={t('adminUi.columns.category').toUpperCase()} field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label={t('adminUi.columns.postCount').toUpperCase()} field="count" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.company').toUpperCase()}</th>
                <SortHeader label={t('adminUi.columns.createdAt').toUpperCase()} field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.active').toUpperCase()}</th>
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.deletedAt').toUpperCase()}</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 w-[80px]">{t('adminUi.columns.actions').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCats.map((cat) => {
                const linkedJobs = allJobs.filter((j) => !j.deletedAt && j.category === cat.name);
                const linkedCompanies = [...new Set(linkedJobs.map((j) => j.company))];
                return (
                  <tr key={cat.name} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                    <td className="px-5 py-3">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0">
                          <i className="ri-price-tag-3-line text-sm text-foreground-400"></i>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openDetail(cat)} className="font-medium text-foreground-900 hover:text-primary-500 transition-colors cursor-pointer text-left">{cat.name}</button>
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">{linkedJobs.length} tin</span>
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs max-w-[200px] truncate">
                      {linkedCompanies.length > 0 ? linkedCompanies.slice(0, 3).join(', ') + (linkedCompanies.length > 3 ? ` +${linkedCompanies.length - 3}` : '') : t('adminUi.common.notAvailable')}
                    </td>
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{cat.createdAt || '—'}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {viewMode === 'active' ? (
                        <button
                          onClick={() => dispatch(toggleCategoryActive(cat.name))}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${cat.isActive !== false ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          {cat.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${cat.isActive !== false ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                          {cat.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                        </span>
                      )}
                    </td>
                    {viewMode === 'trash' && <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{cat.deletedAt ? new Date(cat.deletedAt).toLocaleDateString('vi-VN') : '—'}</td>}
                    <td className="px-5 py-3 text-right whitespace-nowrap relative">
                      {confirmSoftDelete === cat.name && viewMode === 'active' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(softDeleteCategory(cat.name)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">{t('adminUi.jobs.confirmDelete')}</button>
                          <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                        </div>
                      ) : confirmPermanentDelete === cat.name && viewMode === 'trash' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(permanentDeleteCategory(cat.name)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">{t('adminUi.jobs.deletePermanent')}</button>
                          <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <button onClick={() => setDropdownOpen(dropdownOpen === cat.name ? null : cat.name)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer">
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
                          {dropdownOpen === cat.name && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                              {viewMode === 'active' ? (
                                <>
                                  <button onClick={() => { openDetail(cat); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
                                  <button onClick={() => openEdit(cat)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-edit-line text-accent-500"></i>{t('adminUi.jobs.edit')}</button>
                                  <button onClick={() => { setConfirmSoftDelete(cat.name); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                    <i className="ri-delete-bin-line"></i>{t('adminUi.jobs.confirmDelete')}</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { dispatch(restoreCategory(cat.name)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                    <i className="ri-arrow-go-back-line"></i>{t('adminUi.jobs.restore')}</button>
                                  <button onClick={() => { openDetail(cat); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
                                  <button onClick={() => { setConfirmPermanentDelete(cat.name); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                    <i className="ri-delete-bin-6-line"></i>{t('adminUi.jobs.deletePermanent')}</button>
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
              <i className="ri-price-tag-3-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">{viewMode === 'active' ? (search ? t('adminUi.categories.noCategoriesFiltered') : t('adminUi.categories.noCategoriesFound')) : t('adminUi.jobs.trashEmpty')}</p>
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        )}
      </div>

      {/* Detail Modal */}
      {detailCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailCat(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {detailCat.image ? (
                  <img src={detailCat.image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center"><i className="ri-price-tag-3-line text-xl text-primary-600"></i></div>
                )}
                <h3 className="text-lg font-heading font-semibold text-foreground-950">{detailCat.name}</h3>
              </div>
              <button onClick={() => setDetailCat(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            {(() => {
              const linkedJobs = allJobs.filter((j) => !j.deletedAt && j.category === detailCat.name);
              const linkedCompanies = [...new Set(linkedJobs.map((j) => j.company))];
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background-100 rounded-xl"><p className="text-xs text-foreground-500">{t('adminUi.education.jobPostCount')}</p><p className="text-xl font-bold text-foreground-900">{linkedJobs.length}</p></div>
                    <div className="p-3 bg-background-100 rounded-xl"><p className="text-xs text-foreground-500">{t('adminUi.categories.companyCount')}</p><p className="text-xl font-bold text-foreground-900">{linkedCompanies.length}</p></div>
                  </div>
                  {linkedJobs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground-800 mb-2">{t('adminUi.categories.linkedJobs')}</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {linkedJobs.slice(0, 10).map((job) => (
                          <div key={job.id} className="flex items-center justify-between p-2.5 bg-background-100 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-foreground-800">{job.title}</p>
                              <p className="text-xs text-foreground-500">{job.company} · {job.location}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full text-[10px] font-medium">{job.salary}</span>
                          </div>
                        ))}
                        {linkedJobs.length > 10 && <p className="text-xs text-foreground-400 text-center">{t('adminUi.categories.morePosts', { count: linkedJobs.length - 10 })}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailCat(null)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.close')}</button>
              {viewMode === 'active' && (
                <button onClick={() => { setDetailCat(null); openEdit(detailCat); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.edit')}</button>
              )}
              {viewMode === 'trash' && (
                <button onClick={() => { dispatch(restoreCategory(detailCat.name)); setDetailCat(null); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.restore')}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{editingCat ? t('adminUi.categories.editCategory') : t('adminUi.categories.addCategory')}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.categories.categoryName')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder={t('adminUi.categories.namePlaceholder')} />
                {!editingCat && allCategories.some((c) => c.name === form.name.trim()) && (
                  <p className="text-xs text-red-500 mt-1">{t('adminUi.categories.nameExists')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.image')}</label>
                {imagePreview ? (
                  <div className="relative mb-3">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 rounded-xl object-cover" />
                    <button onClick={() => { setImagePreview(''); setForm({ ...form, image: '' }); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                      <i className="ri-close-line text-xs"></i>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-background-200/70 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-background-100 transition-colors">
                    <i className="ri-image-add-line text-2xl text-foreground-400 mb-2"></i>
                    <span className="text-sm text-foreground-500">{t('adminUi.categories.uploadImage')}</span>
                    <span className="text-xs text-foreground-400 mt-1">{t('adminUi.categories.imageFormatHint')}</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
                {!imagePreview && (
                  <div className="mt-2">
                    <label className="text-xs text-foreground-500 mb-1 block">{t('adminUi.categories.orEnterUrl')}</label>
                    <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder="https://..." />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.actions.cancel')}</button>
              <button onClick={handleSave} disabled={!form.name.trim() || (!editingCat && allCategories.some((c) => c.name === form.name.trim()))} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${form.name.trim() && (editingCat || !allCategories.some((c) => c.name === form.name.trim())) ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>
                {editingCat ? t('adminUi.jobs.saveChanges') : t('adminUi.categories.addCategory')}
              </button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>}
    </div>
  );
}