export type UserRole = "user" | "employer" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type PublicAccountType = "JOB_SEEKER" | "EMPLOYER";

export interface RegisterPayload {
  name: string;
  password: string;
  confirmPassword: string;
  type: PublicAccountType;
  verificationToken: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  access_token?: string;
}
