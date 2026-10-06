/** Access token lives only in RAM (module scope). Refresh is HttpOnly cookie. */
let accessTokenMemory: string | null = null;

export function getPublicAccessToken(): string | null {
  return accessTokenMemory;
}

export function setPublicAccessToken(token: string | null) {
  accessTokenMemory = token?.trim() || null;
}

export function clearPublicTokens() {
  accessTokenMemory = null;
}
