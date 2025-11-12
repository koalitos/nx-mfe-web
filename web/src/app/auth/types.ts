export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
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
}
