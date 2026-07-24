import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/server/modules/auth/rbac';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any; // Database type trong supabase.ts chưa đầy đủ — cần Supabase CLI gen types hoàn chỉnh

/**
 * GET /api/projects/:id — get a single project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createSupabaseServerClient() as Db;
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

/**
 * PUT /api/projects/:id — update a project (admin-only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createSupabaseServerClient() as Db;
    const body = await request.json();

    const { data, error } = await supabase
      .from('projects')
      .update({
        slug: body.slug,
        category: body.category,
        title: body.title,
        client: body.client,
        location: body.location,
        date: body.date,
        status: body.status,
        description_vi: body.description_vi,
        description_en: body.description_en,
        images: body.images,
        is_featured: body.is_featured ?? false,
        featured_year: body.featured_year ?? null,
        featured_month: body.featured_month ?? null,
        featured_order: body.featured_order ?? 0,
        company_logo_url: body.company_logo_url ?? null,
        scope_vi: body.scope_vi ?? null,
        scope_en: body.scope_en ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

/**
 * DELETE /api/projects/:id — delete a project (admin-only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createSupabaseServerClient() as Db;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
