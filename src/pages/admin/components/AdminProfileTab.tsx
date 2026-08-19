import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateAdminProfile } from '@/store/slices/adminAuthSlice';
import { changeAppLanguage } from '@/store/slices/languageSlice';
import { toggleTheme } from '@/store/slices/themeSlice';
import CustomSelect from '@/components/base/CustomSelect';

export default function AdminProfileTab() {
  const dispatch = useAppDispatch();
  const { admin } = useAppSelector((state) => state.adminAuth);
  const { roles, permissions } = useAppSelector((state) => state.roles);
  const currentLanguage = useAppSelector((state) => state.language.lang);
  const currentTheme = useAppSelector((state) => state.theme.mode);

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imagePreview, setImagePreview] = useState(admin?.avatar || '');

  // Get all permissions for all roles of the current admin
  const adminPermissions = (() => {
    if (!admin) return [];
    const permSet = new Set<string>();
    admin.roleIds.forEach((rid) => {
      const role = roles.find((r) => r.id === rid);
      if (role) role.permissions.forEach((pid) => permSet.add(pid));
    });
    return permissions.filter((p) => permSet.has(p.id) && !p.deletedAt);
  })();

  const moduleAccessPerms = adminPermissions.filter((p) => p.type === 'module_access');
  const actionPerms = adminPermissions.filter((p) => p.type === 'action');

  const permissionsByModule: Record<string, typeof permissions> = {};
  actionPerms.forEach((p) => {
    if (!permissionsByModule[p.module]) permissionsByModule[p.module] = [];
    permissionsByModule[p.module].push(p);
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      dispatch(updateAdminProfile({ avatar: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = () => {
    setPasswordMsg(null);
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'Vui lòng điền đầy đủ các trường' });
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    // Update password in admin users store
    dispatch(updateAdminProfile({ password: passwordForm.newPass }));
    setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const languageOptions = [
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'en', label: 'English' },
  ];

  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground-950 mb-6">Tài khoản của tôi</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: Profile + Settings */}
        <div className="xl:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                    <i className="ri-shield-user-line text-3xl text-primary-600"></i>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                  <i className="ri-camera-line text-sm"></i>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <h3 className="text-lg font-semibold text-foreground-950">{admin?.fullName || 'Admin'}</h3>
              <p className="text-sm text-foreground-500">{admin?.email}</p>
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {admin?.roleIds.map((rid) => {
                  const role = roles.find((r) => r.id === rid);
                  return (
                    <span key={rid} className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                      {role?.name || rid}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">ID</span>
                <span className="text-sm font-medium text-foreground-900">{admin?.id || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Số vai trò</span>
                <span className="text-sm font-medium text-foreground-900">{admin?.roleIds.length || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Số quyền</span>
                <span className="text-sm font-medium text-foreground-900">{actionPerms.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">Đăng nhập cuối</span>
                <span className="text-sm font-medium text-foreground-900">{admin?.lastLogin || 'Chưa có'}</span>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
            <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-4">Cài đặt</h3>

            {/* Language */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ngôn ngữ</label>
              <CustomSelect
                value={currentLanguage}
                options={languageOptions}
                onChange={(v) => void dispatch(changeAppLanguage(v as 'vi' | 'en'))}
              />
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">Giao diện</label>
              <div className="flex gap-2">
                <button
                  onClick={() => currentTheme !== 'light' && dispatch(toggleTheme())}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${currentTheme === 'light' ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'border border-background-200 text-foreground-500 hover:bg-background-100'}`}
                >
                  <i className="ri-sun-line"></i> Sáng
                </button>
                <button
                  onClick={() => currentTheme !== 'dark' && dispatch(toggleTheme())}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${currentTheme === 'dark' ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'border border-background-200 text-foreground-500 hover:bg-background-100'}`}
                >
                  <i className="ri-moon-line"></i> Tối
                </button>
              </div>
            </div>
          </div>

          {/* Password Change Card */}
          <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
            <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-4">Đổi mật khẩu</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password" value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password" value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password" value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              {passwordMsg && (
                <p className={`text-xs ${passwordMsg.type === 'success' ? 'text-accent-600' : 'text-red-500'}`}>
                  {passwordMsg.text}
                </p>
              )}
              <button
                onClick={handlePasswordChange}
                className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Cập nhật mật khẩu
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Permissions */}
        <div className="xl:col-span-2 space-y-4">
          {/* Module Access */}
          <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
            <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">Module được truy cập</h3>
            <p className="text-xs text-foreground-500 mb-4">Các module bạn có quyền truy cập dựa trên vai trò hiện tại</p>
            <div className="flex flex-wrap gap-2">
              {moduleAccessPerms.length > 0 ? moduleAccessPerms.map((p) => (
                <span key={p.id} className="px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <i className="ri-folder-line text-[10px]"></i> {p.name}
                </span>
              )) : (
                <p className="text-sm text-foreground-400">Không có quyền truy cập module nào</p>
              )}
            </div>
          </div>

          {/* Action Permissions */}
          <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
            <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">Quyền hành động</h3>
            <p className="text-xs text-foreground-500 mb-4">Các API route bạn được phép gọi ({actionPerms.length} quyền)</p>

            <div className="space-y-5">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module}>
                  <h4 className="text-xs font-semibold text-foreground-400 uppercase tracking-wider mb-2">{module}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((p) => (
                      <div key={p.id} className="flex items-start gap-2.5 p-3 rounded-lg bg-background-100/50 border border-background-200/50">
                        <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-check-line text-xs text-accent-600"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground-800">{p.name}</p>
                          {p.apiRoute && (
                            <code className="text-[10px] font-mono text-foreground-400 bg-background-100 px-1 py-0.5 rounded">{p.apiRoute}</code>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(permissionsByModule).length === 0 && (
                <p className="text-sm text-foreground-400">Không có quyền hành động nào</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}