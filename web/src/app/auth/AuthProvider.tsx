import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../services/authApi';
import { authStorage } from '../services/authStorage';
import { AuthProfile, AuthUser, LoginPayload, RegisterPayload } from './types';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  profile: AuthProfile | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isProcessing: boolean;
  accessiblePageKeys: string[];
  canAccessPage(pageKey: string): boolean;
  login(payload: LoginPayload): Promise<void>;
  register(payload: RegisterPayload): Promise<void>;
  logout(): void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthState>(() => {
    const stored = authStorage.load();
    return {
      token: stored.token,
      user: stored.user,
      profile: stored.profile,
    };
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const stored = authStorage.load();
    setSession({
      token: stored.token,
      user: stored.user,
      profile: stored.profile,
    });
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsProcessing(true);
    try {
      const response = await authApi.login(payload);
      authStorage.save({
        token: response.accessToken,
        user: response.user,
        profile: response.profile ?? null,
      });
      setSession({
        token: response.accessToken,
        user: response.user,
        profile: response.profile ?? null,
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsProcessing(true);
    try {
      await authApi.register(payload);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setSession({ token: null, user: null, profile: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => {
      const pageKeys = Array.from(
        new Set(
          session.profile?.userType?.pageRoles
            ?.map((role) => role.page?.key)
            .filter((key): key is string => Boolean(key)) ?? []
        )
      );

      const canAccessPage = (pageKey: string) => pageKeys.includes(pageKey);

      return {
        ...session,
        isAuthenticated: Boolean(session.token),
        isInitializing,
        isProcessing,
        accessiblePageKeys: pageKeys,
        canAccessPage,
        login,
        register,
        logout,
      };
    },
    [session, isInitializing, isProcessing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};
