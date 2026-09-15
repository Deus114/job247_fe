export interface AdminPermission {
  id: number;
  name: string;
  description: string;
  module: string;
  path: string;
  method: string;
  type: "ACTION" | "MODULE" | string;
  active: boolean;
}

export interface AdminRole {
  id: number;
  name: string;
  description: string;
  fullAccess: boolean;
  active: boolean;
  permissions: AdminPermission[];
}

export interface AdminSessionUser {
  id: number;
  username: string;
  name: string;
  avatar: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginData {
  user: AdminSessionUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/** Session is valid when user + role are active (and role is present). */
export function isValidAdminSession(
  user: AdminSessionUser | null | undefined,
): boolean {
  if (!user || !user.active) return false;
  if (!user.role || !user.role.active) return false;
  return true;
}

export function hasAdminPermission(
  user: AdminSessionUser | null | undefined,
  permissionName: string,
): boolean {
  if (!isValidAdminSession(user) || !user) return false;
  if (user.role.fullAccess) return true;
  return (user.role.permissions || []).some(
    (p) => p.active && p.name === permissionName,
  );
}
