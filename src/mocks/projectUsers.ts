export type ProjectUserRole = 'candidate' | 'recruiter';

export interface ProjectUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: ProjectUserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  deletedAt?: string;
  // Candidate-specific
  jobTitle?: string;
  education?: string;
  // Recruiter-specific
  companyName?: string;
  companyId?: string;
}

export const mockProjectUsers: ProjectUser[] = [
  {
    id: 'pu-001',
    fullName: 'Nguyễn Thị Lan Anh',
    email: 'lananh@gmail.com',
    phone: '0901111111',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20young%20Vietnamese%20woman%20with%20long%20hair%2C%20warm%20smile%2C%20clean%20neutral%20background%2C%20modern%20style%2C%20soft%20natural%20lighting&width=200&height=200&seq=pu-avatar-001&orientation=squarish',
    role: 'candidate',
    status: 'active',
    jobTitle: 'Frontend Developer',
    education: 'Đại học Bách Khoa HCM',
    createdAt: '2025-10-15',
    lastLogin: '2026-08-01',
  },
  {
    id: 'pu-002',
    fullName: 'Trần Minh Khoa',
    email: 'minhkhoa@gmail.com',
    phone: '0912222222',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20young%20Vietnamese%20man%20with%20glasses%2C%20friendly%20expression%2C%20clean%20background%2C%20modern%20casual%20business%20style%2C%20soft%20lighting&width=200&height=200&seq=pu-avatar-002&orientation=squarish',
    role: 'candidate',
    status: 'active',
    jobTitle: 'UX/UI Designer',
    education: 'Đại học Kiến Trúc HCM',
    createdAt: '2025-11-01',
    lastLogin: '2026-07-31',
  },
  {
    id: 'pu-003',
    fullName: 'Lê Hoàng Phúc',
    email: 'hoangphuc@gmail.com',
    phone: '0923333333',
    role: 'candidate',
    status: 'active',
    jobTitle: 'Marketing Executive',
    education: 'Đại học Ngoại Thương',
    createdAt: '2026-01-05',
    lastLogin: '2026-08-02',
  },
  {
    id: 'pu-004',
    fullName: 'Phạm Thu Hà',
    email: 'thuha@gmail.com',
    phone: '0934444444',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20Vietnamese%20woman%20in%20her%2030s%2C%20professional%20appearance%2C%20warm%20background%2C%20clean%20modern%20corporate%20photo%20style&width=200&height=200&seq=pu-avatar-004&orientation=squarish',
    role: 'candidate',
    status: 'inactive',
    jobTitle: 'Kế toán trưởng',
    education: 'Đại học Kinh tế HCM',
    createdAt: '2026-02-10',
    lastLogin: '2026-06-20',
  },
  {
    id: 'pu-005',
    fullName: 'Vũ Đức Thắng',
    email: 'ducthang@fpt.com.vn',
    phone: '0945555555',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20Vietnamese%20male%20HR%20manager%2C%20business%20attire%2C%20clean%20neutral%20background%2C%20confident%20expression%2C%20soft%20studio%20lighting&width=200&height=200&seq=pu-avatar-005&orientation=squarish',
    role: 'recruiter',
    status: 'active',
    companyName: 'FPT Software',
    companyId: 'c1',
    createdAt: '2025-09-01',
    lastLogin: '2026-08-01',
  },
  {
    id: 'pu-006',
    fullName: 'Nguyễn Bích Ngọc',
    email: 'bichngoc@vingroup.net',
    phone: '0956666666',
    role: 'recruiter',
    status: 'active',
    companyName: 'Vingroup',
    companyId: 'c2',
    createdAt: '2025-11-15',
    lastLogin: '2026-08-02',
  },
  {
    id: 'pu-007',
    fullName: 'Cao Văn Nam',
    email: 'caonam@techcombank.com',
    phone: '0967777777',
    role: 'recruiter',
    status: 'active',
    companyName: 'Techcombank',
    companyId: 'c3',
    createdAt: '2026-01-20',
    lastLogin: '2026-07-30',
  },
  {
    id: 'pu-008',
    fullName: 'Đỗ Thanh Tùng',
    email: 'thanhtung@momo.vn',
    phone: '0978888888',
    role: 'recruiter',
    status: 'inactive',
    companyName: 'MoMo',
    companyId: 'c5',
    createdAt: '2026-03-01',
    lastLogin: '2026-06-15',
  },
  {
    id: 'pu-009',
    fullName: 'Nguyễn Quỳnh Mai',
    email: 'quynhmai2024@gmail.com',
    phone: '0989999999',
    role: 'candidate',
    status: 'active',
    jobTitle: 'Data Analyst',
    education: 'Đại học KHTN HCM',
    createdAt: '2026-04-12',
    lastLogin: '2026-07-28',
  },
  {
    id: 'pu-010',
    fullName: 'Hoàng Anh Dũng',
    email: 'anhdung@gmail.com',
    phone: '0990000001',
    role: 'candidate',
    status: 'active',
    jobTitle: 'Backend Developer',
    education: 'Đại học CNTT HCM',
    createdAt: '2026-05-20',
    lastLogin: '2026-08-01',
  },
];