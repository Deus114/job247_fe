import { AdminAuthError, isAdminApiSuccess } from "@/api/adminAuth";
import axios from "@/api/axios.customize";
import {
  clearPublicTokens,
  getPublicAccessToken,
  setPublicAccessToken,
} from "@/api/publicAuthTokens";
import { env } from "@/config/env";
import type {
  AuthUser,
  LoginPayload,
  PublicAccountType,
  PublicAuthSession,
  RegisterPayload,
  UpdatePublicMePayload,
  UserCompanyMembership,
  UserCompanyRole,
  UserCompanyStatus,
} from "@/types";
import type { ApiResponse } from "@/types/adminAuth";
import { isAxiosError } from "axios";

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

function pickToken(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function roleFromAccountType(type: string): AuthUser["role"] | null {
  if (type === "EMPLOYER") return "employer";
  if (type === "JOB_SEEKER") return "user";
  return null;
}

function normalizeCompanyStatus(value: unknown): UserCompanyStatus {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "APPROVED") return "APPROVED";
  if (raw === "REJECTED") return "REJECTED";
  return "PENDING";
}

function normalizeCompanyRole(value: unknown): UserCompanyRole {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  return raw === "ADMIN" ? "ADMIN" : "OWNER";
}

export function normalizeUserCompanyMembership(
  raw: unknown,
): UserCompanyMembership | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const companyId = Number(record.companyId);
  if (!Number.isFinite(companyId) || companyId <= 0) return null;
  return {
    companyId,
    companyName: String(record.companyName ?? ""),
    companyLogo: String(record.companyLogo ?? ""),
    companyStatus: normalizeCompanyStatus(record.companyStatus),
    role: normalizeCompanyRole(record.role),
  };
}

function normalizeUserCompanies(raw: unknown): UserCompanyMembership[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeUserCompanyMembership)
    .filter((item): item is UserCompanyMembership => item != null);
}

/** Map login/refresh `data.user` (or /auth/me data) into the session stored for the UI. */
export function normalizePublicSessionUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const user = raw as Record<string, unknown>;
  const id = Number(user.id);
  const email = String(user.email ?? "").trim();
  const fullName = String(user.name ?? user.fullName ?? "").trim();
  const accountType = String(user.type ?? "") as PublicAccountType;
  const role = roleFromAccountType(accountType);
  if (!Number.isFinite(id) || id <= 0 || !email || !fullName || !role) {
    return null;
  }

  return {
    id: String(id),
    email,
    fullName,
    role,
    accountType,
    emailVerified: user.emailVerified === true,
    avatar: String(user.avatar ?? ""),
    active: user.active !== false,
    createdAt: String(user.createdAt ?? ""),
    updatedAt: String(user.updatedAt ?? ""),
    companies: normalizeUserCompanies(user.companies),
  };
}

function parsePublicSession(
  data: Record<string, unknown>,
  statusCode: number | undefined,
  message: string,
): PublicAuthSession {
  const user = normalizePublicSessionUser(data.user);
  const accessToken = pickToken(data, "accessToken", "access_token", "token");

  if (!user || !accessToken) {
    throw new AdminAuthError("apiErrors.loginMissingData", statusCode, message);
  }
  if (user.active === false) {
    throw new AdminAuthError(
      "apiErrors.loginInactiveAccount",
      statusCode,
      message,
    );
  }

  setPublicAccessToken(accessToken);
  return {
    user,
    accessToken,
  };
}

/** POST /auth/login — body `{ email, password }`. Refresh cookie is set by BE. */
export async function loginRequest(payload: LoginPayload): Promise<AuthUser> {
  if (!env.apiBaseUrl) {
    if (env.useMock) {
      const user = mockLogin(payload);
      setPublicAccessToken("mock-access-token");
      return user;
    }
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  clearPublicTokens();

  try {
    const res = (await axios.post(
      "/auth/login",
      { email: payload.email.trim(), password: payload.password },
      { skipAuthRefresh: true },
    )) as ApiResponse<Record<string, unknown>>;
    const body = assertPublicSuccess(res, "apiErrors.loginFailed");
    const data = (
      body.data && typeof body.data === "object" ? body.data : {}
    ) as Record<string, unknown>;
    return parsePublicSession(data, body.statusCode, body.message || "").user;
  } catch (error) {
    clearPublicTokens();
    throwPublicAuthError("apiErrors.loginFailed", error);
  }
}

let refreshInFlight: Promise<PublicAuthSession> | null = null;

/**
 * POST /auth/refresh — browser sends HttpOnly cookie (`user_refresh_token`).
 * Concurrent callers share one in-flight request.
 */
export async function refreshRequest(): Promise<PublicAuthSession> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = (await axios.post(
        "/auth/refresh",
        {},
        { skipAuthRefresh: true },
      )) as ApiResponse<Record<string, unknown>>;
      const body = assertPublicSuccess(res, "apiErrors.sessionExpired");
      const data = (
        body.data && typeof body.data === "object" ? body.data : {}
      ) as Record<string, unknown>;
      return parsePublicSession(data, body.statusCode, body.message || "");
    } catch (error) {
      clearPublicTokens();
      throwPublicAuthError("apiErrors.sessionExpired", error);
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * POST /auth/logout — always call API so BE can clear the refresh cookie.
 * Bearer is optional when access is already gone from RAM.
 */
export async function logoutRequest(): Promise<string> {
  let message = "";
  if (env.apiBaseUrl) {
    try {
      const token = getPublicAccessToken();
      const res = (await axios.post("/auth/logout", undefined, {
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        skipAuthRefresh: true,
      })) as ApiResponse<unknown>;
      if (typeof res?.message === "string" && res.message.trim()) {
        message = res.message.trim();
      }
    } catch {
      // local logout still proceeds
    }
  }
  clearPublicTokens();
  return message;
}

export function clearAccessToken() {
  clearPublicTokens();
}

function readMeUser(
  data: unknown,
  statusCode: number | undefined,
  message: string,
  missingKey: string,
): AuthUser {
  const record =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const user = normalizePublicSessionUser(record?.user ?? data);
  if (!user) {
    throw new AdminAuthError(missingKey, statusCode, message);
  }
  return user;
}

/** GET /auth/me */
export async function fetchPublicMe(): Promise<AuthUser> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  try {
    const res = (await axios.get("/auth/me")) as ApiResponse<unknown>;
    const body = assertPublicSuccess(res, "apiErrors.publicMeLoadFailed");
    return readMeUser(
      body.data,
      body.statusCode,
      body.message || "",
      "apiErrors.publicMeMissingData",
    );
  } catch (error) {
    throwPublicAuthError("apiErrors.publicMeLoadFailed", error);
  }
}

/** PUT /auth/me — multipart/form-data. */
export async function updatePublicMe(
  payload: UpdatePublicMePayload,
): Promise<AuthUser> {
  if (!env.apiBaseUrl) {
    throw new AdminAuthError("apiErrors.missingBackendUrl");
  }

  const body = new FormData();
  if (payload.name != null && payload.name.trim() !== "") {
    body.append("name", payload.name.trim());
  }
  if (payload.currentPassword) {
    body.append("currentPassword", payload.currentPassword);
  }
  if (payload.newPassword) {
    body.append("newPassword", payload.newPassword);
  }
  if (payload.avatarFile) {
    body.append("avatar", payload.avatarFile);
  }
  if ([...body.keys()].length === 0) {
    throw new AdminAuthError("apiErrors.publicMeNothingToUpdate");
  }

  try {
    const res = (await axios.put("/auth/me", body)) as ApiResponse<unknown>;
    const envelope = assertPublicSuccess(res, "apiErrors.publicMeUpdateFailed");
    return readMeUser(
      envelope.data,
      envelope.statusCode,
      envelope.message || "",
      "apiErrors.publicMeMissingData",
    );
  } catch (error) {
    throwPublicAuthError("apiErrors.publicMeUpdateFailed", error);
  }
}
