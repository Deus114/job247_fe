import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types";
import { readJson } from "@/lib/storage";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

interface PersistedAuth {
  user: AuthUser | null;
}

const stored = readJson<PersistedAuth & { isAuthenticated?: boolean }>(
  "redux_auth",
);

const initialState: AuthState = {
  user: stored?.user ?? null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    updateProfile(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { login, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
