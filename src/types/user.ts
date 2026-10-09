export type UserRole = "user" | "employer" | "admin";

/** Membership of a public user in a company (auth / admin accounts). */
export type UserCompanyRole = "OWNER" | "ADMIN";
export type UserCompanyStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserCompanyMembership {
  companyId: number;
  companyName: string;
  companyLogo: string;
  companyStatus: UserCompanyStatus;
  role: UserCompanyRole;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountType?: PublicAccountType;
  emailVerified?: boolean;
  avatar?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Present for employers; empty for job seekers / employers without membership. */
  companies?: UserCompanyMembership[];
  /** When true, this browser may register an FCM device token. */
  pushEnabled?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type PublicAccountType = "JOB_SEEKER" | "EMPLOYER";

export interface PublicAccount {
  id: number;
  name: string;
  email: string;
  type: PublicAccountType;
  emailVerified: boolean;
  avatar: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  companies: UserCompanyMembership[];
}

export interface PublicAccountListParams {
  keyword?: string;
  type?: PublicAccountType;
  active?: boolean;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface RegisterPayload {
  name: string;
  password: string;
  confirmPassword: string;
  type: PublicAccountType;
  verificationToken: string;
  acceptTerms: boolean;
}

/** `data` of POST /auth/login and POST /auth/refresh. */
export interface PublicAuthSessionData {
  user: {
    id: number;
    name: string;
    email: string;
    type: PublicAccountType;
    emailVerified: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    companies?: UserCompanyMembership[];
  };
  accessToken: string;
}

export interface PublicAuthSession {
  user: AuthUser;
  accessToken: string;
}

/** PUT /auth/me — multipart. Password fields are sent only when changing it. */
export interface UpdatePublicMePayload {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
  avatarFile?: File | null;
  /** Omit when the preference is unchanged. */
  pushEnabled?: boolean;
}
