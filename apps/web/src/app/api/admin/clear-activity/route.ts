import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/server/modules/auth/rbac';

/**
 * DELETE /api/admin/clear-activity
 *
 * Deletes all audit_log rows. Uses the service-role client (bypasses RLS)
 * because the RLS policy on audit_logs only grants INSERT + SELECT —
 * DELETE is reserved for the service role.
 */
export async function DELETE() {
  try {
    await requireAdmin();
    const svc = createSupabaseServiceClient();

    const { error } = await svc
      .from('audit_logs')
      .delete()
      .gte('id', 0); // gte(0) = all rows (id is bigserial)

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
