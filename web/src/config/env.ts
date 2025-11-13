type EnvShape = Partial<ImportMetaEnv> & Record<string, string | undefined>;

const readEnv = (): EnvShape => {
  const metaEnv =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as EnvShape)
      : {};

  const processEnv =
    typeof process !== 'undefined' && process.env
      ? (process.env as EnvShape)
      : {};

  return {
    ...processEnv,
    ...metaEnv,
  };
};

const envSource = readEnv();

const ensure = (key: keyof ImportMetaEnv, fallback?: string) => {
  const value = envSource[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
};

const supabaseChannel = ensure('VITE_SUPABASE_REALTIME_CHANNEL', 'calculations');
const adminApiKey = ensure('VITE_ADMIN_API_KEY');

if (typeof console !== 'undefined') {
  console.log('[env] VITE_SUPABASE_REALTIME_CHANNEL:', supabaseChannel);
}

export const env = {
  supabaseUrl: ensure('VITE_SUPABASE_URL'),
  supabaseAnonKey: ensure('VITE_SUPABASE_ANON_KEY'),
  apiBaseUrl: ensure('VITE_API_BASE_URL', 'http://localhost:3000'),
  authBaseUrl: ensure('VITE_AUTH_BASE_URL', 'http://localhost:3001'),
  supabaseChannel,
  adminApiKey,
};
