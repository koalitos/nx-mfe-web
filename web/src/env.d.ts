interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_BASE_URL?: string;
  readonly VITE_SUPABASE_REALTIME_CHANNEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
