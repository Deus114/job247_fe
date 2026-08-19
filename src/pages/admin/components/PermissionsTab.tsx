import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addPermission, updatePermission, deletePermission, restorePermission, permanentDeletePermission, togglePermissionActive } from '@/store/slices/roleSlice';
import type { Permission } from '@/mocks/roles';
import CustomSelect from '@/components/base/CustomSelect';
import SortHeader from '@/components/base/SortHeader';
import ColumnVisibilityDropdown from '@/components/base/ColumnVisibilityDropdown';
import Pagination from '@/components/base/Pagination';

type SortField = 'name' | 'module' | 'type' | 'createdAt';

const MODULES = ['Tổng quan', 'Việc làm', 'Công ty', 'Người dùng', 'Vai trò', 'Quyền hạn', 'Danh mục', 'Hệ thống', 'Tài khoản'];
const TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'module_access', label: 'Truy cập module' },
  { value: 'action', label: 'Hành động' },
];

export default function PermissionsTab() {
  const dispatch = useAppDispatch();
  const allPermissions = useAppSelector((state) => state.roles.permissions);
  const allRoles = useAppSelector((state) => state.roles.roles);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
  const [detailPerm, setDetailPerm] = useState<Permission | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [form, setForm] = useState({
    name: '', description: '', module: 'Tổng quan', type: 'action' as 'module_access' | 'action', apiRoute: '',
  });

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['perm','type','module','apiRoute','roles','active','createdAt','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const visiblePermissions = useMemo(() => {
    return viewMode === 'active'
      ? allPermissions.filter((p) => !p.deletedAt)
      : allPermissions.filter((p) => !!p.deletedAt);
  }, [allPermissions, viewMode]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field as SortField); setSortOrder('asc'); }
  };

  const filteredPermissions = useMemo(() => {
    let perms = visiblePermissions;
    if (moduleFilter !== 'all') perms = perms.filter((p) => p.module === moduleFilter);
    if (typeFilter !== 'all') perms = perms.filter((p) => p.type === typeFilter);
    if (search) perms = perms.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || (p.apiRoute && p.apiRoute.toLowerCase().includes(search.toLowerCase())));
    if (dateFrom) perms = perms.filter((p) => (p.createdAt || '') >= dateFrom);
    if (dateTo) perms = perms.filter((p) => (p.createdAt || '') <= dateTo);
    perms = [...perms].sort((a, b) => {
      const aVal = (a[sortField] ?? '') as string;
      const bVal = (b[sortField] ?? '') as string;
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return perms;
  }, [visiblePermissions, search, moduleFilter, typeFilter, dateFrom, dateTo, sortField, sortOrder]);

  const paginatedPerms = useMemo(() => filteredPermissions.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredPermissions, currentPage, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filteredPermissions.length / pageSize));
  useMemo(() => { setCurrentPage(1); }, [search, moduleFilter, typeFilter, dateFrom, dateTo, viewMode, pageSize]);

  const getRolesWithPermission = (permId: string) => {
    return allRoles.filter((r) => !r.deletedAt && r.permissions.includes(permId));
  };

  const moduleOptions = [
    { value: 'all', label: 'Tất cả module' },
    ...MODULES.map((m) => ({ value: m, label: m })),
  ];

  const openAdd = () => {
    setEditingPerm(null);
    setForm({ name: '', description: '', module: moduleFilter !== 'all' ? moduleFilter : 'Tổng quan', type: 'action', apiRoute: '' });
    setModalOpen(true);
  };

  const openEdit = (perm: Permission) => {
    setEditingPerm(perm);
    setForm({ name: perm.name, description: perm.description, module: perm.module, type: perm.type, apiRoute: perm.apiRoute || '' });
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const openDetail = (perm: Permission) => {
    setDetailPerm(perm);
    setDetailModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.description.trim()) return;
    if (form.type === 'action' && !form.apiRoute.trim()) return;
    if (editingPerm) {
      dispatch(updatePermission({
        id: editingPerm.id,
        name: form.name.trim(),
        description: form.description.trim(),
        module: form.module,
        type: form.type,
        apiRoute: form.type === 'action' ? form.apiRoute.trim() : undefined,
      }));
    } else {
      const newPerm: Permission = {
        id: `perm_${Date.now()}`,
        name: form.name.trim(),
        description: form.description.trim(),
        module: form.module,
        type: form.type,
        apiRoute: form.type === 'action' ? form.apiRoute.trim() : undefined,
      };
      dispatch(addPermission(newPerm));
    }
    setModalOpen(false);
  };

  const activeCount = allPermissions.filter((p) => !p.deletedAt).length;
  const trashCount = allPermissions.filter((p) => !!p.deletedAt).length;
  const hasActiveFilters = search || moduleFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch('');
    setModuleFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">Quản lý quyền hạn</h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === 'active' ? `${filteredPermissions.length} / ${activeCount} quyền` : `${filteredPermissions.length} / ${trashCount} đã xóa`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'perm', label: 'Quyền' },
                { key: 'type', label: 'Loại' },
                { key: 'module', label: 'Module' },
                { key: 'apiRoute', label: 'API Route' },
                { key: 'roles', label: 'Vai trò' },
                { key: 'active', label: 'Kích hoạt' },
                { key: 'createdAt', label: 'Ngày tạo' },
                { key: 'actions', label: 'Hành động' },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === 'active' && (
              <button onClick={openAdd} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
                <i className="ri-add-line"></i> Thêm quyền
              </button>
            )}
            <button onClick={() => { setViewMode('active'); clearFilters(); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${viewMode === 'active' ? 'bg-primary-100 text-primary-700' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-key-2-line mr-1"></i> Đang hoạt động
            </button>
            <button onClick={() => { setViewMode('trash'); clearFilters(); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-delete-bin-line mr-1"></i> Thùng rác {trashCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{trashCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[220px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, mô tả, API route..." className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" />
          </div>
          <CustomSelect value={moduleFilter} options={moduleOptions} onChange={setModuleFilter} compact className="w-full sm:w-[160px]" />
          <CustomSelect value={typeFilter} options={TYPE_OPTIONS} onChange={setTypeFilter} compact className="w-full sm:w-[140px]" />
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title="Từ ngày" />
            <span className="text-xs text-foreground-400">đến</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" title="Đến ngày" />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm text-foreground-500 hover:text-foreground-700 hover:bg-background-100 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1">
              <i className="ri-filter-off-line"></i> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {viewMode === 'trash' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700"><i className="ri-information-line mr-1"></i>Quyền trong thùng rác có thể được khôi phục hoặc xóa vĩnh viễn.</p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label="QUYỀN" field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} className="w-[200px]" />
                <SortHeader label="LOẠI" field="type" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="MODULE" field="module" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 max-w-[300px]">API ROUTE</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">VAI TRÒ</th>
                <SortHeader label="NGÀY TẠO" field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">KÍCH HOẠT</th>
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">NGÀY XÓA</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 w-[80px]">H.ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPerms.map((perm) => {
                const linkedRoles = getRolesWithPermission(perm.id);
                return (
                  <tr key={perm.id} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                    <td className="px-5 py-3">
                      <button onClick={() => openDetail(perm)} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${perm.type === 'module_access' ? 'bg-secondary-100' : 'bg-primary-100'}`}>
                          <i className={`text-sm ${perm.type === 'module_access' ? 'ri-folder-line text-secondary-600' : 'ri-code-s-slash-line text-primary-600'}`}></i>
                        </div>
                        <div className="min-w-0 text-left">
                          <span className="font-medium text-foreground-900">{perm.name}</span>
                          <p className="text-xs text-foreground-400 truncate max-w-[200px]">{perm.description}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${perm.type === 'module_access' ? 'bg-secondary-100 text-secondary-700' : 'bg-accent-100 text-accent-700'}`}>
                        {perm.type === 'module_access' ? 'Truy cập' : 'Hành động'}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-background-100 text-foreground-600 rounded text-xs">{perm.module}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap max-w-[280px]">
                      {perm.apiRoute ? (
                        <code className="px-2 py-0.5 bg-background-100 text-foreground-500 rounded text-[11px] font-mono">{perm.apiRoute}</code>
                      ) : (
                        <span className="text-xs text-foreground-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {linkedRoles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {linkedRoles.slice(0, 3).map((role) => (
                            <span key={role.id} className="px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full text-[11px] font-medium">{role.name}</span>
                          ))}
                          {linkedRoles.length > 3 && <span className="text-[11px] text-foreground-400">+{linkedRoles.length - 3}</span>}
                        </div>
                      ) : <span className="text-xs text-foreground-400">Chưa gán</span>}
                    </td>
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {perm.createdAt || '—'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {viewMode === 'active' ? (
                        <button
                          onClick={() => dispatch(togglePermissionActive(perm.id))}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${perm.isActive !== false ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          {perm.isActive !== false ? 'Bật' : 'Tắt'}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${perm.isActive !== false ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                          {perm.isActive !== false ? 'Bật' : 'Tắt'}
                        </span>
                      )}
                    </td>
                    {viewMode === 'trash' && (
                      <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                        {perm.deletedAt ? new Date(perm.deletedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    )}
                    <td className="px-5 py-3 text-right whitespace-nowrap relative">
                      {confirmSoftDelete === perm.id && viewMode === 'active' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(deletePermission(perm.id)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">Xóa</button>
                          <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                        </div>
                      ) : confirmPermanentDelete === perm.id && viewMode === 'trash' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { dispatch(permanentDeletePermission(perm.id)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">Xóa vĩnh viễn</button>
                          <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <button onClick={() => setDropdownOpen(dropdownOpen === perm.id ? null : perm.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer">
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
                          {dropdownOpen === perm.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                              {viewMode === 'active' ? (
                                <>
                                  <button onClick={() => { openDetail(perm); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-eye-line text-primary-500"></i> Xem chi tiết
                                  </button>
                                  <button onClick={() => openEdit(perm)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-edit-line text-accent-500"></i> Chỉnh sửa
                                  </button>
                                  <button onClick={() => { setConfirmSoftDelete(perm.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                    <i className="ri-delete-bin-line"></i> Xóa
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { dispatch(restorePermission(perm.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                    <i className="ri-arrow-go-back-line"></i> Khôi phục
                                  </button>
                                  <button onClick={() => { openDetail(perm); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                    <i className="ri-eye-line text-primary-500"></i> Xem chi tiết
                                  </button>
                                  <button onClick={() => { setConfirmPermanentDelete(perm.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
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
        {filteredPermissions.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-key-2-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === 'active' ? (hasActiveFilters ? 'Không tìm thấy quyền phù hợp' : 'Chưa có quyền nào') : 'Thùng rác trống'}
            </p>
          </div>
        )}
        {filteredPermissions.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filteredPermissions.length} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        )}
      </div>

      {/* Detail Modal */}
      {detailModalOpen && detailPerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${detailPerm.type === 'module_access' ? 'bg-secondary-100' : 'bg-primary-100'}`}>
                  <i className={`${detailPerm.type === 'module_access' ? 'ri-folder-line text-secondary-600' : 'ri-key-2-line text-primary-600'}`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground-950">{detailPerm.name}</h3>
                  <p className="text-xs text-foreground-500">ID: {detailPerm.id}</p>
                </div>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Loại</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${detailPerm.type === 'module_access' ? 'bg-secondary-100 text-secondary-700' : 'bg-accent-100 text-accent-700'}`}>{detailPerm.type === 'module_access' ? 'Truy cập module' : 'Hành động'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Module</span>
                <span className="text-sm font-medium text-foreground-800">{detailPerm.module}</span>
              </div>
              {detailPerm.apiRoute && (
                <div className="flex items-center justify-between py-2 border-b border-background-100">
                  <span className="text-sm text-foreground-500">API Route</span>
                  <code className="text-xs px-2 py-0.5 bg-background-100 rounded text-foreground-700 font-mono">{detailPerm.apiRoute}</code>
                </div>
              )}
              <div className="py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500 block mb-1">Mô tả</span>
                <p className="text-sm text-foreground-800">{detailPerm.description}</p>
              </div>
            </div>
            {(() => {
              const linkedRoles = getRolesWithPermission(detailPerm.id);
              return (
                <div>
                  <h4 className="text-sm font-semibold text-foreground-800 mb-2">Vai trò sử dụng ({linkedRoles.length})</h4>
                  {linkedRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {linkedRoles.map((role) => (
                        <span key={role.id} className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <i className="ri-shield-keyhole-line text-[10px]"></i> {role.name}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-foreground-400">Chưa có vai trò nào</p>}
                </div>
              );
            })()}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Đóng</button>
              {viewMode === 'active' && (
                <button onClick={() => { setDetailModalOpen(false); openEdit(detailPerm); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">Chỉnh sửa</button>
              )}
              {viewMode === 'trash' && (
                <button onClick={() => { dispatch(restorePermission(detailPerm.id)); setDetailModalOpen(false); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">Khôi phục</button>
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
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{editingPerm ? 'Chỉnh sửa quyền' : 'Thêm quyền'}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Loại quyền</label>
                <div className="flex gap-2">
                  <button onClick={() => setForm({ ...form, type: 'module_access', apiRoute: '' })} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${form.type === 'module_access' ? 'bg-secondary-100 text-secondary-700 border-2 border-secondary-300' : 'border border-background-200 text-foreground-500 hover:bg-background-100'}`}>
                    <i className="ri-folder-line mr-1"></i> Truy cập module
                  </button>
                  <button onClick={() => setForm({ ...form, type: 'action' })} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${form.type === 'action' ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'border border-background-200 text-foreground-500 hover:bg-background-100'}`}>
                    <i className="ri-code-s-slash-line mr-1"></i> Hành động
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Tên quyền</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder="VD: Xem việc làm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Mô tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors resize-none" placeholder="Mô tả chức năng của quyền này" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Module</label>
                <CustomSelect value={form.module} options={MODULES.map((m) => ({ value: m, label: m }))} onChange={(v) => setForm({ ...form, module: v })} />
              </div>
              {form.type === 'action' && (
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">API Route</label>
                  <input type="text" value={form.apiRoute} onChange={(e) => setForm({ ...form, apiRoute: e.target.value })} className="w-full px-4 py-2.5 text-sm font-mono bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder="VD: GET /api/admin/jobs" />
                  <p className="text-xs text-foreground-400 mt-1">Route API mà quyền này kiểm soát, dùng để ẩn/hiện nút và chức năng</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Hủy</button>
              <button onClick={handleSave} disabled={!form.name.trim() || !form.description.trim() || (form.type === 'action' && !form.apiRoute.trim())} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${form.name.trim() && form.description.trim() && (form.type !== 'action' || form.apiRoute.trim()) ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>
                {editingPerm ? 'Lưu thay đổi' : 'Thêm quyền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>}
    </div>
  );
}