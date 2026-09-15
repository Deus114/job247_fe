export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  type: 'module_access' | 'action';
  apiRoute?: string;
  createdAt?: string;
  deletedAt?: string;
  isActive?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
  deletedAt?: string;
  isActive?: boolean;
}
