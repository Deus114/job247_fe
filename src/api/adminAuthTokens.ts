export const ADMIN_ACCESS_TOKEN_KEY = 'admin_access_token';
export const ADMIN_REFRESH_TOKEN_KEY = 'admin_refresh_token';

/** Persist tokens. Omitting a token leaves the existing value unchanged. */
export function persistAdminTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAdminTokens() {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
}
