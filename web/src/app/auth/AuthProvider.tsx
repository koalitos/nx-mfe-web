import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authApi } from '../services/authApi';
import { authStorage } from '../services/authStorage';
import { accessControlApi, AccessProfile, AccessPageRole } from '../services/accessControlApi';
import { supabaseClient } from '../services/supabaseClient';
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
  refreshProfile(): Promise<void>;
  loginWithGoogle(): Promise<void>;
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

  const commitSession = useCallback((nextSession: AuthState) => {
    setSession(nextSession);

    if (nextSession.token && nextSession.user) {
      authStorage.save({
        token: nextSession.token,
        user: nextSession.user,
        profile: nextSession.profile ?? null,
      });
    } else {
      authStorage.clear();
    }
  }, []);

  const mapAccessProfileToAuthProfile = useCallback(
    (profile: AccessProfile | null): AuthProfile | null => {
      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        supabaseUserId: profile.supabaseUserId,
        handle: profile.handle,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        userType: profile.userType
          ? {
              id: profile.userType.id,
              name: profile.userType.name,
              description: profile.userType.description,
              isActive: profile.userType.isActive,
              userGroup: profile.userType.userGroup
                ? {
                    id: profile.userType.userGroup.id,
                    name: profile.userType.userGroup.name,
                  }
                : null,
              pageRoles:
                profile.userType.pageRoles?.map((role: AccessPageRole) => ({
                  id: role.id,
                  role: role.role,
                  page: role.page
                    ? {
                        id: role.page.id,
                        key: role.page.key,
                        name: role.page.name,
                        path: role.page.path,
                      }
                    : undefined,
                })) ?? [],
            }
          : null,
      };
    },
    []
  );

  const mapSupabaseUserToAuthUser = useCallback((user: User): AuthUser => {
    return {
      id: user.id,
      email: user.email,
      appMetadata: user.app_metadata,
      userMetadata: user.user_metadata,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    };
  }, []);

  const hydrateFromSupabaseSession = useCallback(
    async (supabaseSession: Session | null) => {
      if (!supabaseSession?.access_token || !supabaseSession.user) {
        return;
      }

      if (session.token === supabaseSession.access_token) {
        return;
      }

      try {
        let profile: AuthProfile | null = null;
        try {
          const profileData = await accessControlApi.getProfile(
            supabaseSession.user.id
          );
          profile = mapAccessProfileToAuthProfile(profileData);
        } catch (error) {
          console.info('Perfil nao localizado durante OAuth', error);
        }

        commitSession({
          token: supabaseSession.access_token,
          user: mapSupabaseUserToAuthUser(supabaseSession.user),
          profile,
        });
      } catch (error) {
        console.error('Nao foi possivel atualizar o perfil', error);
      } finally {
        setIsInitializing(false);
      }
    },
    [
      commitSession,
      mapAccessProfileToAuthProfile,
      mapSupabaseUserToAuthUser,
      session.token,
    ]
  );

  useEffect(() => {
    const applyExistingSession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (data.session) {
        await hydrateFromSupabaseSession(data.session);
      }
    };

    applyExistingSession();

    const { data: subscription } = supabaseClient.auth.onAuthStateChange(
      (_event, supabaseSession) => {
        hydrateFromSupabaseSession(supabaseSession);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [hydrateFromSupabaseSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsProcessing(true);
    try {
      const response = await authApi.login(payload);
      commitSession({
        token: response.accessToken,
        user: response.user,
        profile: response.profile ?? null,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [commitSession]);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsProcessing(true);
    try {
      await authApi.register(payload);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        throw error;
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const logout = useCallback(() => {
    supabaseClient.auth
      .signOut()
      .catch((error) =>
        console.error('Erro ao encerrar sessao no Supabase', error)
      )
      .finally(() => {
        authStorage.clear();
        setSession({ token: null, user: null, profile: null });
      });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session.token || !session.user) {
      return;
    }
    const supabaseUserId =
      session.profile?.supabaseUserId ?? session.user.id ?? null;
    if (!supabaseUserId) {
      return;
    }
    try {
      const profileData = await accessControlApi.getProfile(supabaseUserId);
      commitSession({
        token: session.token,
        user: session.user,
        profile: mapAccessProfileToAuthProfile(profileData),
      });
    } catch (error) {
      console.error('Nao foi possivel atualizar o perfil', error);
    }
  }, [commitSession, mapAccessProfileToAuthProfile, session]);

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
        refreshProfile,
        loginWithGoogle,
        login,
        register,
        logout,
      };
    },
    [session, isInitializing, isProcessing, login, register, logout, refreshProfile, loginWithGoogle]
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







