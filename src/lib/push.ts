import {
  AdminAuthError,
  resolveAdminAuthErrorMessage,
  updateAdminMe,
} from "@/api/adminAuth";
import { updatePublicMe } from "@/api/auth";
import {
  deleteDeviceToken,
  readStoredDeviceToken,
  registerDeviceToken,
  type DeviceTokenAudience,
} from "@/api/deviceTokens";
import { env } from "@/config/env";
import type { AdminSessionUser } from "@/types/adminAuth";
import type { AuthUser } from "@/types/user";

const postedThisSession = new Set<DeviceTokenAudience>();

export interface ForegroundPushMessage {
  title: string;
}

const foregroundListeners = new Set<(message: ForegroundPushMessage) => void>();

export function subscribeForegroundPush(
  listener: (message: ForegroundPushMessage) => void,
) {
  foregroundListeners.add(listener);
  return () => {
    foregroundListeners.delete(listener);
  };
}

export class PushSetupError extends Error {
  messageKey: string;

  constructor(messageKey: string) {
    super(messageKey);
    this.name = "PushSetupError";
    this.messageKey = messageKey;
  }
}

export function isFirebasePushConfigured(): boolean {
  const firebase = env.firebase;
  return Boolean(
    firebase.apiKey &&
    firebase.projectId &&
    firebase.messagingSenderId &&
    firebase.appId &&
    firebase.vapidKey,
  );
}

function swScriptUrl(): string {
  const base = (env.basePath || "/").replace(/\/$/, "");
  const prefix = base && base !== "/" ? base : "";
  const params = new URLSearchParams({
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
  });
  return `${prefix}/firebase-messaging-sw.js?${params.toString()}`;
}

async function messagingClient() {
  if (!isFirebasePushConfigured()) {
    throw new PushSetupError("settings.pushNotConfigured");
  }
  const [{ getApps, initializeApp, getApp }, messagingMod] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);
  if (!(await messagingMod.isSupported())) {
    throw new PushSetupError("settings.notSupported");
  }
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.firebase.apiKey,
        authDomain: env.firebase.authDomain,
        projectId: env.firebase.projectId,
        storageBucket: env.firebase.storageBucket,
        messagingSenderId: env.firebase.messagingSenderId,
        appId: env.firebase.appId,
      });
  const registration = await navigator.serviceWorker.register(swScriptUrl(), {
    scope: `${(env.basePath || "/").replace(/\/$/, "") || ""}/firebase-cloud-messaging-push-scope`,
  });
  const messaging = messagingMod.getMessaging(app);
  if (!listening) {
    listening = true;
    messagingMod.onMessage(messaging, (payload) => {
      const dataTitle = payload.data?.title;
      const title = (
        payload.notification?.title ||
        (typeof dataTitle === "string" ? dataTitle : "")
      ).trim();
      const message = { title };
      foregroundListeners.forEach((listener) => listener(message));
    });
  }
  return { messaging, registration, getToken: messagingMod.getToken };
}

let listening = false;

export async function obtainFcmToken(options?: {
  requestPermission?: boolean;
}): Promise<string | null> {
  const requestPermission = options?.requestPermission !== false;
  if (!isFirebasePushConfigured()) {
    throw new PushSetupError("settings.pushNotConfigured");
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new PushSetupError("settings.notSupported");
  }
  let permission = Notification.permission;
  if (permission === "default" && requestPermission) {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    if (!requestPermission) return null;
    throw new PushSetupError("settings.pushPermissionDenied");
  }
  const { messaging, registration, getToken } = await messagingClient();
  const token = await getToken(messaging, {
    vapidKey: env.firebase.vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new PushSetupError("settings.pushTokenFailed");
  return token;
}

/** Register this browser's token. `pushEnabled` only tells the backend whether to send. */
export async function syncDeviceToken(
  audience: DeviceTokenAudience,
): Promise<void> {
  if (!isFirebasePushConfigured()) return;
  const token = await obtainFcmToken();
  if (!token) return;
  const previous = readStoredDeviceToken(audience);
  if (previous && previous !== token) {
    try {
      await deleteDeviceToken(audience, previous);
    } catch {
      // keep going with the new token
    }
  }
  if (previous === token && postedThisSession.has(audience)) return;
  await registerDeviceToken(audience, token);
  postedThisSession.add(audience);
}

/** Persist the send preference only. Device token registration is separate. */
export async function setPublicPushEnabled(
  enabled: boolean,
): Promise<AuthUser> {
  return updatePublicMe({ pushEnabled: enabled });
}

export async function setAdminPushEnabled(
  enabled: boolean,
): Promise<AdminSessionUser> {
  return updateAdminMe({ pushEnabled: enabled });
}

export function pushErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  if (error instanceof PushSetupError) return t(error.messageKey);
  if (error instanceof AdminAuthError) {
    return resolveAdminAuthErrorMessage(error, t);
  }
  return t("settings.pushUpdateFailed");
}
