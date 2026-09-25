function readEnv(key: keyof ImportMetaEnv, fallback = ""): string {
  const value = import.meta.env[key];
  return typeof value === "string" ? value : fallback;
}

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
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
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
