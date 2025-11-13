interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_BASE_URL?: string;
  readonly VITE_SUPABASE_REALTIME_CHANNEL?: string;
  readonly VITE_ADMIN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
