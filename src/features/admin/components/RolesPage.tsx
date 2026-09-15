import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addRole, updateRole, deleteRole, restoreRole, permanentDeleteRole, toggleRoleActive } from '@/store/slices/roleSlice';
import type { Role } from '@/types/role';
import SortHeader from '@/components/ui/SortHeader';
import ColumnVisibilityDropdown from '@/components/ui/ColumnVisibilityDropdown';
import Pagination from '@/components/ui/Pagination';

type SortField = 'name' | 'permissions' | 'createdAt';

export default function RolesPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const allRoles = useAppSelector((state) => state.roles.roles);
  const { permissions } = useAppSelector((state) => state.roles);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['role','description','permissions','active','createdAt','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field as SortField); setSortOrder('asc'); }
  };

  const [form, setForm] = useState({ name: '', description: '' });

  const visibleRoles = useMemo(() => {
    return viewMode === 'active'
      ? allRoles.filter((r) => !r.deletedAt)
      : allRoles.filter((r) => !!r.deletedAt);
  }, [allRoles, viewMode]);

  const filteredRoles = useMemo(() => {
    let list = visibleRoles.filter((r) => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
      const matchFrom = !dateFrom || r.createdAt >= dateFrom;
      const matchTo = !dateTo || r.createdAt <= dateTo;
      return matchSearch && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      if (sortField === 'permissions') {
        return sortOrder === 'asc' ? a.permissions.length - b.permissions.length : b.permissions.length - a.permissions.length;
      }
      const aVal = sortField === 'name' ? a.name : a.createdAt;
      const bVal = sortField === 'name' ? b.name : b.createdAt;
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visibleRoles, search, dateFrom, dateTo, sortField, sortOrder]);

  const paginatedRoles = useMemo(() => filteredRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredRoles, currentPage, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [search, dateFrom, dateTo, viewMode, pageSize]);

  const permissionsByModule = useMemo(() => {
    const activePerms = permissions.filter((p) => !p.deletedAt && p.isActive !== false);
    const groups: Record<string, typeof activePerms> = {};
    activePerms.forEach((p) => {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    });
    return groups;
  }, [permissions]);

  const openAdd = () => {
    setEditingRole(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description });
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const openPermissions = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions([...role.permissions]);
    setPermissionModalOpen(true);
    setDropdownOpen(null);
  };

  const openDetail = (role: Role) => {
    setDetailRole(role);
    setDetailModalOpen(true);
  };

  const handleSaveRole = () => {
    if (!form.name.trim()) return;
    if (editingRole) {
      dispatch(updateRole({ id: editingRole.id, name: form.name.trim(), description: form.description.trim() }));
    } else {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: form.name.trim(),
        description: form.description.trim(),
        permissions: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      dispatch(addRole(newRole));
    }
    setModalOpen(false);
  };

  const handleSavePermissions = () => {
    if (editingRole) {
      dispatch(updateRole({ id: editingRole.id, permissions: selectedPermissions }));
    }
    setPermissionModalOpen(false);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const activeCount = allRoles.filter((r) => !r.deletedAt).length;
  const trashCount = allRoles.filter((r) => !!r.deletedAt).length;

  return (
    <div>
      {/* Header + Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">{t('adminUi.pageTitles.roles')}</h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === 'active' ? `${filteredRoles.length} / ${activeCount} ${t('adminUi.roles.roles')}` : `${filteredRoles.length} / ${trashCount} ${t('adminUi.jobs.deleted')}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'role', label: t('adminUi.columns.role') },
                { key: 'description', label: t('adminUi.columns.description') },
                { key: 'permissions', label: t('adminUi.columns.permCount') },
                { key: 'active', label: t('adminUi.columns.active') },
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
                <i className="ri-add-line"></i> {t('adminUi.roles.addRole')}
              </button>
            )}
            <button
              onClick={() => { setViewMode('active'); setSearch(''); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'active' ? 'bg-primary-100 text-primary-700' : 'text-foreground-500 hover:bg-background-100'
              }`}
            >
              <i className="ri-shield-keyhole-line mr-1"></i>{t('adminUi.actions.active')}</button>
            <button
              onClick={() => { setViewMode('trash'); setSearch(''); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'text-foreground-500 hover:bg-background-100'
              }`}
            >
              <i className="ri-delete-bin-line mr-1"></i>{t('adminUi.actions.trash')} {trashCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{trashCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[220px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminUi.roles.searchPlaceholder')} className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" />
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
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            {t('adminUi.roles.trashInfo')}
          </p>
        </div>
      )}

      {/* Roles Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label={t('adminUi.columns.role').toUpperCase()} field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} className="whitespace-nowrap" />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">{t('adminUi.columns.description').toUpperCase()}</th>
                <SortHeader label={t('adminUi.columns.permCount').toUpperCase()} field="permissions" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} className="whitespace-nowrap" />
                <SortHeader label={t('adminUi.columns.createdAt').toUpperCase()} field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} className="whitespace-nowrap" />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">{t('adminUi.columns.active').toUpperCase()}</th>
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">{t('adminUi.columns.deletedAt').toUpperCase()}</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">{t('adminUi.columns.actions').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRoles.map((role) => (
                <tr key={role.id} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openDetail(role)}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <i className="ri-shield-keyhole-line text-sm text-primary-600"></i>
                      </div>
                      <span className="font-medium text-foreground-900 text-left">{role.name}</span>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-foreground-600 max-w-[300px] truncate">{role.description}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <button
                      onClick={() => openPermissions(role)}
                      className="px-2.5 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium hover:bg-secondary-200 transition-colors cursor-pointer"
                    >
                      {t('adminUi.roles.permissionsCount', { count: role.permissions.length })}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{role.createdAt}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {viewMode === 'active' ? (
                      <button
                        onClick={() => dispatch(toggleRoleActive(role.id))}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${role.isActive !== false ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                      >
                        {role.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                      </button>
                    ) : (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${role.isActive !== false ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                        {role.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                      </span>
                    )}
                  </td>
                  {viewMode === 'trash' && (
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {role.deletedAt ? new Date(role.deletedAt).toLocaleDateString('vi-VN') : ''}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right whitespace-nowrap relative">
                    {confirmSoftDelete === role.id && viewMode === 'active' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(deleteRole(role.id)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">{t('adminUi.jobs.confirmDelete')}</button>
                        <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                      </div>
                    ) : confirmPermanentDelete === role.id && viewMode === 'trash' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(permanentDeleteRole(role.id)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">{t('adminUi.jobs.deletePermanent')}</button>
                        <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">{t('adminUi.actions.cancel')}</button>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <button onClick={() => setDropdownOpen(dropdownOpen === role.id ? null : role.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer">
                          <i className="ri-more-2-fill text-foreground-500"></i>
                        </button>
                        {dropdownOpen === role.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                            {viewMode === 'active' ? (
                              <>
                                <button onClick={() => { openDetail(role); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
                                <button onClick={() => openPermissions(role)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-key-2-line text-secondary-500"></i> {t('adminUi.roles.assignPermissions')}
                                </button>
                                <button onClick={() => openEdit(role)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-edit-line text-accent-500"></i>{t('adminUi.jobs.edit')}</button>
                                <button onClick={() => { setConfirmSoftDelete(role.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                  <i className="ri-delete-bin-line"></i>{t('adminUi.jobs.confirmDelete')}</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { dispatch(restoreRole(role.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                  <i className="ri-arrow-go-back-line"></i>{t('adminUi.jobs.restore')}</button>
                                <button onClick={() => { openDetail(role); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-eye-line text-primary-500"></i>{t('adminUi.jobs.viewDetails')}</button>
                                <button onClick={() => { setConfirmPermanentDelete(role.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
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
        {filteredRoles.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-shield-keyhole-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === 'active'
                ? (search ? t('adminUi.roles.noRolesFiltered') : t('adminUi.roles.noRolesFound'))
                : t('adminUi.jobs.trashEmpty')}
            </p>
          </div>
        )}
        {filteredRoles.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filteredRoles.length} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        )}
      </div>

      {/* Detail Modal */}
      {detailModalOpen && detailRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <i className="ri-shield-keyhole-line text-primary-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground-950">{detailRole.name}</h3>
                  <p className="text-xs text-foreground-500">ID: {detailRole.id}</p>
                </div>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.columns.description')}</span>
                <span className="text-sm font-medium text-foreground-800 text-right max-w-[60%]">{detailRole.description}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.columns.permCount')}</span>
                <span className="text-sm font-medium text-foreground-800">{detailRole.permissions.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">{t('adminUi.columns.createdAt')}</span>
                <span className="text-sm font-medium text-foreground-800">{detailRole.createdAt}</span>
              </div>
            </div>
            {detailRole.permissions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground-800 mb-3">{t('adminUi.roles.assignedPermissions')}</h4>
                <div className="space-y-3">
                  {Object.entries(permissionsByModule).map(([module, perms]) => {
                    const modulePerms = perms.filter((p) => detailRole.permissions.includes(p.id));
                    if (modulePerms.length === 0) return null;
                    return (
                      <div key={module}>
                        <h5 className="text-xs font-semibold text-foreground-500 uppercase mb-1.5">{module}</h5>
                        <div className="flex flex-wrap gap-2">
                          {modulePerms.map((p) => (
                            <span key={p.id} className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <i className="ri-check-line text-[10px]"></i> {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.close')}</button>
              {viewMode === 'active' && (
                <button onClick={() => { setDetailModalOpen(false); openPermissions(detailRole); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                  {t('adminUi.roles.assignPermissions')}
                </button>
              )}
              {viewMode === 'trash' && (
                <button onClick={() => { dispatch(restoreRole(detailRole.id)); setDetailModalOpen(false); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.jobs.restore')}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Role Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{editingRole ? t('adminUi.roles.editRole') : t('adminUi.roles.addRole')}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.roles.roleName')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder="VD: Content Manager" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('adminUi.columns.description')}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors resize-none" placeholder={t('adminUi.roles.roleDescriptionPlaceholder')} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.actions.cancel')}</button>
              <button onClick={handleSaveRole} disabled={!form.name.trim()} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${form.name.trim() ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>
                {editingRole ? t('adminUi.jobs.saveChanges') : t('adminUi.roles.addRole')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permissionModalOpen && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPermissionModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-heading font-semibold text-foreground-950">{t('adminUi.roles.assignPermissionsTitle', { name: editingRole.name })}</h3>
                <p className="text-xs text-foreground-500 mt-1">{t('adminUi.roles.assignPermissionsHint')}</p>
              </div>
              <button onClick={() => setPermissionModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-5">
              {Object.entries(permissionsByModule).map(([module, perms]) => {
                const moduleAccess = perms.filter((p) => p.type === 'module_access');
                const actions = perms.filter((p) => p.type === 'action');
                return (
                <div key={module}>
                  <h4 className="text-sm font-semibold text-foreground-800 mb-2">{module}</h4>
                  {moduleAccess.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-foreground-400 mb-1.5 uppercase">{t('adminUi.roles.moduleAccess')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {moduleAccess.map((p) => (
                          <label key={p.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-background-200/50 hover:bg-background-100 transition-colors cursor-pointer">
                            <input type="checkbox" checked={selectedPermissions.includes(p.id)} onChange={() => togglePermission(p.id)} className="mt-0.5 w-4 h-4 rounded border-background-300 text-secondary-500 focus:ring-secondary-200 cursor-pointer" />
                            <div>
                              <p className="text-sm font-medium text-foreground-800">{p.name}</p>
                              <p className="text-xs text-foreground-500">{p.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {actions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground-400 mb-1.5 uppercase">{t('adminUi.roles.actions')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {actions.map((p) => (
                          <label key={p.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-background-200/50 hover:bg-background-100 transition-colors cursor-pointer">
                            <input type="checkbox" checked={selectedPermissions.includes(p.id)} onChange={() => togglePermission(p.id)} className="mt-0.5 w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-200 cursor-pointer" />
                            <div>
                              <p className="text-sm font-medium text-foreground-800">{p.name}</p>
                              {p.apiRoute && <code className="text-[10px] font-mono text-foreground-400 bg-background-100 px-1 py-0.5 rounded">{p.apiRoute}</code>}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setPermissionModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">{t('adminUi.actions.cancel')}</button>
              <button onClick={handleSavePermissions} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                {t('adminUi.roles.savePermissions', { count: selectedPermissions.length })}
              </button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>}
    </div>
  );
}