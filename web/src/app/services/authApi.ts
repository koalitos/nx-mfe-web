import { LoginPayload, RegisterPayload, AuthResponse } from '../auth/types';
import { authClient } from './httpClient';

export const authApi = {
  register(payload: RegisterPayload) {
    return authClient.post<RegisterPayload, void>('/auth/register', payload, {
      auth: false,
    });
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
