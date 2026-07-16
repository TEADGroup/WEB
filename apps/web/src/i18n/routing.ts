import { defineRouting } from 'next-intl/routing';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@tea/shared';

/**
 * Central routing definition shared by the middleware, the request config,
 * and the typed navigation helpers. The locale list lives in @tea/shared so the
 * shared package, locales, and routing can never drift apart.
 */
export const routing = defineRouting({
  // Spread to widen the readonly tuple to string[] for next-intl.
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  // Always prefix URLs with the locale (/vi/..., /en/...) — clearest for bilingual SEO.
  localePrefix: 'always',
});

/**
 * Type guard for a locale string. Defined locally because `hasLocale` is not
 * reliably exported across next-intl versions.
 */
export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (routing.locales as readonly string[]).includes(value);
}
