export type AppLanguage = 'vi' | 'en';

export const LANG_STORAGE_KEY = 'app_lang';
export const SUPPORTED_LANGUAGES: AppLanguage[] = ['vi', 'en'];
export const DEFAULT_LANGUAGE: AppLanguage = 'vi';

export function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
}

export function persistLanguage(lang: AppLanguage) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    window.localStorage.removeItem('i18nextLng');
  } catch {
    // ignore
  }
}

export function normalizeLanguage(lng?: string): AppLanguage {
  const code = (lng || DEFAULT_LANGUAGE).split('-')[0];
  return code === 'en' ? 'en' : 'vi';
}
