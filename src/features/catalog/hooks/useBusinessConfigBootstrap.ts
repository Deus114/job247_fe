import { fetchPublicBusinessConfig } from "@/api";
import { env } from "@/config/env";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setBusinessConfig,
  setBusinessConfigFailed,
  setBusinessConfigLoading,
} from "@/store/slices/businessConfigSlice";
import { useEffect, useRef } from "react";

function applyDocumentMeta(config: {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  name: string;
}) {
  if (typeof document === "undefined") return;

  const title = config.metaTitle.trim() || config.name.trim();
  if (title) document.title = title;

  const ensureMeta = (name: string, content: string) => {
    if (!content.trim()) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  ensureMeta("description", config.metaDescription);
  ensureMeta("keywords", config.metaKeywords);
}

export function useBusinessConfigBootstrap() {
  const dispatch = useAppDispatch();
  const loaded = useAppSelector((state) => state.businessConfig.loaded);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!env.apiBaseUrl || loaded || inFlightRef.current) return;

    let cancelled = false;
    inFlightRef.current = true;
    dispatch(setBusinessConfigLoading());

    void fetchPublicBusinessConfig()
      .then((config) => {
        if (cancelled) return;
        dispatch(setBusinessConfig(config));
        applyDocumentMeta(config);
      })
      .catch(() => {
        if (cancelled) return;
        dispatch(setBusinessConfigFailed());
      })
      .finally(() => {
        if (!cancelled) inFlightRef.current = false;
      });

    return () => {
      // Strict Mode remount: allow a fresh request on the next effect.
      cancelled = true;
      inFlightRef.current = false;
    };
  }, [dispatch, loaded]);
}
