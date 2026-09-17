import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminSessionUser } from "@/types/adminAuth";
import { isValidAdminSession } from "@/types/adminAuth";
import { readJson } from "@/lib/storage";
import { clearAdminTokens } from "@/api/adminAuth";

interface AdminAuthState {
  admin: AdminSessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AdminLoginPayload {
  user: AdminSessionUser;
  accessToken: string;
  refreshToken: string;
}

const stored = readJson<AdminAuthState>("redux_adminAuth");

function hydrateInitial(): AdminAuthState {
  const admin = stored?.admin ?? null;
  const accessToken = stored?.accessToken ?? null;
  const refreshToken = stored?.refreshToken ?? null;
  const valid = Boolean(
    admin &&
    isValidAdminSession(admin) &&
    (accessToken || stored?.isAuthenticated),
  );

  if (!valid) {
    clearAdminTokens();
    return {
      admin: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }

  // Keep tokens in localStorage in sync for axios interceptor
  if (accessToken) {
    localStorage.setItem("admin_access_token", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("admin_refresh_token", refreshToken);
  }

  return {
    admin,
    accessToken,
    refreshToken,
    isAuthenticated: true,
  };
}

const initialState: AdminAuthState = hydrateInitial();

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    adminLogin(state, action: PayloadAction<AdminLoginPayload>) {
      state.admin = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    adminLogout(state) {
      state.admin = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      clearAdminTokens();
    },
    updateAdminProfile(
      state,
      action: PayloadAction<Partial<AdminSessionUser>>,
    ) {
      if (state.admin) {
        state.admin = { ...state.admin, ...action.payload };
      }
    },
    setAdminSessionUser(state, action: PayloadAction<AdminSessionUser>) {
      state.admin = action.payload;
    },
  },
});

export const {
  adminLogin,
  adminLogout,
  updateAdminProfile,
  setAdminSessionUser,
} = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
