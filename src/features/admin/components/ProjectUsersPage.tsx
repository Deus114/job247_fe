import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addProjectUser, updateProjectUser, deleteProjectUser,
  restoreProjectUser, permanentDeleteProjectUser, toggleProjectUserStatus,
} from '@/store/slices/projectUserSlice';
import type { ProjectUser } from '@/types/projectUser';
import CustomSelect from '@/components/ui/CustomSelect';
import SortHeader from '@/components/ui/SortHeader';
import ColumnVisibilityDropdown from '@/components/ui/ColumnVisibilityDropdown';
import Pagination from '@/components/ui/Pagination';
import { useTableActionMenu, TableActionMenu } from '@/components/ui/TableActionMenu';

type SortField = 'fullName' | 'createdAt' | 'lastLogin';

export default function ProjectUsersPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const allUsers = useAppSelector((state) => state.projectUsers.items);
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<string>();
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ProjectUser | null>(null);
  const [detailUser, setDetailUser] = useState<ProjectUser | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['user','type','info','status','createdAt','lastLogin','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [form, setForm] = useState<{
    fullName: string; email: string; phone: string; avatar: string;
    role: ProjectUser['role']; status: ProjectUser['status'];
    jobTitle: string; education: string; companyName: string;
  }>({
    fullName: '', email: '', phone: '', avatar: '',
    role: 'candidate', status: 'active',
    jobTitle: '', education: '', companyName: '',
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field as SortField);
      setSortOrder('asc');
    }
  };

  const visible = useMemo(() =>
    viewMode === 'active' ? allUsers.filter((u) => !u.deletedAt) : allUsers.filter((u) => !!u.deletedAt),
  [allUsers, viewMode]);

  const filtered = useMemo(() => {
    let list = visible.filter((u) => {
      const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.phone && u.phone.includes(search));
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchFrom = !dateFrom || u.createdAt >= dateFrom;
      const matchTo = !dateTo || u.createdAt <= dateTo;
      return matchSearch && matchRole && matchStatus && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visible, search, roleFilter, statusFilter, dateFrom, dateTo, sortField, sortOrder]);

  const paginatedUsers = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [search, roleFilter, statusFilter, dateFrom, dateTo, viewMode, pageSize]);

  const openAdd = () => {
    setEditingUser(null);
    setForm({ fullName: '', email: '', phone: '', avatar: '', role: 'candidate', status: 'active', jobTitle: '', education: '', companyName: '' });
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = (u: ProjectUser) => {
    setEditingUser(u);
    setForm({
      fullName: u.fullName, email: u.email, phone: u.phone || '', avatar: u.avatar || '',
      role: u.role, status: u.status,
      jobTitle: u.jobTitle || '', education: u.education || '', companyName: u.companyName || '',
    });
    setImagePreview(u.avatar || '');
    setModalOpen(true);
    close();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setForm((prev) => ({ ...prev, avatar: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!form.fullName.trim() || !form.email.trim()) return;
    if (editingUser) {
      dispatch(updateProjectUser({
        id: editingUser.id, fullName: form.fullName.trim(), email: form.email.trim(),
        phone: form.phone.trim() || undefined, avatar: form.avatar || undefined,
        role: form.role, status: form.status,
        jobTitle: form.role === 'candidate' ? form.jobTitle.trim() || undefined : undefined,
        education: form.role === 'candidate' ? form.education.trim() || undefined : undefined,
        companyName: form.role === 'recruiter' ? form.companyName.trim() || undefined : undefined,
      }));
    } else {
      const newUser: ProjectUser = {
        id: `pu-${Date.now()}`, fullName: form.fullName.trim(), email: form.email.trim(),
        phone: form.phone.trim() || undefined, avatar: form.avatar || undefined,
        role: form.role, status: form.status,
        jobTitle: form.role === 'candidate' ? form.jobTitle.trim() || undefined : undefined,
        education: form.role === 'candidate' ? form.education.trim() || undefined : undefined,
        companyName: form.role === 'recruiter' ? form.companyName.trim() || undefined : undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };
      dispatch(addProjectUser(newUser));
    }
    setModalOpen(false);
  };

  const clearFilters = () => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setDateFrom(''); setDateTo(''); };
  const hasActiveFilters = search || roleFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;
  const activeItem = paginatedUsers.find((x) => x.id === openId);
  const activeCount = allUsers.filter((u) => !u.deletedAt).length;
  const trashCount = allUsers.filter((u) => !!u.deletedAt).length;

  const roleOptions = [
    { value: 'all', label: t('adminUi.filters.allRoles') },
    { value: 'candidate', label: t('adminUi.projectUsers.candidate') },
    { value: 'recruiter', label: t('adminUi.projectUsers.recruiter') },
  ];
  const statusOptions = [
    { value: 'all', label: t('adminUi.filters.allStatuses') },
    { value: 'active', label: t('adminUi.status.active') },
    { value: 'inactive', label: t('adminUi.status.inactive') },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">{t('adminUi.pageTitles.projectUsers')}</h2>
            <p className="text-sm text-foreground-500 mt-1">{viewMode === 'active' ? `${filtered.length} / ${activeCount} ${t('adminUi.projectUsers.users')}` : `${filtered.length} / ${trashCount} ${t('adminUi.jobs.deleted')}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'user', label: t('adminUi.columns.user') },
                { key: 'type', label: t('adminUi.columns.type') },
                { key: 'info', label: t('adminUi.columns.extraInfo') },
                { key: 'status', label: t('adminUi.columns.status') },
                { key: 'createdAt', label: t('adminUi.columns.createdAt') },
                { key: 'lastLogin', label: t('adminUi.columns.lastLogin') },
                { key: 'actions', label: t('adminUi.columns.actions') },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === 'active' && (
              <button onClick={openAdd} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
                <i className="ri-add-line"></i> {t('adminUi.projectUsers.addUser')}
              </button>
            )}
            <button onClick={() => { setViewMode('active'); clearFilters(); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${viewMode === 'active' ? 'bg-primary-100 text-primary-700' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-team-line mr-1"></i>{t('adminUi.actions.active')}</button>
            <button onClick={() => { setViewMode('trash'); clearFilters(); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-delete-bin-line mr-1"></i>{t('adminUi.actions.trash')} {trashCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{trashCount}</span>}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[220px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminUi.projectUsers.searchPlaceholder')} className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" />
          </div>
          <CustomSelect value={roleFilter} options={roleOptions} onChange={setRoleFilter} compact className="w-full sm:w-[160px]" />
          <CustomSelect value={statusFilter} options={statusOptions} onChange={setStatusFilter} compact className="w-full sm:w-[160px]" />
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title={t('adminUi.jobs.dateFrom')} />
            <span className="text-xs text-foreground-400">{t('adminUi.jobs.to')}</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title={t('adminUi.jobs.dateTo')} />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm text-foreground-500 hover:text-foreground-700 hover:bg-background-100 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1">
              <i className="ri-filter-off-line"></i>{t('adminUi.actions.clearFilters')}</button>
          )}
        </div>
      </div>

      {viewMode === 'trash' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700"><i className="ri-information-line mr-1"></i>{t('adminUi.projectUsers.trashInfo')}</p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label={t('adminUi.columns.user').toUpperCase()} field="fullName" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.type').toUpperCase()}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.extraInfo').toUpperCase()}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.status').toUpperCase()}</th>
                <SortHeader label={t('adminUi.columns.createdAt').toUpperCase()} field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label={t('adminUi.columns.lastLogin').toUpperCase()} field="lastLogin" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.deletedAt').toUpperCase()}</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">{t('adminUi.columns.actions').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-background-200 flex items-center justify-center flex-shrink-0"><i className="ri-user-line text-sm text-foreground-400"></i></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-foreground-900 font-medium text-sm truncate">{u.fullName}</p>
                        <p className="text-xs text-foreground-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${u.role === 'recruiter' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
                      {u.role === 'recruiter' ? t('adminUi.projectUsers.recruiter') : t('adminUi.projectUsers.candidate')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-foreground-600 text-xs">
                    {u.role === 'recruiter' ? u.companyName || '—' : u.jobTitle || '—'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {viewMode === 'active' ? (
                      <button onClick={() => dispatch(toggleProjectUserStatus(u.id))} className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${u.status === 'active' ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        {u.status === 'active' ? t('adminUi.status.active') : t('adminUi.status.inactive')}
                      </button>
                    ) : (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${u.status === 'active' ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                        {u.status === 'active' ? t('adminUi.status.active') : t('adminUi.status.inactive')}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{u.createdAt}</td>
                  <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{u.lastLogin || '—'}</td>
                  {viewMode === 'trash' && (
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {u.deletedAt ? new Date(u.deletedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right whitespace-nowrap relative">
                    {confirmSoftDelete === u.id && viewMode === 'active' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(deleteProjectUser(u.id)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">{t('adminUi.jobs.confirmDelete')}</button>
                        <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                      </div>
                    ) : confirmPermanentDelete === u.id && viewMode === 'trash' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(permanentDeleteProjectUser(u.id)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">{t('adminUi.jobs.deletePermanent')}</button>
                        <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                      </div>
                    ) : (
                        <button type="button" onClick={(e) => toggle(u.id, e)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-more-2-fill text-foreground-500"></i></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4"><i className="ri-user-search-line text-2xl text-foreground-400"></i></div>
            <p className="text-sm text-foreground-500">{viewMode === 'active' ? (hasActiveFilters ? t('adminUi.projectUsers.noUsersFiltered') : t('adminUi.projectUsers.noUsersFound')) : t('adminUi.jobs.trashEmpty')}</p>
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        )}
      </div>

      {/* Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailUser(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{t('adminUi.projectUsers.userDetail')}</h3>
              <button onClick={() => setDetailUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="flex flex-col items-center mb-5">
              {detailUser.avatar ? (
                <img src={detailUser.avatar} alt="" className="w-20 h-20 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-background-200 flex items-center justify-center mb-3"><i className="ri-user-line text-2xl text-foreground-400"></i></div>
              )}
              <h4 className="text-lg font-semibold text-foreground-950">{detailUser.fullName}</h4>
              <span className={`mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${detailUser.role === 'recruiter' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
                {detailUser.role === 'recruiter' ? t('adminUi.projectUsers.recruiter') : t('adminUi.projectUsers.candidate')}
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Email', value: detailUser.email },
                { label: t('adminUi.columns.phone'), value: detailUser.phone || t('adminUi.common.notUpdated') },
                { label: t('adminUi.columns.status'), value: detailUser.status === 'active' ? t('adminUi.status.active') : t('adminUi.status.inactive') },
                { label: detailUser.role === 'recruiter' ? t('adminUi.columns.company') : t('adminUi.projectUsers.jobPosition'), value: detailUser.role === 'recruiter' ? (detailUser.companyName || '—') : (detailUser.jobTitle || '—') },
                ...(detailUser.role === 'candidate' ? [{ label: t('adminUi.projectUsers.educationField'), value: detailUser.education || '—' }] : []),
                { label: t('adminUi.columns.createdAt'), value: detailUser.createdAt },
                { label: t('adminUi.projectUsers.lastLogin'), value: detailUser.lastLogin || t('adminUi.common.notAvailable') },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-background-100">
                  <span className="text-sm text-foreground-500">{label}</span>
                  <span className="text-sm font-medium text-foreground-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailUser(null)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.close')}</button>
              {viewMode === 'active' && <button onClick={() => { setDetailUser(null); openEdit(detailUser); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.edit')}</button>}
              {viewMode === 'trash' && <button onClick={() => { dispatch(restoreProjectUser(detailUser.id)); setDetailUser(null); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.restore')}</button>}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{editingUser ? t('adminUi.projectUsers.editUser') : t('adminUi.projectUsers.addUser')}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.users.avatar')}</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="" className="w-16 h-16 rounded-full object-cover" />
                      <button onClick={() => { setImagePreview(''); setForm((p) => ({ ...p, avatar: '' })); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"><i className="ri-close-line text-[10px]"></i></button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-background-200 flex items-center justify-center"><i className="ri-user-line text-xl text-foreground-400"></i></div>
                  )}
                  <label className="px-3 py-2 border border-background-300 rounded-xl text-sm text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer">
                    <i className="ri-upload-line mr-1"></i> {t('adminUi.projectUsers.uploadAvatar')}
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.fullName')} *</label>
                  <input type="text" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder={t('adminUi.projectUsers.fullNamePlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.phone')}</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="0912345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.projectUsers.accountType')}</label>
                  <CustomSelect value={form.role} options={[{ value: 'candidate', label: t('adminUi.projectUsers.candidate') }, { value: 'recruiter', label: t('adminUi.projectUsers.recruiter') }]} onChange={(v) => setForm((p) => ({ ...p, role: v as ProjectUser['role'] }))} />
                </div>
              </div>
              {form.role === 'candidate' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.projectUsers.jobPosition')}</label>
                    <input type="text" value={form.jobTitle} onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="VD: Frontend Developer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.projectUsers.educationField')}</label>
                    <input type="text" value={form.education} onChange={(e) => setForm((p) => ({ ...p, education: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder={t('adminUi.projectUsers.educationPlaceholder')} />
                  </div>
                </div>
              )}
              {form.role === 'recruiter' && (
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.projectUsers.companyName')}</label>
                  <input type="text" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="VD: FPT Software" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.status')}</label>
                <CustomSelect value={form.status} options={[{ value: 'active', label: t('adminUi.status.active') }, { value: 'inactive', label: t('adminUi.status.inactive') }]} onChange={(v) => setForm((p) => ({ ...p, status: v as ProjectUser['status'] }))} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.actions.cancel')}</button>
              <button onClick={handleSave} disabled={!form.fullName.trim() || !form.email.trim()} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${form.fullName.trim() && form.email.trim() ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>
                {editingUser ? t('adminUi.jobs.saveChanges') : t('adminUi.projectUsers.addUser')}
              </button>
            </div>
          </div>
        </div>
      )}

      <TableActionMenu open={openId != null && !!activeItem} pos={pos} menuRef={menuRef}>
        {activeItem && viewMode === 'active' ? (
          <>
            <button type="button" onClick={() => { setDetailUser(activeItem); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
            <button type="button" onClick={() => openEdit(activeItem)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-edit-line text-accent-500"></i>{t('adminUi.jobs.edit')}</button>
            <button type="button" onClick={() => { dispatch(toggleProjectUserStatus(activeItem.id)); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
              <i className={`${activeItem.status === 'active' ? 'ri-lock-line' : 'ri-lock-unlock-line'} text-yellow-500`}></i> {activeItem.status === 'active' ? t('adminUi.projectUsers.deactivate') : t('adminUi.projectUsers.activate')}
            </button>
            <button type="button" onClick={() => { setConfirmSoftDelete(activeItem.id); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><i className="ri-delete-bin-line"></i>{t('adminUi.jobs.confirmDelete')}</button>
          </>
        ) : activeItem ? (
          <>
            <button type="button" onClick={() => { dispatch(restoreProjectUser(activeItem.id)); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer"><i className="ri-arrow-go-back-line"></i>{t('adminUi.jobs.restore')}</button>
            <button type="button" onClick={() => { setDetailUser(activeItem); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
            <button type="button" onClick={() => { setConfirmPermanentDelete(activeItem.id); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><i className="ri-delete-bin-6-line"></i>{t('adminUi.jobs.deletePermanent')}</button>
          </>
        ) : null}
      </TableActionMenu>
    </div>
  );
}