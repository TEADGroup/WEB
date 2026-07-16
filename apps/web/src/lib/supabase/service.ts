import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

/**
 * Service-role Supabase client — BYPASSES Row Level Security.
 *
 * SERVER-SIDE ONLY. Used by Route Handlers for privileged operations that RLS
 * would otherwise block (e.g. the HDVH parser writing draft sections, the
 * contact handler inserting messages). Never import this into a Client
 * Component, and never expose the service-role key under a NEXT_PUBLIC_ env var.
 */
export function createSupabaseServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'createSupabaseServiceClient requires NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY. This function must only be called server-side.',
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
