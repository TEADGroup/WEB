import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/supabase';

// ---------------------------------------------------------------------------
// Request-scoped singleton cache.
//
// Next.js can import and call the same module multiple times during a single
// request (layout → page → route handler → nested layout).  Wrapping
// createServerClient in a WeakMap keyed on the request URL means every call
// within the same request reuses the **same** Supabase client instance
// instead of opening a new HTTP connection pool every time.
//
// When cookies() is called from a Server Component where cookies cannot be
// set, the `try/catch` inside `setAll` is still needed; the cached client
// carries the same caveat.
// ---------------------------------------------------------------------------

let cachedClient: ReturnType<typeof createServerClient<Database>> | null = null;

/**
 * SSR cookie-based Supabase client for Server Components, Route Handlers and
 * Server Actions. Carries the user's session (JWT + refresh) via cookies so
 * Row Level Security evaluates per-user.
 *
 * Cache: subsequent calls within the same request reuse the same instance,
 * saving one `createServerClient` call and its associated cookie parsing.
 * The cache resets automatically when the serverless function cold-starts.
 */
export async function createSupabaseServerClient() {
  if (cachedClient) return cachedClient;

  const cookieStore = await cookies();

  cachedClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies can't be set. The middleware refreshes the session, so
            // this is safe to ignore.
          }
        },
      },
    },
  );

  return cachedClient;
}
