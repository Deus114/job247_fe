import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { adminLogin, adminLogout, updateAdminProfile } from '@/store/slices/adminAuthSlice';
import type { AdminSessionUser } from '@/types/adminAuth';

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
      dispatch(adminLogout());
    },
    updateProfile: (patch: Partial<AdminSessionUser>) => {
      dispatch(updateAdminProfile(patch));
    },
  };
}
