import axios from 'axios';
import { env } from '@/config/env';
import { delay } from '@/lib/delay';

type FallbackOptions = {
  mockDelayMs?: number;
  /** When false, only fall back on network/unreachable API (not HTTP 4xx/5xx). */
  fallbackOnHttpError?: boolean;
};

/**
 * Prefer real API when mock is off and base URL exists.
 * Fall back to fixed mock data when API is unreachable (or on HTTP error if allowed).
 */
export async function withApiFallback<T>(
  apiCall: () => Promise<T>,
  mockData: () => T | Promise<T>,
  options: number | FallbackOptions = 150,
): Promise<T> {
  const opts: FallbackOptions =
    typeof options === 'number' ? { mockDelayMs: options } : options;
  const mockDelayMs = opts.mockDelayMs ?? 150;
  const fallbackOnHttpError = opts.fallbackOnHttpError ?? true;

  const shouldCallApi = !env.useMock && Boolean(env.apiBaseUrl);

  if (!shouldCallApi) {
    await delay(mockDelayMs);
    return mockData();
  }

  try {
    return await apiCall();
  } catch (error) {
    const isHttpError = axios.isAxiosError(error) && Boolean(error.response);
    if (isHttpError && !fallbackOnHttpError) {
      throw error;
    }

    if (env.isDev) {
      console.warn('[api] request failed, using mock fallback', error);
    }
    await delay(mockDelayMs);
    return mockData();
  }
}
