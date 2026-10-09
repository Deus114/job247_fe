import { syncDeviceToken } from "@/lib/push";
import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";

/** Register this browser's FCM token after login. `pushEnabled` is not a gate. */
export function usePublicPushSync() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncDeviceToken("public").catch(() => undefined);
  }, [isAuthenticated]);
}

export function useAdminPushSync() {
  const isAuthenticated = useAppSelector(
    (state) => state.adminAuth.isAuthenticated,
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncDeviceToken("admin").catch(() => undefined);
  }, [isAuthenticated]);
}
