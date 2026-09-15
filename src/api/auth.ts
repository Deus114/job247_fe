import axios from "@/api/axios.customize";
import { withApiFallback } from "@/api/withApiFallback";
import type { AuthUser, UserRole } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: Exclude<UserRole, "admin">;
}

export interface AuthResponse {
  user: AuthUser;
  access_token?: string;
}

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

function mockRegister(payload: RegisterPayload): AuthUser {
  return {
    id: Date.now().toString(),
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
  };
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

export async function registerRequest(
  payload: RegisterPayload,
): Promise<AuthUser> {
  clearAccessToken();
  return withApiFallback(
    async () => {
      const data = await axios.post<AuthResponse, AuthResponse>(
        "/api/auth/register",
        payload,
      );
      if (data && typeof data === "object" && "user" in data) {
        persistToken(data.access_token);
        return data.user;
      }
      return data as unknown as AuthUser;
    },
    () => mockRegister(payload),
    { mockDelayMs: 150, fallbackOnHttpError: false },
  );
}

export function clearAccessToken() {
  localStorage.removeItem("access_token");
}
