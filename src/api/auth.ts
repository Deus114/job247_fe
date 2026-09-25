import axios from "@/api/axios.customize";
import { isAxiosError } from "axios";
import { withApiFallback } from "@/api/withApiFallback";
import { env } from "@/config/env";
import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import type { ApiResponse } from "@/types/adminAuth";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/types";

/** Demo accounts used only in mock / fallback mode. */
export const mockDemoAccounts: Array<AuthUser & { password: string }> = [
  {
    id: "u2",
    email: "employer@jobs247.vn",
    password: "employer123",
    fullName: "Nhà tuyển dụng Demo",
    role: "employer",
  },
  {
    id: "user-1",
    email: "user@jobs247.vn",
    password: "user123",
    fullName: "Người dùng Demo",
    role: "user",
  },
];

function mockLogin(payload: LoginPayload): AuthUser {
  const found = mockDemoAccounts.find(
    (account) =>
      account.email === payload.email && account.password === payload.password,
  );
  if (!found) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const { password: _, ...user } = found;
  void _;
  return user;
}

function throwPublicAuthError(fallbackKey: string, error: unknown): never {
  if (error instanceof AdminAuthError) throw error;

  if (isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const key =
      error.code === "ERR_NETWORK" ? "apiErrors.networkError" : fallbackKey;
    throw new AdminAuthError(
      key,
      body?.statusCode ?? error.response?.status,
      typeof body?.message === "string" ? body.message : undefined,
    );
  }

  throw new AdminAuthError(fallbackKey);
}

function assertPublicSuccess(
  res: ApiResponse<unknown> | null | undefined,
  fallbackKey: string,
): ApiResponse<unknown> {
  if (!res || typeof res !== "object") {
    throw new AdminAuthError("apiErrors.invalidResponse");
  }
  if (!isAdminApiSuccess(res.statusCode)) {
    throw new AdminAuthError(fallbackKey, res.statusCode, res.message);
  }
  return res;
}

/** POST /auth/otp/send — body `{ email }` */
export async function sendOtpRequest(email: string): Promise<void> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  try {
    const res = (await axios.post(
      "/auth/otp/send",
      { email: email.trim() },
      { skipAuthRefresh: true },
    )) as ApiResponse<unknown>;
    assertPublicSuccess(res, "apiErrors.otpSendFailed");
  } catch (error) {
    throwPublicAuthError("apiErrors.otpSendFailed", error);
  }
}

/** POST /auth/otp/verify — body `{ email, code }`, returns `verificationToken`. */
export async function verifyOtpRequest(
  email: string,
  code: string,
): Promise<string> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  try {
    const res = (await axios.post(
      "/auth/otp/verify",
      { email: email.trim(), code: code.trim() },
      { skipAuthRefresh: true },
    )) as ApiResponse<unknown>;
    const body = assertPublicSuccess(res, "apiErrors.otpVerifyFailed");
    const data =
      body.data && typeof body.data === "object"
        ? (body.data as { verificationToken?: unknown })
        : {};
    const token = String(data.verificationToken ?? "").trim();
    if (!token) {
      throw new AdminAuthError(
        "apiErrors.otpVerifyFailed",
        body.statusCode,
        body.message,
      );
    }
    return token;
  } catch (error) {
    throwPublicAuthError("apiErrors.otpVerifyFailed", error);
  }
}

/** POST /auth/register. Does not sign the user in. */
export async function registerRequest(payload: RegisterPayload): Promise<void> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  try {
    const res = (await axios.post(
      "/auth/register",
      {
        name: payload.name.trim(),
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        type: payload.type,
        verificationToken: payload.verificationToken,
        acceptTerms: payload.acceptTerms,
      },
      { skipAuthRefresh: true },
    )) as ApiResponse<unknown>;
    assertPublicSuccess(res, "apiErrors.registerFailed");
  } catch (error) {
    throwPublicAuthError("apiErrors.registerFailed", error);
  }
}

function persistToken(token?: string) {
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
}

export async function loginRequest(payload: LoginPayload): Promise<AuthUser> {
  clearAccessToken();
  return withApiFallback(
    async () => {
      const data = await axios.post<AuthResponse, AuthResponse>(
        "/api/auth/login",
        payload,
      );
      // Backend may return { user, access_token } or the user object directly.
      if (data && typeof data === "object" && "user" in data) {
        persistToken(data.access_token);
        return data.user;
      }
      return data as unknown as AuthUser;
    },
    () => mockLogin(payload),
    { mockDelayMs: 150, fallbackOnHttpError: false },
  );
}

export function clearAccessToken() {
  localStorage.removeItem("access_token");
}
