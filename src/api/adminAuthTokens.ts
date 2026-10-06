/** Access token lives only in RAM (module scope). Refresh is HttpOnly cookie. */
let accessTokenMemory: string | null = null;

export function getAdminAccessToken(): string | null {
  return accessTokenMemory;
}

export function setAdminAccessToken(token: string | null) {
  accessTokenMemory = token?.trim() || null;
}

export function clearAdminTokens() {
  accessTokenMemory = null;
}
