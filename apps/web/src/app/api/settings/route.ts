import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/server/modules/auth/rbac';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

/**
 * GET /api/settings?key=xxx — fetch one or more settings by key
 *
 * Multiple keys can be comma-separated: ?key=company,ai_config
 * Returns a single object { value: ... } for one key,
 * or { company: { value: ... }, ai_config: { value: ... } } for multiple keys.
 */
export async function GET(request: NextRequest) {
  const keysParam = request.nextUrl.searchParams.get('key');
  if (!keysParam) {
    return NextResponse.json({ error: 'key parameter is required' }, { status: 400 });
  }

  const keys = keysParam.split(',').map(k => k.trim()).filter(Boolean);
  const supabase = createSupabaseServiceClient();

  if (keys.length === 1) {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', keys[0])
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=30, s-maxage=60' },
    });
  }

  // Multiple keys → 1 query with .in() instead of N sequential queries
  const { data, error } = await (supabase as Db)
    .from('settings')
    .select('key, value')
    .in('key', keys);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build a map: { keyName: { value: ... }, ... }
  const result: Record<string, unknown> = {};
  for (const k of keys) {
    const found = (data as Array<{ key: string; value: unknown }> | null)?.find(row => row.key === k);
    result[k] = found ? { value: found.value } : null;
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=30, s-maxage=60' },
  });
}

/**
 * PUT /api/settings — upsert a setting (admin-only, service-role bypasses RLS).
 * requireAdmin() handles auth at the application layer.
 */
export async function PUT(request: NextRequest) {
  try {
    const { supabase: _supabase, userId } = await requireAdmin();
    const svc = createSupabaseServiceClient();
    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    const { data, error } = await (svc as Db)
      .from('settings')
      .upsert({ key, value, updated_by: userId }, { onConflict: 'key' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
