import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { env } from "@/config/env";
import { isAdminApiSuccess, AdminAuthError } from "@/api/adminAuth";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  AdminBusinessConfigApi,
  BusinessConfig,
  PublicBusinessConfigApi,
} from "@/types/businessConfig";
import {
  buildBusinessConfigUpdateFormData,
  mapAdminBusinessConfigApiToForm,
  mapPublicBusinessConfigApiToForm,
  type UpdateAdminBusinessConfigInput,
} from "@/types/businessConfig";

function throwBusinessConfigError(fallbackKey: string, error: unknown): never {
  if (error instanceof AdminAuthError) throw error;

  if (isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const key =
      error.code === "ERR_NETWORK" ? "apiErrors.networkError" : fallbackKey;
    throw new AdminAuthError(
      key,
      body?.statusCode ?? error.response?.status,
      body?.message,
    );
  }

  throw new AdminAuthError(fallbackKey);
}

/**
 * GET /business-config — public site config (no auth required).
 * Feeds Redux for Navbar/Footer/Hero/login banners/legal pages.
 */
export async function fetchPublicBusinessConfig(): Promise<BusinessConfig> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  try {
    const res = (await axios.get("/business-config", {
      skipAuthRefresh: true,
    })) as ApiResponse<PublicBusinessConfigApi>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }

    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.businessConfigLoadFailed",
        res.statusCode,
        res.message,
      );
    }

    if (!res.data || typeof res.data !== "object") {
      throw new AdminAuthError(
        "apiErrors.businessConfigMissingData",
        res.statusCode,
        res.message,
      );
    }

    return mapPublicBusinessConfigApiToForm(res.data);
  } catch (error) {
    throwBusinessConfigError("apiErrors.businessConfigLoadFailed", error);
  }
}

/** GET /admin/business-config — admin only; does not feed public pages. */
export async function fetchAdminBusinessConfig(): Promise<BusinessConfig> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  try {
    const res = (await axios.get(
      "/admin/business-config",
    )) as ApiResponse<AdminBusinessConfigApi>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }

    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.businessConfigLoadFailed",
        res.statusCode,
        res.message,
      );
    }

    if (!res.data || typeof res.data !== "object") {
      throw new AdminAuthError(
        "apiErrors.businessConfigMissingData",
        res.statusCode,
        res.message,
      );
    }

    return mapAdminBusinessConfigApiToForm(res.data);
  } catch (error) {
    throwBusinessConfigError("apiErrors.businessConfigLoadFailed", error);
  }
}

/**
 * PUT /admin/business-config — multipart/form-data.
 * Only changed fields; each image is either *File or URL, never both.
 */
export async function updateAdminBusinessConfig(
  input: UpdateAdminBusinessConfigInput,
): Promise<BusinessConfig> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  const body = buildBusinessConfigUpdateFormData(input);
  if ([...body.keys()].length === 0) {
    return input.form;
  }

  try {
    const res = (await axios.put(
      "/admin/business-config",
      body,
    )) as ApiResponse<AdminBusinessConfigApi>;

    if (!res || typeof res !== "object") {
      throw new AdminAuthError("apiErrors.invalidResponse");
    }

    if (!isAdminApiSuccess(res.statusCode)) {
      throw new AdminAuthError(
        "apiErrors.businessConfigUpdateFailed",
        res.statusCode,
        res.message,
      );
    }

    if (!res.data || typeof res.data !== "object") {
      throw new AdminAuthError(
        "apiErrors.businessConfigMissingData",
        res.statusCode,
        res.message,
      );
    }

    return mapAdminBusinessConfigApiToForm(res.data);
  } catch (error) {
    throwBusinessConfigError("apiErrors.businessConfigUpdateFailed", error);
  }
}
