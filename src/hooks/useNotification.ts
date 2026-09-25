import { useState, useEffect, useCallback } from "react";

interface NotificationState {
  isSupported: boolean;
  permission: "granted" | "denied" | "default" | "unsupported";
  isSubscribed: boolean;
}

export function useNotification() {
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: "unsupported",
    isSubscribed: false,
  });

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setState({
        isSupported: false,
        permission: "unsupported",
        isSubscribed: false,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      isSupported: true,
      permission: Notification.permission,
      isSubscribed: Notification.permission === "granted",
    }));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      setState((prev) => ({ ...prev, permission, isSubscribed: granted }));
      return granted;
    } catch {
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(
    async (title: string, body: string) => {
      if (!state.isSupported || state.permission !== "granted") return false;

      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: "/vite.svg",
          badge: "/vite.svg",
          tag: "test-notification",
        });
        return true;
      } catch {
        return false;
      }
    },
    [state.isSupported, state.permission],
  );

  return {
    ...state,
    requestPermission,
    sendTestNotification,
  };
}
