import { fetchPublicMe, logoutRequest } from "@/api";
import { unregisterStoredDeviceToken } from "@/api/deviceTokens";
import { getPublicAccessToken } from "@/api/publicAuthTokens";
import { env } from "@/config/env";
import { usePublicPushSync } from "@/hooks/usePushSync";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, logout, updateProfile } from "@/store/slices/authSlice";
import type { AuthUser } from "@/types";
import { useCallback, useEffect, useMemo } from "react";

let syncedAccessToken: string | null = null;

/** Allow the next profile sync (e.g. after company membership changes). */
export function invalidatePublicProfileSync() {
  syncedAccessToken = null;
}

/** Load GET /auth/me once per access token so the shell shows the saved profile. */
export function useSyncPublicProfile() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  usePublicPushSync();

  useEffect(() => {
    if (!isAuthenticated || !env.apiBaseUrl) return;
    const token = getPublicAccessToken();
    if (!token || syncedAccessToken === token) return;
    syncedAccessToken = token;
    void fetchPublicMe()
      .then((next) => {
        dispatch(login(next));
      })
      .catch(() => {
        if (syncedAccessToken === token) syncedAccessToken = null;
      });
  }, [isAuthenticated, dispatch]);
}

/** Domain hook for end-user auth session. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const loginUser = useCallback(
    (next: AuthUser) => {
      dispatch(login(next));
    },
    [dispatch],
  );

  const logoutUser = useCallback(async () => {
    await unregisterStoredDeviceToken("public");
    const message = await logoutRequest();
    syncedAccessToken = null;
    dispatch(logout());
    return message;
  }, [dispatch]);

  const patchProfile = useCallback(
    (patch: Partial<AuthUser>) => {
      dispatch(updateProfile(patch));
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isEmployer: user?.role === "employer",
      isCandidate: user?.role === "user",
      login: loginUser,
      logout: logoutUser,
      updateProfile: patchProfile,
    }),
    [user, isAuthenticated, loginUser, logoutUser, patchProfile],
  );
}
