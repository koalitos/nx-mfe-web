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
import { AuthUser, LoginPayload, RegisterPayload } from './types';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isProcessing: boolean;
  login(payload: LoginPayload): Promise<void>;
  register(payload: RegisterPayload): Promise<void>;
  logout(): void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthState>(() => authStorage.load());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setSession(authStorage.load());
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsProcessing(true);
    try {
      const response = await authApi.login(payload);
      authStorage.save(response.accessToken, response.user);
      setSession({ token: response.accessToken, user: response.user });
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
    setSession({ token: null, user: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...session,
      isAuthenticated: Boolean(session.token),
      isInitializing,
      isProcessing,
      login,
      register,
      logout,
    }),
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
