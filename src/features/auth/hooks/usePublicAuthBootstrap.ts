import { env } from "@/config/env";
import { bootstrapPublicAuth } from "@/features/auth/bootstrapPublicAuth";
import { useEffect, useState } from "react";

/** Gate UI until cookie refresh bootstrap finishes (or no backend URL). */
export function usePublicAuthBootstrap() {
  const [ready, setReady] = useState(!env.apiBaseUrl);

  useEffect(() => {
    if (!env.apiBaseUrl) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void bootstrapPublicAuth().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
