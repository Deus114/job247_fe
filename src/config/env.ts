function readEnv(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : fallback;
}

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export const env = {
  appName: readEnv('VITE_APP_NAME', 'Jobs247'),
  appUrl: readEnv('VITE_APP_URL'),
  basePath: readEnv('VITE_BASE_PATH', '/'),
  apiBaseUrl: normalizeApiBaseUrl(readEnv('VITE_API_BASE_URL')),
  contactFormUrl: readEnv('VITE_CONTACT_FORM_URL'),
  newsletterFormUrl: readEnv('VITE_NEWSLETTER_FORM_URL'),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
