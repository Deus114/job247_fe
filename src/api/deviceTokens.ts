import axios from "@/api/axios.customize";
import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import type { ApiResponse } from "@/types/adminAuth";
import { isAxiosError } from "axios";

export type DeviceTokenAudience = "public" | "admin";

const STORAGE_KEY: Record<DeviceTokenAudience, string> = {
  public: "jobs247_fcm_device_public",
  admin: "jobs247_fcm_device_admin",
};

function pathFor(audience: DeviceTokenAudience): string {
  return audience === "admin" ? "/admin/device-tokens" : "/device-tokens";
}

function deviceInfo(): string {
  if (typeof navigator === "undefined") return "web";
  return (navigator.userAgent || "web").slice(0, 255);
}

function assertSuccess(res: ApiResponse<unknown> | undefined) {
  if (!res || typeof res !== "object" || !isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(
      "apiErrors.deviceTokenFailed",
      res?.statusCode,
      res?.message,
    );
  }
}

export function readStoredDeviceToken(
  audience: DeviceTokenAudience,
): string {
  try {
    return localStorage.getItem(STORAGE_KEY[audience]) || "";
  } catch {
    return "";
  }
}

export function writeStoredDeviceToken(
  audience: DeviceTokenAudience,
  token: string,
) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY[audience], token);
    else localStorage.removeItem(STORAGE_KEY[audience]);
  } catch {
    // storage unavailable
  }
}

export async function registerDeviceToken(
  audience: DeviceTokenAudience,
  token: string,
): Promise<void> {
  const path = pathFor(audience);
  const res = (await axios.post(path, {
    token,
    platform: "WEB",
    deviceInfo: deviceInfo(),
  })) as ApiResponse<unknown>;
  assertSuccess(res);
  writeStoredDeviceToken(audience, token);
}

export async function deleteDeviceToken(
  audience: DeviceTokenAudience,
  token: string,
): Promise<void> {
  if (!token) return;
  try {
    const res = (await axios.delete(pathFor(audience), {
      data: { token },
    })) as ApiResponse<unknown>;
    assertSuccess(res);
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const appCode =
      error instanceof AdminAuthError ? error.statusCode : undefined;
    if (status === 404 || appCode === 404) {
      writeStoredDeviceToken(audience, "");
      return;
    }
    throw error;
  }
  writeStoredDeviceToken(audience, "");
}

/** Remove this browser's token while the access token is still in memory. */
export async function unregisterStoredDeviceToken(
  audience: DeviceTokenAudience,
): Promise<void> {
  const token = readStoredDeviceToken(audience);
  if (!token) return;
  try {
    await deleteDeviceToken(audience, token);
  } catch {
    writeStoredDeviceToken(audience, "");
  }
}
