import { getRequestConfig } from 'next-intl/server';
import { isLocale, routing } from './routing';

/**
 * Server-side message loader. next-intl calls this for each request to resolve
 * the active locale and its message bundle. Because messages are imported
 * statically, switching locale via the cookie does NOT trigger a full reload.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});
