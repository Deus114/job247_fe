import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addProjectUser, updateProjectUser, deleteProjectUser,
  restoreProjectUser, permanentDeleteProjectUser, toggleProjectUserStatus,
} from '@/store/slices/projectUserSlice';
import type { ProjectUser } from '@/mocks/projectUsers';
import CustomSelect from '@/components/base/CustomSelect';
import SortHeader from '@/components/base/SortHeader';
import ColumnVisibilityDropdown from '@/components/base/ColumnVisibilityDropdown';
import Pagination from '@/components/base/Pagination';

type SortField = 'fullName' | 'createdAt' | 'lastLogin';

export default function ProjectUsersTab() {
  const dispatch = useAppDispatch();
  const allUsers = useAppSelector((state) => state.projectUsers.items);
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
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
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
  useMemo(() => { setCurrentPage(1); }, [search, roleFilter, statusFilter, dateFrom, dateTo, viewMode, pageSize]);

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
    setDropdownOpen(null);
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
  const activeCount = allUsers.filter((u) => !u.deletedAt).length;
  const trashCount = allUsers.filter((u) => !!u.deletedAt).length;

  const roleOptions = [
    { value: 'all', label: 'Tất cả vai trò' },
    { value: 'candidate', label: 'Ứng viên' },
    { value: 'recruiter', label: 'Nhà tuyển dụng' },
  ];
  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Vô hiệu' },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">Quản lý người dùng</h2>
            <p className="text-sm text-foreground-500 mt-1">{viewMode === 'active' ? `${filtered.length} / ${activeCount} người dùng` : `${filtered.length} / ${trashCount} đã xóa`}</p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'user', label: 'Người dùng' },
                { key: 'type', label: 'Loại' },
                { key: 'info', label: 'Thông tin bổ sung' },
                { key: 'status', label: 'Trạng thái' },
                { key: 'createdAt', label: 'Ngày tạo' },
                { key: 'lastLogin', label: 'ĐN cuối' },
                { key: 'actions', label: 'Hành động' },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === 'active' && (
              <button onClick={openAdd} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
                <i className="ri-add-line"></i> Thêm người dùng
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[220px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, email, SĐT..." className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors" />
          </div>
          <CustomSelect value={roleFilter} options={roleOptions} onChange={setRoleFilter} compact className="w-full sm:w-[160px]" />
          <CustomSelect value={statusFilter} options={statusOptions} onChange={setStatusFilter} compact className="w-full sm:w-[160px]" />
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
          <p className="text-sm text-yellow-700"><i className="ri-information-line mr-1"></i>Người dùng trong thùng rác có thể được khôi phục hoặc xóa vĩnh viễn.</p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader label="NGƯỜI DÙNG" field="fullName" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">LOẠI</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">THÔNG TIN BỔ SUNG</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">TRẠNG THÁI</th>
                <SortHeader label="NGÀY TẠO" field="createdAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="ĐN CUỐI" field="lastLogin" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
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
                        <p className="text-xs text-foreground-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${u.role === 'recruiter' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
                      {u.role === 'recruiter' ? 'Nhà tuyển dụng' : 'Ứng viên'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-foreground-600 text-xs">
                    {u.role === 'recruiter' ? u.companyName || '—' : u.jobTitle || '—'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {viewMode === 'active' ? (
                      <button onClick={() => dispatch(toggleProjectUserStatus(u.id))} className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${u.status === 'active' ? 'bg-accent-100 text-accent-600 hover:bg-accent-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        {u.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                      </button>
                    ) : (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${u.status === 'active' ? 'bg-accent-100 text-accent-600' : 'bg-red-100 text-red-600'}`}>
                        {u.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
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
                        <button onClick={() => { dispatch(deleteProjectUser(u.id)); setConfirmSoftDelete(null); }} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer">Xóa</button>
                        <button onClick={() => setConfirmSoftDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                      </div>
                    ) : confirmPermanentDelete === u.id && viewMode === 'trash' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { dispatch(permanentDeleteProjectUser(u.id)); setConfirmPermanentDelete(null); }} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer">Xóa vĩnh viễn</button>
                        <button onClick={() => setConfirmPermanentDelete(null)} className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer">Hủy</button>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <button onClick={() => setDropdownOpen(dropdownOpen === u.id ? null : u.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-more-2-fill text-foreground-500"></i></button>
                        {dropdownOpen === u.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                            {viewMode === 'active' ? (
                              <>
                                <button onClick={() => { setDetailUser(u); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-eye-line text-primary-500"></i> Xem chi tiết</button>
                                <button onClick={() => openEdit(u)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-edit-line text-accent-500"></i> Chỉnh sửa</button>
                                <button onClick={() => { dispatch(toggleProjectUserStatus(u.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                                  <i className={`${u.status === 'active' ? 'ri-lock-line' : 'ri-lock-unlock-line'} text-yellow-500`}></i> {u.status === 'active' ? 'Vô hiệu' : 'Kích hoạt'}
                                </button>
                                <button onClick={() => { setConfirmSoftDelete(u.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><i className="ri-delete-bin-line"></i> Xóa</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { dispatch(restoreProjectUser(u.id)); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer"><i className="ri-arrow-go-back-line"></i> Khôi phục</button>
                                <button onClick={() => { setDetailUser(u); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-eye-line text-primary-500"></i> Xem chi tiết</button>
                                <button onClick={() => { setConfirmPermanentDelete(u.id); setDropdownOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><i className="ri-delete-bin-6-line"></i> Xóa vĩnh viễn</button>
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
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4"><i className="ri-user-search-line text-2xl text-foreground-400"></i></div>
            <p className="text-sm text-foreground-500">{viewMode === 'active' ? (hasActiveFilters ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào') : 'Thùng rác trống'}</p>
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
              <h3 className="text-lg font-heading font-semibold text-foreground-950">Chi tiết người dùng</h3>
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
                {detailUser.role === 'recruiter' ? 'Nhà tuyển dụng' : 'Ứng viên'}
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Email', value: detailUser.email },
                { label: 'Số điện thoại', value: detailUser.phone || 'Chưa cập nhật' },
                { label: 'Trạng thái', value: detailUser.status === 'active' ? 'Hoạt động' : 'Vô hiệu' },
                { label: detailUser.role === 'recruiter' ? 'Công ty' : 'Vị trí', value: detailUser.role === 'recruiter' ? (detailUser.companyName || '—') : (detailUser.jobTitle || '—') },
                ...(detailUser.role === 'candidate' ? [{ label: 'Học vấn', value: detailUser.education || '—' }] : []),
                { label: 'Ngày tạo', value: detailUser.createdAt },
                { label: 'Đăng nhập cuối', value: detailUser.lastLogin || 'Chưa có' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-background-100">
                  <span className="text-sm text-foreground-500">{label}</span>
                  <span className="text-sm font-medium text-foreground-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setDetailUser(null)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Đóng</button>
              {viewMode === 'active' && <button onClick={() => { setDetailUser(null); openEdit(detailUser); }} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">Chỉnh sửa</button>}
              {viewMode === 'trash' && <button onClick={() => { dispatch(restoreProjectUser(detailUser.id)); setDetailUser(null); }} className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">Khôi phục</button>}
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
              <h3 className="text-lg font-heading font-semibold text-foreground-950">{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ảnh đại diện</label>
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
                    <i className="ri-upload-line mr-1"></i> Tải ảnh lên
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Họ và tên *</label>
                  <input type="text" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="Nhập họ tên" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Số điện thoại</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="0912345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Loại tài khoản</label>
                  <CustomSelect value={form.role} options={[{ value: 'candidate', label: 'Ứng viên' }, { value: 'recruiter', label: 'Nhà tuyển dụng' }]} onChange={(v) => setForm((p) => ({ ...p, role: v as ProjectUser['role'] }))} />
                </div>
              </div>
              {form.role === 'candidate' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Vị trí công việc</label>
                    <input type="text" value={form.jobTitle} onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="VD: Frontend Developer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Học vấn</label>
                    <input type="text" value={form.education} onChange={(e) => setForm((p) => ({ ...p, education: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="VD: Đại học Bách Khoa" />
                  </div>
                </div>
              )}
              {form.role === 'recruiter' && (
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Tên công ty</label>
                  <input type="text" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300" placeholder="VD: FPT Software" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Trạng thái</label>
                <CustomSelect value={form.status} options={[{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Vô hiệu' }]} onChange={(v) => setForm((p) => ({ ...p, status: v as ProjectUser['status'] }))} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Hủy</button>
              <button onClick={handleSave} disabled={!form.fullName.trim() || !form.email.trim()} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${form.fullName.trim() && form.email.trim() ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-background-200 text-foreground-400 cursor-not-allowed'}`}>
                {editingUser ? 'Lưu thay đổi' : 'Thêm người dùng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>}
    </div>
  );
}