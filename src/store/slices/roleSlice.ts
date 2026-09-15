import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { mockRoles, mockPermissions } from '@/mocks/roles';
import type { Role, Permission } from '@/types/role';

interface RolesState {
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

const initialState: RolesState = {
  roles: mockRoles,
  permissions: mockPermissions,
  loading: false,
  error: null,
};

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    setRoles(state, action: PayloadAction<Role[]>) {
      state.roles = action.payload;
      state.loading = false;
    },
    addRole(state, action: PayloadAction<Role>) {
      state.roles.unshift(action.payload);
    },
    updateRole(state, action: PayloadAction<Partial<Role> & { id: string }>) {
      const index = state.roles.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.roles[index] = { ...state.roles[index], ...action.payload };
      }
    },
    deleteRole(state, action: PayloadAction<string>) {
      const index = state.roles.findIndex((r) => r.id === action.payload);
      if (index !== -1) {
        state.roles[index].deletedAt = new Date().toISOString();
      }
    },
    restoreRole(state, action: PayloadAction<string>) {
      const index = state.roles.findIndex((r) => r.id === action.payload);
      if (index !== -1) {
        state.roles[index].deletedAt = undefined;
      }
    },
    permanentDeleteRole(state, action: PayloadAction<string>) {
      state.roles = state.roles.filter((r) => r.id !== action.payload);
    },
    setPermissions(state, action: PayloadAction<Permission[]>) {
      state.permissions = action.payload;
    },
    addPermission(state, action: PayloadAction<Permission>) {
      state.permissions.unshift(action.payload);
    },
    updatePermission(state, action: PayloadAction<Partial<Permission> & { id: string }>) {
      const index = state.permissions.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.permissions[index] = { ...state.permissions[index], ...action.payload };
      }
    },
    deletePermission(state, action: PayloadAction<string>) {
      const index = state.permissions.findIndex((p) => p.id === action.payload);
      if (index !== -1) {
        state.permissions[index].deletedAt = new Date().toISOString();
      }
    },
    restorePermission(state, action: PayloadAction<string>) {
      const index = state.permissions.findIndex((p) => p.id === action.payload);
      if (index !== -1) {
        state.permissions[index].deletedAt = undefined;
      }
    },
    permanentDeletePermission(state, action: PayloadAction<string>) {
      state.permissions = state.permissions.filter((p) => p.id !== action.payload);
      state.roles.forEach((role) => {
        role.permissions = role.permissions.filter((pid) => pid !== action.payload);
      });
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    toggleRoleActive(state, action: PayloadAction<string>) {
      const index = state.roles.findIndex((r) => r.id === action.payload);
      if (index !== -1) {
        state.roles[index].isActive = state.roles[index].isActive === false ? true : false;
      }
    },
    togglePermissionActive(state, action: PayloadAction<string>) {
      const index = state.permissions.findIndex((p) => p.id === action.payload);
      if (index !== -1) {
        state.permissions[index].isActive = state.permissions[index].isActive === false ? true : false;
      }
    },
  },
});

export const {
  setRoles, addRole, updateRole, deleteRole,
  restoreRole, permanentDeleteRole,
  setPermissions, addPermission, updatePermission,
  deletePermission, restorePermission, permanentDeletePermission,
  setLoading, setError,
  toggleRoleActive, togglePermissionActive,
} = roleSlice.actions;
export default roleSlice.reducer;