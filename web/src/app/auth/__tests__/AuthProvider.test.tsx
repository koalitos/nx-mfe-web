import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider } from '../AuthProvider';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authApi';
import { authStorage } from '../../services/authStorage';

vi.mock('../../services/authApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('hydrates session from localStorage', async () => {
    window.localStorage.setItem(authStorage.keys.token, 'token-123');
    window.localStorage.setItem(
      authStorage.keys.user,
      JSON.stringify({ id: '1', email: 'demo@test.com' })
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toMatchObject({ email: 'demo@test.com' });
  });

  it('stores token after login', async () => {
    const loginMock = vi.mocked(authApi.login);
    loginMock.mockResolvedValue({
      accessToken: 'fresh-token',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'user-1',
        email: 'new@test.com',
        displayName: 'New User',
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    await act(async () => {
      await result.current.login({ email: 'new@test.com', password: '123456' });
    });

    expect(window.localStorage.getItem(authStorage.keys.token)).toBe(
      'fresh-token'
    );
    expect(result.current.user).toMatchObject({ email: 'new@test.com' });
  });
});
