import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

/**
 * M0 gate health check. Confirms the API layer runs and (if env is set) that
 * Supabase is reachable. Kept dependency-light so it works before the DB is
 * provisioned — reports "unconfigured" rather than failing hard.
 */
export async function GET() {
  const hasEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasEnv) {
    return NextResponse.json({ status: 'ok', db: 'unconfigured', ts: new Date().toISOString() });
  }

  try {
    const supabase = await createSupabaseServer();
    // Cheap round-trip against a public-readable table (RLS allows anon select).
    const { error } = await supabase.from('categories').select('id').limit(1);
    return NextResponse.json({
      status: 'ok',
      db: error ? `error: ${error.message}` : 'reachable',
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { status: 'degraded', db: 'unreachable', detail: String(e) },
      { status: 503 },
    );
  }
}
