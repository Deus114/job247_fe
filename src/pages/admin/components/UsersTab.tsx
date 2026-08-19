import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addAdminUser, updateAdminUser, deleteAdminUser, restoreAdminUser, permanentDeleteAdminUser, toggleAdminUserStatus } from '@/store/slices/adminUserSlice';
import type { AdminUser } from '@/mocks/adminUsers';
import CustomSelect from '@/components/base/CustomSelect';
import SortHeader from '@/components/base/SortHeader';
import ColumnVisibilityDropdown from '@/components/base/ColumnVisibilityDropdown';
import Pagination from '@/components/base/Pagination';

type SortField = 'fullName' | 'email' | 'createdAt' | 'lastLogin';

export default function UsersTab() {
  const dispatch = useAppDispatch();
  const allUsers = useAppSelector((state) => state.adminUsers.items);
  const allRoles = useAppSelector((state) => state.roles.roles);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(['account','email','roles','status','createdAt','lastLogin','actions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field as SortField); setSortOrder('asc'); }
  };

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    roleIds: [] as string[], status: 'active' as 'active' | 'inactive', avatar: '',
  });

  const visibleUsers = useMemo(() => {
    return viewMode === 'active' ? allUsers.filter((u) => !u.deletedAt) : allUsers.filter((u) => !!u.deletedAt);
  }, [allUsers, viewMode]);

  const activeRoles = useMemo(() => allRoles.filter((r) => !r.deletedAt && r.isActive !== false), [allRoles]);

  const filteredUsers = useMemo(() => {
    let list = visibleUsers.filter((u) => {
      const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.phone && u.phone.includes(search));
      const matchRole = roleFilter === 'all' || (u.roleIds || []).includes(roleFilter);
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchDateFrom = !dateFrom || u.createdAt >= dateFrom;
      const matchDateTo = !dateTo || u.createdAt <= dateTo;
      return matchSearch && matchRole && matchStatus && matchDateFrom && matchDateTo;
    });
    list = [...list].sort((a, b) => {
      const aVal = (a[sortField] ?? '') as string;
      const bVal = (b[sortField] ?? '') as string;
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [visibleUsers, search, roleFilter, statusFilter, dateFrom, dateTo, sortField, sortOrder]);

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useMemo(() => { setCurrentPage(1); }, [search, roleFilter, statusFilter, dateFrom, dateTo, viewMode, pageSize]);

  const statusSelectOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Vô hiệu' },
  ];

  const roleSelectOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Tất cả vai trò' }];
    activeRoles.forEach((r) => opts.push({ value: r.id, label: r.name }));
    return opts;
  }, [activeRoles]);

  const getRoleLabel = (roleId: string) => {
    return activeRoles.find((r) => r.id === roleId)?.name || roleId;
  };

  const openAdd = () => {
    setEditingUser(null);
    setForm({ fullName: '', email: '', password: '', phone: '', roleIds: [], status: 'active', avatar: '' });
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      fullName: user.fullName, email: user.email, password: '',
      phone: user.phone || '', roleIds: [...user.roleIds],
      status: user.status, avatar: user.avatar || '',
    });
    setImagePreview(user.avatar || '');
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setForm({ ...form, avatar: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRoleInForm = (roleId: string) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleSave = () => {
    if (!form.fullName.trim() || !form.email.trim()) return;
    if (!editingUser && !form.password.trim()) return;
    if (form.roleIds.length === 0) return;

    if (editingUser) {
      const updates: Partial<AdminUser> & { id: string } = {
        id: editingUser.id,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        roleIds: form.roleIds,
        status: form.status,
        phone: form.phone.trim() || undefined,
        avatar: form.avatar || undefined,
      };
      if (form.password.trim()) {
        updates.password = form.password.trim();
      }
      dispatch(updateAdminUser(updates));
    } else {
      const newUser: AdminUser = {
        id: `admin-${Date.now()}`,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        roleIds: form.roleIds,
        status: form.status,
        phone: form.phone.trim() || undefined,
        avatar: form.avatar || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };
      dispatch(addAdminUser(newUser));
    }
    setModalOpen(false);
  };

  const clearFilters = () => {
    setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setDateFrom(''); setDateTo('');
  };

  const hasActiveFilters = search || roleFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;
  const activeCount = allUsers.filter((u) => !u.deletedAt).length;
  const trashCount = allUsers.filter((u) => !!u.deletedAt).length;

  const allColumns = [
    { key: 'account', label: 'Tài khoản' },
    { key: 'email', label: 'Email' },
    { key: 'roles', label: 'Vai trò' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'createdAt', label: 'Ngày tạo' },
    { key: 'lastLogin', label: 'ĐN cuối' },
    ...(viewMode === 'trash' ? [{ key: 'deletedAt', label: 'Ngày xóa' }] : []),
    { key: 'actions', label: 'Hành động' },
  ];

  const isColVisible = (key: string) => visibleColumns.includes(key);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">Quản lý tài khoản admin</h2>
            <p className="text-sm text-foreground-500 mt-1">{viewMode === 'active' ? `${filteredUsers.length} / ${activeCount} tài khoản` : `${filteredUsers.length} / ${trashCount} đã xóa`}</p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown columns={allColumns} visibleKeys={visibleColumns} onChange={setVisibleColumns} />
            {viewMode === 'active' && (
              <button onClick={openAdd} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
                <i className="ri-add-line"></i> Thêm tài khoản
              </button>
            )}
            <button onClick={() => { setViewMode('active'); clearFilters(); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${viewMode === 'active' ? 'bg-primary-100 text-primary-700' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-team-line mr-1"></i> Đang hoạt động
            </button>
            <button onClick={() => { setViewMode('trash'); clearFilters(); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${viewMode === 'trash' ? 'bg-red-100 text-red-600' : 'text-foreground-500 hover:bg-background-100'}`}>
              <i className="ri-delete-bin-line mr-1"></i> Thùng rác {trashCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{trashCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="relative flex-1 w-full sm:max-w-[220px]">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, email, SĐT..." className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" />
            </div>
            <CustomSelect value={roleFilter} options={roleSelectOptions} onChange={setRoleFilter} compact className="w-full sm:w-[160px]" />
            <CustomSelect value={statusFilter} options={statusSelectOptions} onChange={setStatusFilter} compact className="w-full sm:w-[160px]" />
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
      </div>

      {viewMode === 'trash' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700"><i className="ri-information-line mr-1"></i>Tài khoản trong thùng rác có thể được khôi phục hoặc xóa vĩnh viễn.</p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label="TÀI KHOẢN" field="fullName" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="EMAIL" field="email" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">VAI TRÒ</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">TRẠNG THÁI</th>
                <SortHeader label="NGÀY TẠO" field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="Đ.NHẬP CUỐI" field="lastLogin" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                {viewMode === 'trash' && <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">NGÀY XÓA</th>}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">H.ĐỘNG</th>
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
                        <p className="text-xs text-foreground-500">{u.phone || 'Chưa có SĐT'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{u.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {(u.roleIds || []).map((rid) => (
                        <span key={rid} className="px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full text-[11px] font-medium">{getRoleLabel(rid)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {viewMode === 'active' ? (
                      <button onClick={() => dispatch(toggleAdminUserStatus(u.id))} className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${u.status === 'active' ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        {u.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                      </button>
                    ) : (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${u.status === 'active' ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>{u.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{u.createdAt}</td>
                  <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{u.lastLogin || 'Chưa có'}</td>
                  {viewMode === 'trash' && (
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">{u.deletedAt ? new Date(u.deletedAt).toLocaleDateString('vi-VN') : ''}</td>
                  )}
                  <td className="px-5 py-3 text-right whitespace-nowrap relative">
                    {confirmSoftDelete === u.id && viewMode === 'active' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(deleteAdminUser(u.id)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">Xóa</button>
                        <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                      </div>
                    ) : confirmPermanentDelete === u.id && viewMode === 'trash' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(permanentDeleteAdminUser(u.id)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">Xóa vĩnh viễn</button>
                        <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <button onClick={() => setDropdownOpen(dropdownOpen === u.id ? null : u.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-more-2-fill text-foreground-500"></i></button>
                        {dropdownOpen === u.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                            {viewMode === 'active' ? (
                              <>
                                <button onClick={() => { setDetailUser(u); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-eye-line text-primary-500"></i> Xem chi tiết
                                </button>
                                <button onClick={() => openEdit(u)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-edit-line text-accent-500"></i> Chỉnh sửa
                                </button>
                                <button onClick={() => dispatch(toggleAdminUserStatus(u.id))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className={`${u.status === 'active' ? 'ri-lock-line' : 'ri-lock-unlock-line'} text-yellow-500`}></i> {u.status === 'active' ? 'Vô hiệu' : 'Kích hoạt'}
                                </button>
                                <button onClick={() => { setConfirmSoftDelete(u.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                  <i className="ri-delete-bin-line"></i> Xóa
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { dispatch(restoreAdminUser(u.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                  <i className="ri-arrow-go-back-line"></i> Khôi phục
                                </button>
                                <button onClick={() => { setDetailUser(u); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className="ri-eye-line text-primary-500"></i> Xem chi tiết
                                </button>
                                <button onClick={() => { setConfirmPermanentDelete(u.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
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
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4"><i className="ri-user-search-line text-2xl text-foreground-400"></i></div>
            <p className="text-sm text-foreground-500">{viewMode === 'active' ? (hasActiveFilters ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản nào') : 'Thùng rác trống'}</p>
          </div>
        )}
        {filteredUsers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredUsers.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailUser(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">Chi tiết tài khoản</h3>
              <button onClick={() => setDetailUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="flex flex-col items-center mb-5">
              {detailUser.avatar ? (
                <img src={detailUser.avatar} alt="" className="w-20 h-20 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-background-200 flex items-center justify-center mb-3"><i className="ri-user-line text-2xl text-foreground-400"></i></div>
              )}
              <h4 className="text-lg font-semibold text-foreground-950">{detailUser.fullName}</h4>
              <div className="flex flex-wrap gap-1 mt-2">
                {(detailUser.roleIds || []).map((rid) => (
                  <span key={rid} className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">{getRoleLabel(rid)}</span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-background-100"><span className="text-sm text-foreground-500">ID</span><span className="text-sm font-medium text-foreground-800">{detailUser.id}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-background-100"><span className="text-sm text-foreground-500">Email</span><span className="text-sm font-medium text-foreground-800">{detailUser.email}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-background-100"><span className="text-sm text-foreground-500">Số điện thoại</span><span className="text-sm font-medium text-foreground-800">{detailUser.phone || 'Chưa cập nhật'}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-background-100"><span className="text-sm text-foreground-500">Trạng thái</span><span className={`px-2.5 py-1 text-xs font-medium rounded-full ${detailUser.status === 'active' ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>{detailUser.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-background-100"><span className="text-sm text-foreground-500">Ngày tạo</span><span className="text-sm font-medium text-foreground-800">{detailUser.createdAt}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-background-100"><span className="text-sm text-foreground-500">Đăng nhập cuối</span><span className="text-sm font-medium text-foreground-800">{detailUser.lastLogin || 'Chưa có'}</span></div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailUser(null)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Đóng</button>
              {viewMode === 'active' && (
                <button onClick={() => { setDetailUser(null); openEdit(detailUser); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">Chỉnh sửa</button>
              )}
              {viewMode === 'trash' && (
                <button onClick={() => { dispatch(restoreAdminUser(detailUser.id)); setDetailUser(null); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">Khôi phục</button>
              )}
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
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản admin'}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="" className="w-16 h-16 rounded-full object-cover" />
                      <button onClick={() => { setImagePreview(''); setForm({ ...form, avatar: '' }); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"><i className="ri-close-line text-[10px]"></i></button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-background-200 flex items-center justify-center"><i className="ri-user-line text-xl text-foreground-400"></i></div>
                  )}
                  <label className="px-3 py-2 border border-background-300 rounded-xl text-sm text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer">
                    <i className="ri-upload-line mr-1"></i> Tải ảnh lên
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Họ và tên *</label>
                  <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder="Nhập họ tên" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder="email@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Mật khẩu {!editingUser && '*'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder={editingUser ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Số điện thoại</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" placeholder="0912345678" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Vai trò * ({form.roleIds.length} đã chọn)</label>
                <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto p-2 border border-background-200/70 rounded-xl">
                  {activeRoles.map((role) => (
                    <label key={role.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${form.roleIds.includes(role.id) ? 'bg-primary-50 border border-primary-200' : 'hover:bg-background-100 border border-transparent'}`}>
                      <input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={() => toggleRoleInForm(role.id)} className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-200 cursor-pointer" />
                      <div>
                        <p className="text-sm font-medium text-foreground-800">{role.name}</p>
                        <p className="text-xs text-foreground-400">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Trạng thái</label>
                <CustomSelect value={form.status} options={[{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Vô hiệu' }]} onChange={(v) => setForm({ ...form, status: v as 'active' | 'inactive' })} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Hủy</button>
              <button onClick={handleSave} disabled={!form.fullName.trim() || !form.email.trim() || (!editingUser && !form.password.trim()) || form.roleIds.length === 0} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${form.fullName.trim() && form.email.trim() && (editingUser || form.password.trim()) && form.roleIds.length > 0 ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>
                {editingUser ? 'Lưu thay đổi' : 'Thêm tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>}
    </div>
  );
}