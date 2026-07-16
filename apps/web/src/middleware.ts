import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Phase 1: locale negotiation only.
 *
 * Phase 4 will compose the Supabase session check here (refresh token + guard
 * for /(admin)/* routes) by chaining `updateSession` from `@/lib/supabase/server`
 * before/after `intlMiddleware`.
 */
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, API routes, and anything with a file extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
