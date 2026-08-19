import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { mockAdminUsers, type AdminUser } from '@/mocks/adminUsers';

interface AdminUsersState {
  items: AdminUser[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminUsersState = {
  items: mockAdminUsers,
  loading: false,
  error: null,
};

const adminUserSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {
    setAdminUsers(state, action: PayloadAction<AdminUser[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    addAdminUser(state, action: PayloadAction<AdminUser>) {
      state.items.unshift(action.payload);
    },
    updateAdminUser(state, action: PayloadAction<Partial<AdminUser> & { id: string }>) {
      const index = state.items.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    deleteAdminUser(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((u) => u.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = new Date().toISOString();
      }
    },
    restoreAdminUser(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((u) => u.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = undefined;
      }
    },
    permanentDeleteAdminUser(state, action: PayloadAction<string>) {
      state.items = state.items.filter((u) => u.id !== action.payload);
    },
    toggleAdminUserStatus(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((u) => u.id === action.payload);
      if (index !== -1) {
        state.items[index].status = state.items[index].status === 'active' ? 'inactive' : 'active';
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setAdminUsers, addAdminUser, updateAdminUser, deleteAdminUser,
  restoreAdminUser, permanentDeleteAdminUser,
  toggleAdminUserStatus, setLoading, setError,
} = adminUserSlice.actions;
export default adminUserSlice.reducer;