import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/server/modules/auth/rbac';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any; // Database type trong supabase.ts chưa đầy đủ — cần Supabase CLI gen types hoàn chỉnh

/**
 * POST /api/projects/:id/sections/accept
 *
 * Publishes all draft sections AND sets the project status to 'published'
 * so it becomes visible on the public site.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const svc = await createSupabaseServerClient() as Db;

    // Update all draft sections to published
    const { data, error } = await svc
      .from('project_sections')
      .update({ status: 'published' })
      .eq('project_id', id)
      .eq('status', 'draft')
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const count = data?.length || 0;

    // Also set project status to published (makes it public)
    await svc
      .from('projects')
      .update({ status: 'published', parse_status: 'done' })
      .eq('id', id);

    // Log audit
    await svc.from('audit_logs').insert({
      actor: admin.userId,
      action: 'accept_sections',
      entity: 'project_sections',
      entity_id: id,
      payload: { count, published: true },
    });

    return NextResponse.json({ success: true, count });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
