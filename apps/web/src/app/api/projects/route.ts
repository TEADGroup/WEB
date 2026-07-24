import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/modules/auth/rbac';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

/**
 * Direct Supabase REST fetch for public endpoints — avoids SSR cookie client
 * which can stall in dev due to the cached client context issue.
 */
async function supabaseFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase ${res.status}: ${body}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * GET /api/projects — list all projects (admin-only, includes drafts)
 * GET /api/projects?featured=true — list featured projects (public, no auth required)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isFeatured = searchParams.get('featured') === 'true';

  // Featured projects endpoint — public, direct REST fetch
  if (isFeatured) {
    try {
      const select = 'id,slug,title,client,location,date,description_vi,description_en,images,company_logo_url,featured_year,featured_month,featured_order,scope_vi,scope_en';
      const data = await supabaseFetch('projects', {
        select,
        'is_featured': 'eq.true',
        'status': 'eq.published',
        order: 'featured_year.desc.nullslast,featured_month.desc.nullslast,featured_order.asc.nullslast',
      });
      return NextResponse.json(data || [], {
        headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120' },
      });
    } catch (e) {
      console.warn('[API] Failed to fetch featured projects from Supabase, returning empty:', e);
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'public, max-age=15' },
      });
    }
  }

  // Admin: list all projects (requires auth)
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await (supabase as DbClient)
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=15, s-maxage=30' },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

/**
 * POST /api/projects — create a new project (admin-only)
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await requireAdmin();
    const body = await request.json();

    const { data, error } = await (supabase as DbClient)
      .from('projects')
      .insert({
        slug: body.slug,
        category: body.category || 'other',
        title: body.title,
        client: body.client || null,
        location: body.location || null,
        date: body.date || null,
        status: body.status || 'draft',
        description_vi: body.description_vi || null,
        description_en: body.description_en || null,
        images: body.images || [],
        attachments: body.attachments || [],
        created_by: userId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
