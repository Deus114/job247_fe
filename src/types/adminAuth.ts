export interface AdminPermission {
  id: number;
  name: string;
  description: string;
  module: string;
  path: string;
  method: string;
  type: "ACTION" | "MODULE" | string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminPermissionListParams {
  keyword?: string;
  module?: string;
  method?: string;
  type?: string;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AdminPermissionWritePayload {
  name: string;
  description?: string;
  module: string;
  path: string;
  method: string;
  type: string;
  active?: boolean;
}

export interface AdminRole {
  id: number;
  name: string;
  description: string;
  fullAccess: boolean;
  active: boolean;
  permissions: AdminPermission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRoleListParams {
  keyword?: string;
  fullAccess?: boolean;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AdminRoleWritePayload {
  name: string;
  description?: string;
  fullAccess: boolean;
  active?: boolean;
  permissionIds: number[];
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
  /** When true, this browser may register an FCM device token. */
  pushEnabled?: boolean;
}

export interface AdminAccountListParams {
  keyword?: string;
  roleId?: number;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AdminAccountWritePayload {
  username: string;
  password?: string;
  name: string;
  roleId: number;
  active?: boolean;
  avatarFile?: File | null;
}

export interface AdminAccountUpdatePayload {
  username: string;
  name: string;
  roleId: number;
  active?: boolean;
  currentPassword?: string;
  newPassword?: string;
  avatarFile?: File | null;
}

export interface AdminLoginData {
  user: AdminSessionUser;
  accessToken: string;
}

export interface AdminLoginPayload {
  userName: string;
  password: string;
}

export interface AdminLoginResult {
  user: AdminSessionUser;
  accessToken: string;
  message: string;
}

export type EnsureAdminSessionResult =
  | { ok: true; user: AdminSessionUser; refreshed: boolean }
  | { ok: false; reason: "unauthenticated" | "session_expired" | "network" };

export interface UpdateAdminMePayload {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
  avatarFile?: File;
  /** Omit when the preference is unchanged. */
  pushEnabled?: boolean;
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

export function normalizeAdminModulePath(path: string): string {
  let value = path.trim();
  const hash = value.indexOf("#");
  if (hash >= 0) value = value.slice(0, hash);
  const query = value.indexOf("?");
  if (query >= 0) value = value.slice(0, query);
  value = value.replace(/^\/+/, "").replace(/\/+$/, "");
  value = value.replace(/^api(?:\/v\d+)?\//i, "");
  return value.toLowerCase();
}

export function canAccessAdminModule(
  user: AdminSessionUser | null | undefined,
  pagePath: string,
): boolean {
  if (!isValidAdminSession(user) || !user) return false;
  if (user.role.fullAccess) return true;

  const target = normalizeAdminModulePath(pagePath);
  if (!target) return false;

  return (user.role.permissions || []).some((permission) => {
    if (!permission.active) return false;
    if (String(permission.type).toUpperCase() !== "MODULE") return false;
    const granted = normalizeAdminModulePath(permission.path);
    if (!granted) return false;
    return target === granted || target.startsWith(`${granted}/`);
  });
}
