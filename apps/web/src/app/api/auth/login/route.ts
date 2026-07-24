import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 1. Build placeholder JSON response first
    const placeholder = NextResponse.json({ _placeholder: true });

    // 2. Wire Supabase SSR to set cookies on `placeholder`
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }: any) => {
              placeholder.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    // 3. Sign in — this triggers setAll above, which writes to placeholder.cookies
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // 4. Build final JSON and merge Supabase session cookies onto it
    const json = NextResponse.json({ user: data.user });
    placeholder.cookies.getAll().forEach((c) => {
      json.cookies.set(c.name, c.value, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        secure: process.env.NODE_ENV === 'production',
      });
    });

    return json;
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 },
    );
  }
}
