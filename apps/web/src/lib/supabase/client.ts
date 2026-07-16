'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/supabase';

/**
 * Browser Supabase client (Client Components). Uses the anon key + the user's
 * session cookies, so RLS applies exactly as on the server.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
