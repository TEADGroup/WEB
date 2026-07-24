import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/keep-awake
 *
 * Lightweight health-check endpoint that pings Supabase so the Free‑Plan
 * database never sits idle long enough to enter the 7‑day sleep state.
 *
 * Use any free cron service (cron-job.org, UptimeRobot, GitHub Actions, etc.)
 * to hit this URL every 4–5 days (daily is safer).
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Minimal query — a single row count from a tiny table.
    const { error } = await supabase
      .from('settings')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[keep-awake] Supabase ping failed:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[keep-awake] Unexpected error:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
