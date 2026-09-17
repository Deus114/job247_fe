import type { Permission, Role } from '@/types/role';

export type { Permission, Role };

export const mockPermissions: Permission[] = [
  // Module access permissions
  { id: 'perm_module_dashboard', name: 'Truy cập Tổng quan', description: 'Cho phép xem module Tổng quan', module: 'Tổng quan', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_jobs', name: 'Truy cập Việc làm', description: 'Cho phép xem module Việc làm', module: 'Việc làm', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_companies', name: 'Truy cập Công ty', description: 'Cho phép xem module Công ty', module: 'Công ty', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_users', name: 'Truy cập Người dùng', description: 'Cho phép xem module Người dùng', module: 'Người dùng', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_roles', name: 'Truy cập Vai trò', description: 'Cho phép xem module Vai trò', module: 'Vai trò', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_permissions', name: 'Truy cập Quyền hạn', description: 'Cho phép xem module Quyền hạn', module: 'Quyền hạn', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_industry_groups', name: 'Truy cập Nhóm ngành nghề', description: 'Cho phép xem module Nhóm ngành nghề', module: 'Danh mục', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_industries', name: 'Truy cập Ngành nghề', description: 'Cho phép xem module Ngành nghề', module: 'Danh mục', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_provinces', name: 'Truy cập Tỉnh thành phố', description: 'Cho phép xem module Tỉnh thành phố', module: 'Danh mục', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_education', name: 'Truy cập Trình độ', description: 'Cho phép xem module Trình độ', module: 'Danh mục', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_business_config', name: 'Truy cập Cấu hình hệ thống', description: 'Cho phép xem module Cấu hình hệ thống', module: 'Hệ thống', type: 'module_access', createdAt: '2025-01-01' },
  { id: 'perm_module_profile', name: 'Truy cập Tài khoản', description: 'Cho phép xem module Tài khoản', module: 'Tài khoản', type: 'module_access', createdAt: '2025-01-01' },

  // Action permissions - Dashboard
  { id: 'perm_dashboard_view', name: 'Xem thống kê', description: 'Xem dashboard và thống kê hệ thống', module: 'Tổng quan', type: 'action', apiRoute: 'GET /api/admin/dashboard', createdAt: '2025-01-01' },

  // Action permissions - Jobs
  { id: 'perm_jobs_view', name: 'Xem việc làm', description: 'Xem danh sách tin tuyển dụng', module: 'Việc làm', type: 'action', apiRoute: 'GET /api/admin/jobs', createdAt: '2025-01-01' },
  { id: 'perm_jobs_create', name: 'Thêm việc làm', description: 'Tạo tin tuyển dụng mới', module: 'Việc làm', type: 'action', apiRoute: 'POST /api/admin/jobs', createdAt: '2025-01-01' },
  { id: 'perm_jobs_edit', name: 'Sửa việc làm', description: 'Chỉnh sửa tin tuyển dụng', module: 'Việc làm', type: 'action', apiRoute: 'PUT /api/admin/jobs/:id', createdAt: '2025-01-01' },
  { id: 'perm_jobs_delete', name: 'Xóa việc làm', description: 'Xóa tin tuyển dụng', module: 'Việc làm', type: 'action', apiRoute: 'DELETE /api/admin/jobs/:id', createdAt: '2025-01-01' },
  { id: 'perm_jobs_approve', name: 'Duyệt việc làm', description: 'Phê duyệt hoặc từ chối tin tuyển dụng', module: 'Việc làm', type: 'action', apiRoute: 'PUT /api/admin/jobs/:id/approve', createdAt: '2025-01-01' },

  // Action permissions - Companies
  { id: 'perm_companies_view', name: 'Xem công ty', description: 'Xem danh sách công ty', module: 'Công ty', type: 'action', apiRoute: 'GET /api/admin/companies', createdAt: '2025-01-01' },
  { id: 'perm_companies_create', name: 'Thêm công ty', description: 'Tạo công ty mới', module: 'Công ty', type: 'action', apiRoute: 'POST /api/admin/companies', createdAt: '2025-01-01' },
  { id: 'perm_companies_edit', name: 'Sửa công ty', description: 'Chỉnh sửa thông tin công ty', module: 'Công ty', type: 'action', apiRoute: 'PUT /api/admin/companies/:id', createdAt: '2025-01-01' },
  { id: 'perm_companies_delete', name: 'Xóa công ty', description: 'Xóa công ty khỏi hệ thống', module: 'Công ty', type: 'action', apiRoute: 'DELETE /api/admin/companies/:id', createdAt: '2025-01-01' },
  { id: 'perm_companies_approve', name: 'Duyệt công ty', description: 'Phê duyệt hoặc từ chối công ty', module: 'Công ty', type: 'action', apiRoute: 'PUT /api/admin/companies/:id/approve', createdAt: '2025-01-01' },

  // Action permissions - Users
  { id: 'perm_users_view', name: 'Xem người dùng', description: 'Xem danh sách người dùng hệ thống', module: 'Người dùng', type: 'action', apiRoute: 'GET /api/admin/users', createdAt: '2025-01-01' },
  { id: 'perm_users_create', name: 'Thêm người dùng', description: 'Tạo tài khoản quản trị mới', module: 'Người dùng', type: 'action', apiRoute: 'POST /api/admin/users', createdAt: '2025-01-01' },
  { id: 'perm_users_edit', name: 'Sửa người dùng', description: 'Chỉnh sửa thông tin tài khoản quản trị', module: 'Người dùng', type: 'action', apiRoute: 'PUT /api/admin/users/:id', createdAt: '2025-01-01' },
  { id: 'perm_users_delete', name: 'Xóa người dùng', description: 'Xóa tài khoản quản trị', module: 'Người dùng', type: 'action', apiRoute: 'DELETE /api/admin/users/:id', createdAt: '2025-01-01' },
  { id: 'perm_users_toggle_status', name: 'Khóa/Mở khóa', description: 'Thay đổi trạng thái hoạt động của tài khoản', module: 'Người dùng', type: 'action', apiRoute: 'PUT /api/admin/users/:id/status', createdAt: '2025-01-01' },

  // Action permissions - Roles
  { id: 'perm_roles_view', name: 'Xem vai trò', description: 'Xem danh sách vai trò', module: 'Vai trò', type: 'action', apiRoute: 'GET /api/admin/roles', createdAt: '2025-01-01' },
  { id: 'perm_roles_create', name: 'Thêm vai trò', description: 'Tạo vai trò mới', module: 'Vai trò', type: 'action', apiRoute: 'POST /api/admin/roles', createdAt: '2025-01-01' },
  { id: 'perm_roles_edit', name: 'Sửa vai trò', description: 'Chỉnh sửa thông tin vai trò', module: 'Vai trò', type: 'action', apiRoute: 'PUT /api/admin/roles/:id', createdAt: '2025-01-01' },
  { id: 'perm_roles_delete', name: 'Xóa vai trò', description: 'Xóa vai trò khỏi hệ thống', module: 'Vai trò', type: 'action', apiRoute: 'DELETE /api/admin/roles/:id', createdAt: '2025-01-01' },
  { id: 'perm_roles_assign', name: 'Phân quyền', description: 'Gán quyền cho vai trò', module: 'Vai trò', type: 'action', apiRoute: 'PUT /api/admin/roles/:id/permissions', createdAt: '2025-01-01' },

  // Action permissions - Permissions
  { id: 'perm_permissions_view', name: 'Xem quyền hạn', description: 'Xem danh sách quyền hạn', module: 'Quyền hạn', type: 'action', apiRoute: 'GET /api/admin/permissions', createdAt: '2025-01-01' },
  { id: 'perm_permissions_create', name: 'Thêm quyền', description: 'Tạo quyền mới', module: 'Quyền hạn', type: 'action', apiRoute: 'POST /api/admin/permissions', createdAt: '2025-01-01' },
  { id: 'perm_permissions_edit', name: 'Sửa quyền', description: 'Chỉnh sửa thông tin quyền', module: 'Quyền hạn', type: 'action', apiRoute: 'PUT /api/admin/permissions/:id', createdAt: '2025-01-01' },
  { id: 'perm_permissions_delete', name: 'Xóa quyền', description: 'Xóa quyền khỏi hệ thống', module: 'Quyền hạn', type: 'action', apiRoute: 'DELETE /api/admin/permissions/:id', createdAt: '2025-01-01' },

  // Action permissions - Industry groups
  { id: 'perm_industry_groups_view', name: 'Xem nhóm ngành nghề', description: 'Xem danh sách nhóm ngành nghề', module: 'Danh mục', type: 'action', apiRoute: 'GET /api/admin/industry-groups', createdAt: '2025-01-01' },
  { id: 'perm_industry_groups_create', name: 'Thêm nhóm ngành nghề', description: 'Tạo nhóm ngành nghề mới', module: 'Danh mục', type: 'action', apiRoute: 'POST /api/admin/industry-groups', createdAt: '2025-01-01' },
  { id: 'perm_industry_groups_edit', name: 'Sửa nhóm ngành nghề', description: 'Chỉnh sửa nhóm ngành nghề', module: 'Danh mục', type: 'action', apiRoute: 'PUT /api/admin/industry-groups/:id', createdAt: '2025-01-01' },
  { id: 'perm_industry_groups_delete', name: 'Xóa nhóm ngành nghề', description: 'Xóa nhóm ngành nghề', module: 'Danh mục', type: 'action', apiRoute: 'DELETE /api/admin/industry-groups/:id', createdAt: '2025-01-01' },

  // Action permissions - Industries
  { id: 'perm_industries_view', name: 'Xem ngành nghề', description: 'Xem danh sách ngành nghề', module: 'Danh mục', type: 'action', apiRoute: 'GET /api/admin/industries', createdAt: '2025-01-01' },
  { id: 'perm_industries_create', name: 'Thêm ngành nghề', description: 'Tạo ngành nghề mới', module: 'Danh mục', type: 'action', apiRoute: 'POST /api/admin/industries', createdAt: '2025-01-01' },
  { id: 'perm_industries_edit', name: 'Sửa ngành nghề', description: 'Chỉnh sửa thông tin ngành nghề', module: 'Danh mục', type: 'action', apiRoute: 'PUT /api/admin/industries/:id', createdAt: '2025-01-01' },
  { id: 'perm_industries_delete', name: 'Xóa ngành nghề', description: 'Xóa ngành nghề', module: 'Danh mục', type: 'action', apiRoute: 'DELETE /api/admin/industries/:id', createdAt: '2025-01-01' },

  // Action permissions - Provinces
  { id: 'perm_provinces_view', name: 'Xem tỉnh thành phố', description: 'Xem danh sách tỉnh / thành phố', module: 'Danh mục', type: 'action', apiRoute: 'GET /api/admin/provinces', createdAt: '2025-01-01' },
  { id: 'perm_provinces_create', name: 'Thêm tỉnh thành phố', description: 'Tạo tỉnh / thành phố mới', module: 'Danh mục', type: 'action', apiRoute: 'POST /api/admin/provinces', createdAt: '2025-01-01' },
  { id: 'perm_provinces_edit', name: 'Sửa tỉnh thành phố', description: 'Chỉnh sửa tỉnh / thành phố', module: 'Danh mục', type: 'action', apiRoute: 'PUT /api/admin/provinces/:id', createdAt: '2025-01-01' },
  { id: 'perm_provinces_delete', name: 'Xóa tỉnh thành phố', description: 'Xóa tỉnh / thành phố', module: 'Danh mục', type: 'action', apiRoute: 'DELETE /api/admin/provinces/:id', createdAt: '2025-01-01' },

  // Action permissions - Education
  { id: 'perm_education_view', name: 'Xem trình độ', description: 'Xem danh sách trình độ', module: 'Danh mục', type: 'action', apiRoute: 'GET /api/admin/education', createdAt: '2025-01-01' },
  { id: 'perm_education_create', name: 'Thêm trình độ', description: 'Tạo trình độ mới', module: 'Danh mục', type: 'action', apiRoute: 'POST /api/admin/education', createdAt: '2025-01-01' },
  { id: 'perm_education_edit', name: 'Sửa trình độ', description: 'Chỉnh sửa thông tin trình độ', module: 'Danh mục', type: 'action', apiRoute: 'PUT /api/admin/education/:id', createdAt: '2025-01-01' },
  { id: 'perm_education_delete', name: 'Xóa trình độ', description: 'Xóa trình độ', module: 'Danh mục', type: 'action', apiRoute: 'DELETE /api/admin/education/:id', createdAt: '2025-01-01' },

  // Action permissions - Business Config
  { id: 'perm_business_config_view', name: 'Xem cấu hình hệ thống', description: 'Xem cấu hình doanh nghiệp, banner, SMTP', module: 'Hệ thống', type: 'action', apiRoute: 'GET /api/admin/business-config', createdAt: '2025-01-01' },
  { id: 'perm_business_config_edit', name: 'Sửa cấu hình hệ thống', description: 'Chỉnh sửa cấu hình doanh nghiệp, banner, SMTP', module: 'Hệ thống', type: 'action', apiRoute: 'PUT /api/admin/business-config', createdAt: '2025-01-01' },

  // Action permissions - Profile
  { id: 'perm_profile_edit', name: 'Sửa tài khoản', description: 'Chỉnh sửa thông tin cá nhân', module: 'Tài khoản', type: 'action', apiRoute: 'PUT /api/admin/profile', createdAt: '2025-01-01' },
  { id: 'perm_profile_password', name: 'Đổi mật khẩu', description: 'Thay đổi mật khẩu tài khoản', module: 'Tài khoản', type: 'action', apiRoute: 'PUT /api/admin/profile/password', createdAt: '2025-01-01' },
];

export const mockRoles: Role[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Toàn quyền quản trị hệ thống, có thể thực hiện mọi thao tác',
    permissions: mockPermissions.map((p) => p.id),
    createdAt: '2025-01-01',
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Quản trị viên có quyền quản lý nội dung và người dùng',
    permissions: [
      'perm_module_dashboard', 'perm_dashboard_view',
      'perm_module_jobs', 'perm_jobs_view', 'perm_jobs_create', 'perm_jobs_edit', 'perm_jobs_delete', 'perm_jobs_approve',
      'perm_module_companies', 'perm_companies_view', 'perm_companies_create', 'perm_companies_edit', 'perm_companies_delete', 'perm_companies_approve',
      'perm_module_users', 'perm_users_view', 'perm_users_create', 'perm_users_edit', 'perm_users_delete', 'perm_users_toggle_status',
      'perm_module_industry_groups', 'perm_industry_groups_view', 'perm_industry_groups_create', 'perm_industry_groups_edit', 'perm_industry_groups_delete',
      'perm_module_industries', 'perm_industries_view', 'perm_industries_create', 'perm_industries_edit', 'perm_industries_delete',
      'perm_module_provinces', 'perm_provinces_view', 'perm_provinces_create', 'perm_provinces_edit', 'perm_provinces_delete',
      'perm_module_education', 'perm_education_view', 'perm_education_create', 'perm_education_edit', 'perm_education_delete',
      'perm_module_business_config', 'perm_business_config_view', 'perm_business_config_edit',
      'perm_module_profile', 'perm_profile_edit', 'perm_profile_password',
    ],
    createdAt: '2025-02-01',
  },
  {
    id: 'role-moderator',
    name: 'Moderator',
    description: 'Kiểm duyệt viên, chỉ có quyền xem và duyệt nội dung',
    permissions: [
      'perm_module_dashboard', 'perm_dashboard_view',
      'perm_module_jobs', 'perm_jobs_view', 'perm_jobs_approve',
      'perm_module_companies', 'perm_companies_view', 'perm_companies_approve',
      'perm_module_users', 'perm_users_view',
      'perm_module_profile', 'perm_profile_edit',
    ],
    createdAt: '2025-06-01',
  },
  {
    id: 'role-content',
    name: 'Content Manager',
    description: 'Quản lý nội dung: việc làm, cấu hình hệ thống, danh mục',
    permissions: [
      'perm_module_dashboard', 'perm_dashboard_view',
      'perm_module_jobs', 'perm_jobs_view', 'perm_jobs_create', 'perm_jobs_edit',
      'perm_module_business_config', 'perm_business_config_view', 'perm_business_config_edit',
      'perm_module_industry_groups', 'perm_industry_groups_view', 'perm_industry_groups_create', 'perm_industry_groups_edit',
      'perm_module_industries', 'perm_industries_view', 'perm_industries_create', 'perm_industries_edit',
      'perm_module_provinces', 'perm_provinces_view', 'perm_provinces_create', 'perm_provinces_edit',
      'perm_module_education', 'perm_education_view', 'perm_education_create', 'perm_education_edit',
      'perm_module_profile', 'perm_profile_edit',
    ],
    createdAt: '2025-08-01',
  },
];
