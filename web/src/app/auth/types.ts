export interface AuthPageSummary {
  id: string;
  key: string;
  name: string;
  path?: string | null;
}

export interface AuthPageRole {
  id: string;
  role: string;
  page?: AuthPageSummary | null;
}

export interface AuthUserGroupSummary {
  id: string;
  name: string;
}

export interface AuthUserType {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  userGroup?: AuthUserGroupSummary | null;
  pageRoles: AuthPageRole[];
}

export interface AuthProfile {
  id: string;
  supabaseUserId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  userType?: AuthUserType | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
  createdAt?: string;
  lastSignInAt?: string | null;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  userTypeId?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: AuthUser;
  profile: AuthProfile | null;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
  profile: AuthProfile | null;
}
