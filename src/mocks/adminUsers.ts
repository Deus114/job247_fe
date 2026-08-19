export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  roleIds: string[];
  status: 'active' | 'inactive';
  avatar?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  deletedAt?: string;
}

/* Admin users — separate from project users (different database table).
   Each admin user can have multiple roles. */
export const mockAdminUsers: AdminUser[] = [
  {
    id: 'admin-001',
    fullName: 'Nguyễn Quản Trị',
    email: 'superadmin@jobs247.vn',
    password: 'Admin@2025',
    roleIds: ['role-super-admin'],
    status: 'active',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20confident%20Vietnamese%20male%20manager%20in%20business%20attire%2C%20neutral%20warm%20background%2C%20soft%20studio%20lighting%2C%20clean%20corporate%20style&width=200&height=200&seq=avatar-admin-001&orientation=squarish',
    phone: '0901234567',
    createdAt: '2025-01-10',
    lastLogin: '2026-08-02',
  },
  {
    id: 'admin-002',
    fullName: 'Trần Văn Quản Lý',
    email: 'admin@jobs247.vn',
    password: 'Admin@2025',
    roleIds: ['role-admin'],
    status: 'active',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20young%20Vietnamese%20male%20office%20worker%20with%20glasses%2C%20friendly%20smile%2C%20neutral%20background%2C%20soft%20lighting&width=200&height=200&seq=avatar-admin-002&orientation=squarish',
    phone: '0912345678',
    createdAt: '2025-03-15',
    lastLogin: '2026-08-01',
  },
  {
    id: 'admin-003',
    fullName: 'Lê Thị Kiểm Duyệt',
    email: 'moderator@jobs247.vn',
    password: 'Admin@2025',
    roleIds: ['role-moderator'],
    status: 'active',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20Vietnamese%20female%20professional%20with%20short%20hair%2C%20warm%20smile%2C%20neutral%20background%2C%20clean%20corporate%20style&width=200&height=200&seq=avatar-admin-003&orientation=squarish',
    phone: '0923456789',
    createdAt: '2025-06-20',
    lastLogin: '2026-07-31',
  },
  {
    id: 'admin-004',
    fullName: 'Phạm Văn Nội Dung',
    email: 'content@jobs247.vn',
    password: 'Admin@2025',
    roleIds: ['role-content', 'role-moderator'],
    status: 'active',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20Vietnamese%20male%20creative%20professional%20in%20casual%20smart%20attire%2C%20modern%20office%20background%2C%20soft%20natural%20lighting&width=200&height=200&seq=avatar-admin-004&orientation=squarish',
    phone: '0934567890',
    createdAt: '2025-09-01',
    lastLogin: '2026-07-30',
  },
  {
    id: 'admin-005',
    fullName: 'Hoàng Minh Dự Phòng',
    email: 'backup@jobs247.vn',
    password: 'Admin@2025',
    roleIds: ['role-admin'],
    status: 'inactive',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20middle%20aged%20Vietnamese%20male%20in%20formal%20business%20attire%2C%20neutral%20corporate%20background%2C%20soft%20lighting&width=200&height=200&seq=avatar-admin-005&orientation=squarish',
    phone: '0945678901',
    createdAt: '2025-11-20',
    lastLogin: '2026-06-15',
  },
];