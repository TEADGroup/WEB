import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/server/modules/auth/rbac';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any; // Database type trong supabase.ts chưa đầy đủ — cần Supabase CLI gen types hoàn chỉnh

/**
 * GET /api/projects/:id/sections — list sections for a project (admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    // Use service client to bypass RLS (admin needs to see draft + published)
    const { createSupabaseServiceClient } = await import('@/lib/supabase/service');
    const supabase = createSupabaseServiceClient() as Db;

    const { data, error } = await supabase
      .from('project_sections')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

/**
 * DELETE /api/projects/:id/sections — reject: delete project + all sections
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const svc = await createSupabaseServerClient() as Db;

    // Delete project (cascades to project_sections via FK)
    const { error } = await svc.from('projects').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

/**
 * POST /api/projects/:id/sections/accept — accept draft sections (publish)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const supabase = await createSupabaseServerClient() as Db;

    // Update all draft sections to published
    const { data, error } = await supabase
      .from('project_sections')
      .update({ status: 'published' })
      .eq('project_id', id)
      .eq('status', 'draft')
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log audit
    await supabase.from('audit_logs').insert({
      actor: admin.userId,
      action: 'accept_sections',
      entity: 'project_sections',
      entity_id: id,
      payload: { count: data?.length || 0 },
    });

    return NextResponse.json({ success: true, count: data?.length || 0 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
