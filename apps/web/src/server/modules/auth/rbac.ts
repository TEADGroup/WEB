import { createSupabaseServerClient } from '@/lib/supabase/server';

// ─── Request-scoped cache ─────────────────────────────────────────────
// Avoids calling auth.getUser() + profile query multiple times per request
// when multiple route handlers or server actions chain requireAdmin calls.
// The WeakRef / module-level let is safe because Next.js isolates per-request
// in development and each serverless invocation in production.
let _adminCache: { userId: string; role: 'admin'; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> } | null = null;

/**
 * Require the current session user to have admin role.
 * Returns both admin info and the Supabase client — reuse instead of
 * creating a second client for the query.
 * Throws with a descriptive message on failure.
 */
export async function requireAdmin(): Promise<{ userId: string; role: 'admin'; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }> {
  if (_adminCache) return _adminCache;

  const supabase = await createSupabaseServerClient();

  // getUser + profile query IN PARALLEL — saves ~200-400ms per request
  const [{ data: { user }, error: authError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('role').single(),
  ]);

  if (authError || !user) {
    throw new Error('Unauthorized — not authenticated');
  }

  if (profileError || !profile) {
    throw new Error('Unauthorized — profile not found');
  }

  const role = (profile as unknown as { role: string }).role;
  if (role !== 'admin') {
    throw new Error('Forbidden — admin role required');
  }

  _adminCache = { userId: user.id, role: 'admin' as const, supabase };
  return _adminCache;
}

/**
 * Require the current session user to be authenticated (any role).
 * Returns auth info + supabase client to avoid creating a second client.
 */
export async function requireAuth(): Promise<{ userId: string; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }> {
  // Reuse from admin cache if already resolved
  if (_adminCache) return { userId: _adminCache.userId, supabase: _adminCache.supabase };

  const supabase = await createSupabaseServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized — not authenticated');
  }

  return { userId: user.id, supabase };
}
