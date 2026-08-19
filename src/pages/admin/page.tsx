import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import AdminSidebar, { type AdminTab } from './components/Sidebar';
import DashboardTab from './components/DashboardTab';
import JobsTab from './components/JobsTab';
import CompaniesTab from './components/CompaniesTab';
import ProjectUsersTab from './components/ProjectUsersTab';
import UsersTab from './components/UsersTab';
import RolesTab from './components/RolesTab';
import PermissionsTab from './components/PermissionsTab';
import CategoriesTab from './components/CategoriesTab';
import EducationTab from './components/EducationTab';
import BannersTab from './components/BannersTab';
import BusinessConfigTab from './components/BusinessConfigTab';
import AdminProfileTab from './components/AdminProfileTab';

export default function AdminPage() {
  const navigate = useNavigate();
  const { admin } = useAppSelector((state) => state.adminAuth);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10">
          <div className="w-20 h-20 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
            <i className="ri-shield-cross-line text-3xl text-foreground-400"></i>
          </div>
          <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">Truy cập bị từ chối</h3>
          <p className="text-sm text-foreground-500 mb-6">Bạn cần đăng nhập với tài khoản Admin để truy cập trang này</p>
          <button
            onClick={() => navigate('/admin/login')}
            className="px-6 py-2.5 bg-foreground-950 text-foreground-50 rounded-full text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Đăng nhập Admin
          </button>
        </div>
      </div>
    );
  }

  const mobileGroups = [
    {
      label: 'Vận hành',
      icon: 'ri-settings-3-line',
      children: [
        { key: 'jobs' as AdminTab, label: 'Việc làm', icon: 'ri-briefcase-line' },
        { key: 'companies' as AdminTab, label: 'Công ty', icon: 'ri-building-line' },
      ],
    },
    {
      label: 'Tài khoản',
      icon: 'ri-group-line',
      children: [
        { key: 'project-users' as AdminTab, label: 'Người dùng', icon: 'ri-user-line' },
        { key: 'users' as AdminTab, label: 'Quản trị viên', icon: 'ri-shield-user-line' },
      ],
    },
    {
      label: 'Danh mục',
      icon: 'ri-database-2-line',
      children: [
        { key: 'categories' as AdminTab, label: 'Ngành nghề', icon: 'ri-price-tag-3-line' },
        { key: 'education' as AdminTab, label: 'Trình độ', icon: 'ri-graduation-cap-line' },
      ],
    },
    {
      label: 'Phân quyền',
      icon: 'ri-shield-keyhole-line',
      children: [
        { key: 'roles' as AdminTab, label: 'Vai trò', icon: 'ri-shield-check-line' },
        { key: 'permissions' as AdminTab, label: 'Quyền hạn', icon: 'ri-key-2-line' },
      ],
    },
    {
      label: 'Hệ thống',
      icon: 'ri-server-line',
      children: [
        { key: 'banners' as AdminTab, label: 'Banner', icon: 'ri-image-line' },
        { key: 'business-config' as AdminTab, label: 'Cấu hình hệ thống', icon: 'ri-settings-4-line' },
        { key: 'profile' as AdminTab, label: 'Tài khoản', icon: 'ri-user-settings-line' },
      ],
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-background-100 flex">
      {/* Desktop Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        adminName={admin.fullName}
        adminRole={admin.roleIds.length > 0 ? admin.roleIds.length + ' vai trò' : 'Admin'}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 mb-4">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-background-200/70 hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-menu-line text-lg text-foreground-600"></i>
          </button>
          <span className="font-heading font-semibold text-foreground-950">Jobs247 Admin</span>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'companies' && <CompaniesTab />}
        {activeTab === 'project-users' && <ProjectUsersTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'permissions' && <PermissionsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'education' && <EducationTab />}
        {activeTab === 'banners' && <BannersTab />}
        {activeTab === 'business-config' && <BusinessConfigTab />}
        {activeTab === 'profile' && <AdminProfileTab />}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-background-50 overflow-y-auto flex flex-col border-r border-background-200/70">
            <div className="px-4 py-4 border-b border-background-200/70 flex items-center justify-between">
              <div>
                <h1 className="text-sm font-heading font-bold text-foreground-950">Jobs247</h1>
                <p className="text-[10px] text-foreground-400">Quản trị hệ thống</p>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer">
                <i className="ri-close-line text-lg text-foreground-600"></i>
              </button>
            </div>
            <div className="px-4 py-3 border-b border-background-200/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-shield-user-line text-sm text-primary-600"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground-900 truncate">{admin.fullName}</p>
                  <p className="text-[10px] text-foreground-400">{admin.roleIds.length > 0 ? admin.roleIds.length + ' vai trò' : 'Admin'}</p>
                </div>
              </div>
            </div>
            <div className="p-2 flex-1">
              {/* Dashboard standalone */}
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mb-0.5 ${
                  activeTab === 'dashboard' ? 'bg-primary-100 text-primary-700' : 'text-foreground-600 hover:bg-background-100'
                }`}
              >
                <i className="ri-dashboard-line text-base flex-shrink-0"></i>
                <span className="whitespace-nowrap">Tổng quan</span>
              </button>

              {/* Two-level groups */}
              {mobileGroups.map((group) => {
                const hasActive = group.children.some((c) => c.key === activeTab);
                return (
                  <div key={group.label} className="mb-1">
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${hasActive ? 'text-primary-700' : 'text-foreground-700'}`}>
                      <i className={`${group.icon} text-base flex-shrink-0`}></i>
                      <span className="whitespace-nowrap flex-1">{group.label}</span>
                    </div>
                    <div className="pl-9 pr-1">
                      {group.children.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => { setActiveTab(tab.key); setMobileSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer mb-0.5 ${
                            activeTab === tab.key
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
                          }`}
                        >
                          <i className={`${tab.icon} text-sm flex-shrink-0 opacity-70`}></i>
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-background-200/70">
              <button
                onClick={() => { navigate('/admin/login'); setMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <i className="ri-logout-box-line text-base"></i>
                <span className="whitespace-nowrap">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}