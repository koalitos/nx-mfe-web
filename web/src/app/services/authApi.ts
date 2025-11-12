import {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  RegisterResponse,
} from '../auth/types';
import { authClient } from './httpClient';

export const authApi = {
  register(payload: RegisterPayload) {
    return authClient.post<RegisterPayload, RegisterResponse>(
      '/auth/register',
      payload,
      {
        auth: false,
      }
    );
  },
  login(payload: LoginPayload) {
    return authClient.post<LoginPayload, AuthResponse>(
      '/auth/login',
      payload,
      {
        auth: false,
      }
    );
  },
};
