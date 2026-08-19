import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AdminUser } from '@/mocks/adminUsers';

interface AdminAuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
}

const initialState: AdminAuthState = {
  admin: null,
  isAuthenticated: false,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    adminLogin(state, action: PayloadAction<AdminUser>) {
      state.admin = action.payload;
      state.isAuthenticated = true;
    },
    adminLogout(state) {
      state.admin = null;
      state.isAuthenticated = false;
    },
    updateAdminProfile(state, action: PayloadAction<Partial<AdminUser>>) {
      if (state.admin) {
        state.admin = { ...state.admin, ...action.payload };
      }
    },
  },
});

export const { adminLogin, adminLogout, updateAdminProfile } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;