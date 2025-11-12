import { AuthProfile, AuthUser } from '../auth/types';

const TOKEN_KEY = 'web.auth.accessToken';
const USER_KEY = 'web.auth.user';
const PROFILE_KEY = 'web.auth.profile';

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

const safeParse = <T>(value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export interface StoredSession {
  token: string;
  user: AuthUser;
  profile: AuthProfile | null;
}

export const authStorage = {
  keys: {
    token: TOKEN_KEY,
    user: USER_KEY,
    profile: PROFILE_KEY,
  },
  load(): { token: string | null; user: AuthUser | null; profile: AuthProfile | null } {
    if (!isBrowser()) {
      return { token: null, user: null, profile: null };
    }

    const token = window.localStorage.getItem(TOKEN_KEY);
    const user = safeParse<AuthUser>(window.localStorage.getItem(USER_KEY));
    const profile = safeParse<AuthProfile>(window.localStorage.getItem(PROFILE_KEY));
    return { token, user, profile };
  },
  save(session: StoredSession) {
    if (!isBrowser()) {
      return;
    }

    window.localStorage.setItem(TOKEN_KEY, session.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));

    if (session.profile) {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(session.profile));
    } else {
      window.localStorage.removeItem(PROFILE_KEY);
    }
  },
  clear() {
    if (!isBrowser()) {
      return;
    }

    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(PROFILE_KEY);
  },
};
