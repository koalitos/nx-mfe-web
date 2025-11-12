import { AuthUser } from '../auth/types';

const TOKEN_KEY = 'web.auth.accessToken';
const USER_KEY = 'web.auth.user';

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

const safeParse = (value: string | null) => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
};

export const authStorage = {
  keys: {
    token: TOKEN_KEY,
    user: USER_KEY,
  },
  load(): { token: string | null; user: AuthUser | null } {
    if (!isBrowser()) {
      return { token: null, user: null };
    }

    const token = window.localStorage.getItem(TOKEN_KEY);
    const user = safeParse(window.localStorage.getItem(USER_KEY));
    return { token, user };
  },
  save(token: string, user: AuthUser) {
    if (!isBrowser()) {
      return;
    }
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    if (!isBrowser()) {
      return;
    }
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};
