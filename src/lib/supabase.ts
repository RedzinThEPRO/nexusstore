import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// In demo mode (no valid credentials) this client may be inert; the app
// falls back to the local store. When you wire real Supabase credentials
// in .env, the same client becomes active.
export const supabase: SupabaseClient | null =
  url && anonKey && url.startsWith('http')
    ? createClient(url, anonKey, { auth: { persistSession: true } })
    : null;

export const isSupabaseConfigured = Boolean(
  url && anonKey && url.startsWith('http') && url.includes('.supabase.co'),
);
