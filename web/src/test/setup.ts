import '@testing-library/jest-dom';
import { vi } from 'vitest';

const ensureEnv = (key: string, value: string) => {
  if (!import.meta.env[key]) {
    vi.stubEnv(key, value);
  }
};

ensureEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
ensureEnv('VITE_SUPABASE_ANON_KEY', 'dummy-anon-key');
ensureEnv('VITE_API_BASE_URL', 'http://localhost:3000');
ensureEnv('VITE_AUTH_BASE_URL', 'http://localhost:3001');
ensureEnv('VITE_SUPABASE_REALTIME_CHANNEL', 'calculations');
