import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { adminLogoutRequest, getAdminAccessToken } from "@/api/adminAuth";
import {
  adminLogin,
  adminLogout,
  updateAdminProfile,
  setAdminSessionUser,
} from "@/store/slices/adminAuthSlice";
import type { AdminSessionUser } from "@/types/adminAuth";
import { useCallback, useMemo } from "react";

/** Domain hook for admin portal session. */
export function useAdminAuth() {
  const dispatch = useAppDispatch();
  const { admin, isAuthenticated } = useAppSelector((state) => state.adminAuth);

  const login = useCallback(
    (payload: { user: AdminSessionUser }) => {
      dispatch(adminLogin(payload));
    },
    [dispatch],
  );

  const logout = useCallback(() => {
    const token = getAdminAccessToken();
    void adminLogoutRequest(token);
    dispatch(adminLogout());
  }, [dispatch]);

  const updateProfile = useCallback(
    (patch: Partial<AdminSessionUser>) => {
      dispatch(updateAdminProfile(patch));
    },
    [dispatch],
  );

  const setSessionUser = useCallback(
    (user: AdminSessionUser) => {
      dispatch(setAdminSessionUser(user));
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      admin,
      accessToken: getAdminAccessToken(),
      isAuthenticated,
      login,
      logout,
      updateProfile,
      setSessionUser,
    }),
    [admin, isAuthenticated, login, logout, updateProfile, setSessionUser],
  );
}
