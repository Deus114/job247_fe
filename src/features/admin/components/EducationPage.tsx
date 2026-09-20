import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addEducationLevel, updateEducationLevel, softDeleteEducationLevel, restoreEducationLevel, permanentDeleteEducationLevel, toggleEducationLevelActive } from '@/store/slices/jobSlice';
import type { EducationLevelItem } from '@/types/job';
import SortHeader from '@/components/ui/SortHeader';
import ColumnVisibilityDropdown from '@/components/ui/ColumnVisibilityDropdown';
import Pagination from '@/components/ui/Pagination';
import { useTableActionMenu, TableActionMenu } from '@/components/ui/TableActionMenu';

type SortField = 'name' | 'count' | 'createdAt';

export default function EducationPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const allLevels = useAppSelector((state) => state.jobs.educationLevels);
  const deletedLevels = useAppSelector((state) => state.jobs.deletedEducationLevels || []);
  const allJobs = useAppSelector((state) => state.jobs.items);
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<string>();
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<EducationLevelItem | null>(null);
  const [detailLevel, setDetailLevel] = useState<EducationLevelItem | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['level','count','companies','active','createdAt','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field as SortField); setSortOrder('asc'); }
  };

  const visibleLevels = useMemo(() => {
    return viewMode === 'active' ? allLevels : deletedLevels;
  }, [viewMode, allLevels, deletedLevels]);

  const filtered = useMemo(() => {
    let list = visibleLevels.filter((l) => {
      const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase());
      const matchFrom = !dateFrom || (l.createdAt || '') >= dateFrom;
      const matchTo = !dateTo || (l.createdAt || '') <= dateTo;
      return matchSearch && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      if (sortField === 'count') {
        const aCount = allJobs.filter((j) => !j.deletedAt && j.educationLevel === a.name).length;
        const bCount = allJobs.filter((j) => !j.deletedAt && j.educationLevel === b.name).length;
        return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
      }
      const aVal = (sortField === 'name' ? a.name : a.createdAt) || '';
      const bVal = (sortField === 'name' ? b.name : b.createdAt) || '';
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visibleLevels, search, dateFrom, dateTo, sortField, sortOrder, allJobs]);

  const paginatedLevels = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [search, dateFrom, dateTo, viewMode, pageSize]);

  const openAdd = () => {
    setEditingLevel(null);
    setFormName('');
    setModalOpen(true);
  };

  const openEdit = (lvl: EducationLevelItem) => {
    setEditingLevel(lvl);
    setFormName(lvl.name);
    setModalOpen(true);
    close();
  };

  const openDetail = (lvl: EducationLevelItem) => {
    setDetailLevel(lvl);
  };

  const handleSave = () => {
    const trimmed = formName.trim();
    if (!trimmed) return;
    if (editingLevel) {
      dispatch(updateEducationLevel({ oldName: editingLevel.name, newName: trimmed }));
    } else {
      if (allLevels.some((l) => l.name === trimmed) || deletedLevels.some((l) => l.name === trimmed)) return;
      dispatch(addEducationLevel(trimmed));
    }
    setModalOpen(false);
  };

  const activeCount = allLevels.length;
  const trashCount = deletedLevels.length;
  const activeItem = paginatedLevels.find((x) => x.name === openId);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">{t('adminUi.pageTitles.education')}</h2>
            <p className="text-sm text-foreground-500 mt-1">{viewMode === 'active' ? `${filtered.length} / ${activeCount} ${t('adminUi.education.levels')}` : `${filtered.length} / ${trashCount} ${t('adminUi.jobs.deleted')}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'level', label: t('adminUi.columns.level') },
                { key: 'count', label: t('adminUi.columns.jobPosts') },
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
                <i className="ri-add-line"></i> {t('adminUi.education.addLevel')}
              </button>
            )}
            <button onClick={() => { setViewMode('active'); setSearch(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${viewMode === 'active' ? 'bg-primary-100 text-primary-700' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-graduation-cap-line mr-1"></i>{t('adminUi.actions.active')}</button>
            <button onClick={() => { setViewMode('trash'); setSearch(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-delete-bin-line mr-1"></i>{t('adminUi.actions.trash')} {trashCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{trashCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[200px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminUi.education.searchPlaceholder')} className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" />
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
          <p className="text-sm text-yellow-700"><i className="ri-information-line mr-1"></i>{t('adminUi.education.trashInfo')}</p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label={t('adminUi.columns.level').toUpperCase()} field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label={t('adminUi.columns.jobPosts').toUpperCase()} field="count" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.company').toUpperCase()}</th>
                <SortHeader label={t('adminUi.columns.createdAt').toUpperCase()} field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.active').toUpperCase()}</th>
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.deletedAt').toUpperCase()}</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 w-[80px]">{t('adminUi.columns.actions').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLevels.map((lvl) => {
                const linkedJobs = allJobs.filter((j) => !j.deletedAt && j.educationLevel === lvl.name);
                const linkedCompanies = [...new Set(linkedJobs.map((j) => j.company))];
                return (
                  <tr key={lvl.name} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                          <i className="ri-graduation-cap-line text-accent-500"></i>
                        </div>
                        <button onClick={() => openDetail(lvl)} className="font-medium text-foreground-900 hover:text-primary-500 transition-colors cursor-pointer text-left">{lvl.name}</button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">{t('adminUi.education.postsCount', { count: linkedJobs.length })}</span>
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs max-w-[200px] truncate">
                      {linkedCompanies.length > 0 ? linkedCompanies.slice(0, 3).join(', ') + (linkedCompanies.length > 3 ? ` +${linkedCompanies.length - 3}` : '') : t('adminUi.common.notAvailable')}
                    </td>
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{lvl.createdAt || '—'}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {viewMode === 'active' ? (
                        <button
                          onClick={() => dispatch(toggleEducationLevelActive(lvl.name))}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${lvl.isActive !== false ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          {lvl.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${lvl.isActive !== false ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                          {lvl.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                        </span>
                      )}
                    </td>
                    {viewMode === 'trash' && <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{lvl.deletedAt ? new Date(lvl.deletedAt).toLocaleDateString('vi-VN') : '—'}</td>}
                    <td className="px-5 py-3 text-right whitespace-nowrap relative">
                      {confirmSoftDelete === lvl.name && viewMode === 'active' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(softDeleteEducationLevel(lvl.name)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">{t('adminUi.jobs.confirmDelete')}</button>
                          <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                        </div>
                      ) : confirmPermanentDelete === lvl.name && viewMode === 'trash' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(permanentDeleteEducationLevel(lvl.name)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">{t('adminUi.jobs.deletePermanent')}</button>
                          <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                        </div>
                      ) : (
                          <button type="button" onClick={(e) => toggle(lvl.name, e)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer">
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
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
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4"><i className="ri-graduation-cap-line text-2xl text-foreground-400"></i></div>
            <p className="text-sm text-foreground-500">{viewMode === 'active' ? (search ? t('adminUi.education.noLevelsFiltered') : t('adminUi.education.noLevelsFound')) : t('adminUi.jobs.trashEmpty')}</p>
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        )}
      </div>

      {/* Detail Modal */}
      {detailLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailLevel(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center"><i className="ri-graduation-cap-line text-accent-600"></i></div>
                <h3 className="text-lg font-heading font-semibold text-foreground-950">{detailLevel.name}</h3>
              </div>
              <button onClick={() => setDetailLevel(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            {(() => {
              const linkedJobs = allJobs.filter((j) => !j.deletedAt && j.educationLevel === detailLevel.name);
              const linkedCompanies = [...new Set(linkedJobs.map((j) => j.company))];
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background-100 rounded-xl"><p className="text-xs text-foreground-500">{t('adminUi.education.jobPostCount')}</p><p className="text-xl font-bold text-foreground-900">{linkedJobs.length}</p></div>
                    <div className="p-3 bg-background-100 rounded-xl"><p className="text-xs text-foreground-500">{t('adminUi.education.companyCount')}</p><p className="text-xl font-bold text-foreground-900">{linkedCompanies.length}</p></div>
                  </div>
                  {linkedJobs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground-800 mb-2">{t('adminUi.education.linkedJobs')}</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {linkedJobs.slice(0, 10).map((job) => (
                          <div key={job.id} className="flex items-center justify-between p-2.5 bg-background-100 rounded-lg">
                            <div><p className="text-sm font-medium text-foreground-800">{job.title}</p><p className="text-xs text-foreground-500">{job.company} · {job.location}</p></div>
                            <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full text-[10px] font-medium">{job.salary}</span>
                          </div>
                        ))}
                        {linkedJobs.length > 10 && <p className="text-xs text-foreground-400 text-center">{t('adminUi.education.morePosts', { count: linkedJobs.length - 10 })}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailLevel(null)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.close')}</button>
              {viewMode === 'active' && (
                <button onClick={() => { setDetailLevel(null); openEdit(detailLevel); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.edit')}</button>
              )}
              {viewMode === 'trash' && (
                <button onClick={() => { dispatch(restoreEducationLevel(detailLevel.name)); setDetailLevel(null); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.restore')}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{editingLevel ? t('adminUi.education.editLevel') : t('adminUi.education.addLevel')}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.education.levelName')}</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder={t('adminUi.education.namePlaceholder')} />
              {!editingLevel && allLevels.some((l) => l.name === formName.trim()) && <p className="text-xs text-red-500 mt-1">{t('adminUi.education.nameExists')}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.actions.cancel')}</button>
              <button onClick={handleSave} disabled={!formName.trim() || (editingLevel ? formName.trim() === editingLevel.name : allLevels.some((l) => l.name === formName.trim()))} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${formName.trim() && !(editingLevel ? formName.trim() === editingLevel.name : allLevels.some((l) => l.name === formName.trim())) ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>
                {editingLevel ? t('adminUi.jobs.saveChanges') : t('adminUi.education.addLevel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <TableActionMenu open={openId != null && !!activeItem} pos={pos} menuRef={menuRef}>
        {activeItem && viewMode === 'active' ? (
          <>
            <button type="button" onClick={() => { openDetail(activeItem); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
              <i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
            <button type="button" onClick={() => openEdit(activeItem)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
              <i className="ri-edit-line text-accent-500"></i>{t('adminUi.jobs.edit')}</button>
            <button type="button" onClick={() => { setConfirmSoftDelete(activeItem.name); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
              <i className="ri-delete-bin-line"></i>{t('adminUi.jobs.confirmDelete')}</button>
          </>
        ) : activeItem ? (
          <>
            <button type="button" onClick={() => { dispatch(restoreEducationLevel(activeItem.name)); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
              <i className="ri-arrow-go-back-line"></i>{t('adminUi.jobs.restore')}</button>
            <button type="button" onClick={() => { openDetail(activeItem); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
              <i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
            <button type="button" onClick={() => { setConfirmPermanentDelete(activeItem.name); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
              <i className="ri-delete-bin-6-line"></i>{t('adminUi.jobs.deletePermanent')}</button>
          </>
        ) : null}
      </TableActionMenu>
    </div>
  );
}