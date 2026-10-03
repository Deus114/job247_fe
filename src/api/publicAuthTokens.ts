export const USER_ACCESS_TOKEN_KEY = "access_token";
export const USER_REFRESH_TOKEN_KEY = "refresh_token";

export function persistPublicTokens(
  accessToken?: string,
  refreshToken?: string,
) {
  if (accessToken) {
    localStorage.setItem(USER_ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(USER_REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearPublicTokens() {
  localStorage.removeItem(USER_ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_REFRESH_TOKEN_KEY);
}
