import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { adminLogoutRequest } from "@/api/adminAuth";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/api/adminAuthTokens";
import {
  adminLogin,
  adminLogout,
  updateAdminProfile,
  setAdminSessionUser,
} from "@/store/slices/adminAuthSlice";
import type { AdminSessionUser } from "@/types/adminAuth";

/** Domain hook for admin portal session. */
export function useAdminAuth() {
  const dispatch = useAppDispatch();
  const { admin, accessToken, refreshToken, isAuthenticated } = useAppSelector(
    (state) => state.adminAuth,
  );

  return {
    admin,
    accessToken,
    refreshToken,
    isAuthenticated,
    login: (payload: {
      user: AdminSessionUser;
      accessToken: string;
      refreshToken: string;
    }) => {
      dispatch(adminLogin(payload));
    },
    logout: () => {
      const token =
        accessToken || localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      void adminLogoutRequest(token);
      dispatch(adminLogout());
    },
    updateProfile: (patch: Partial<AdminSessionUser>) => {
      dispatch(updateAdminProfile(patch));
    },
    setSessionUser: (user: AdminSessionUser) => {
      dispatch(setAdminSessionUser(user));
    },
  };
}
