import { playNotificationSound } from "@/lib/notificationSound";
import { subscribeForegroundPush, syncDeviceToken } from "@/lib/push";
import { toast } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";

/** Toast the push title and play a chime while this tab is open. */
function useForegroundPushAlert() {
  useEffect(() => {
    return subscribeForegroundPush(({ title }) => {
      const text = title.trim();
      if (!text) return;
      toast.info(text);
      playNotificationSound();
    });
  }, []);
}

/** Register this browser's FCM token after login. `pushEnabled` is not a gate. */
export function usePublicPushSync() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  useForegroundPushAlert();

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncDeviceToken("public").catch(() => undefined);
  }, [isAuthenticated]);
}

export function useAdminPushSync() {
  const isAuthenticated = useAppSelector(
    (state) => state.adminAuth.isAuthenticated,
  );
  useForegroundPushAlert();

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncDeviceToken("admin").catch(() => undefined);
  }, [isAuthenticated]);
}
