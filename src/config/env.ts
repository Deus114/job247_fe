function readEnv(key: keyof ImportMetaEnv, fallback = ""): string {
  const value = import.meta.env[key];
  return typeof value === "string" ? value : fallback;
}

/**
 * Cookie Path is `/api/v1/auth` and `/api/v1/admin/auth`.
 */
function normalizeApiBaseUrl(raw: string): string {
  let trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  if (!/\/api\/v\d+$/i.test(trimmed)) {
    trimmed = `${trimmed}/api/v1`;
  }
  return trimmed;
}

function readNumber(key: keyof ImportMetaEnv, fallback: number): number {
  const raw = readEnv(key);
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

function readBool(key: keyof ImportMetaEnv, fallback: boolean): boolean {
  const value = readEnv(key);
  if (!value) return fallback;
  return value === "true" || value === "1";
}

/** Prefer VITE_BACKEND_URL (axios standard), keep VITE_API_BASE_URL as alias. */
const apiBaseUrl = normalizeApiBaseUrl(
  readEnv("VITE_BACKEND_URL") || readEnv("VITE_API_BASE_URL"),
);
const useMockFlag = readEnv("VITE_USE_MOCK");

export const env = {
  appName: readEnv("VITE_APP_NAME", "Jobs247"),
  appUrl: readEnv("VITE_APP_URL"),
  basePath: readEnv("VITE_BASE_PATH", "/"),
  apiBaseUrl,
  /** Mock-first when flag is true, or when backend URL is empty. */
  useMock: useMockFlag ? readBool("VITE_USE_MOCK", true) : !apiBaseUrl,
  /** Seconds to wait before the registration OTP can be sent again. */
  otpResendCooldown: readNumber("VITE_OTP_RESEND_COOLDOWN", 60),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  firebase: {
    apiKey: readEnv("VITE_FIREBASE_API_KEY"),
    authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readEnv("VITE_FIREBASE_APP_ID"),
    vapidKey: readEnv("VITE_FIREBASE_VAPID_KEY"),
  },
} as const;
