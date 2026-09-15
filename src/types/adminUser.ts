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
