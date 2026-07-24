import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';

import { routing } from './i18n/routing';
import type { Database } from '@/types/supabase';

const intlMiddleware = createMiddleware(routing);

/**
 * Phase 3: Supabase auth guard composed with next-intl locale middleware.
 *
 * 1. Run the intl middleware first for locale handling.
 * 2. Refresh the Supabase session on every request.
 * 3. Guard all /(admin)/* routes — redirect unauthenticated users to /login.
 */

// Admin route patterns (relative paths matched after locale prefix)
const ADMIN_PREFIXES = ['/admin'];

function isAdminRoute(pathname: string): boolean {
  const path = pathname.replace(/^\/(vi|en)/, '');
  return ADMIN_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  // 1. Intl middleware for locale negotiation
  const intlResponse = intlMiddleware(request);

  // 2. Guard admin routes — ONLY create Supabase client and call auth
  //    for protected pages. Public pages bypass Supabase entirely
  //    (no auth check, no cookie refresh) so every unauthenticated
  //    page load saves ~200-400ms.
  if (isAdminRoute(request.nextUrl.pathname)) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options: CookieOptions }[],
          ) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const locale = request.nextUrl.pathname.match(/^\/(vi|en)/)?.[1] || 'vi';
      const loginUrl = new URL(`/${locale}/login`, request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      intlResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }

    // Merge intl cookies into supabase response
    intlResponse.cookies.getAll().forEach((cookie) => {
      supabaseResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return supabaseResponse;
  }

  // Public page — no Supabase interaction at all
  return intlResponse;
}

export const config = {
  // Skip internal Next.js routes, API routes, static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
