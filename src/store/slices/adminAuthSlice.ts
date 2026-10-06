import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminSessionUser } from "@/types/adminAuth";
import { isValidAdminSession } from "@/types/adminAuth";
import { readJson } from "@/lib/storage";
import { clearAdminTokens } from "@/api/adminAuthTokens";

interface AdminAuthState {
  admin: AdminSessionUser | null;
  isAuthenticated: boolean;
}

interface AdminLoginPayload {
  user: AdminSessionUser;
}

interface PersistedAdminAuth {
  admin: AdminSessionUser | null;
}

const stored = readJson<PersistedAdminAuth>("redux_adminAuth");

function hydrateInitial(): AdminAuthState {
  clearAdminTokens();
  const admin = stored?.admin ?? null;
  if (!admin || !isValidAdminSession(admin)) {
    return {
      admin: null,
      isAuthenticated: false,
    };
  }
  return {
    admin,
    isAuthenticated: false,
  };
}

const initialState: AdminAuthState = hydrateInitial();

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    adminLogin(state, action: PayloadAction<AdminLoginPayload>) {
      state.admin = action.payload.user;
      state.isAuthenticated = true;
    },
    adminLogout(state) {
      state.admin = null;
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
