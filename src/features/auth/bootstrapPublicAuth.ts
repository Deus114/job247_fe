import { refreshRequest } from "@/api/auth";
import { env } from "@/config/env";
import { store } from "@/store";
import { login, logout } from "@/store/slices/authSlice";

let bootstrapPromise: Promise<boolean> | null = null;

/**
 * After F5: POST /auth/refresh (cookie) → set access in RAM + mark authenticated.
 * Fail → clear public auth state. Single-flight for the whole app lifetime.
 */
export function bootstrapPublicAuth(): Promise<boolean> {
  if (!env.apiBaseUrl) {
    return Promise.resolve(false);
  }
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const session = await refreshRequest();
      store.dispatch(login(session.user));
      return true;
    } catch {
      store.dispatch(logout());
      return false;
    }
  })();

  return bootstrapPromise;
}
