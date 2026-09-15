import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, logout, updateProfile } from '@/store/slices/authSlice';
import { clearAccessToken } from '@/api';
import type { AuthUser } from '@/types';

/** Domain hook for end-user auth session. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  return {
    user,
    isAuthenticated,
    isEmployer: user?.role === 'employer',
    isCandidate: user?.role === 'user',
    login: (next: AuthUser) => {
      dispatch(login(next));
    },
    logout: () => {
      clearAccessToken();
      dispatch(logout());
    },
    updateProfile: (patch: Partial<AuthUser>) => {
      dispatch(updateProfile(patch));
    },
  };
}
