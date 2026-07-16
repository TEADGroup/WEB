'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALES } from '@tea/shared';

/** VI / EN switcher. Uses next-intl's locale-aware router so switching does not
 *  trigger a full page reload (messages are already loaded). */
export function LanguageSwitcher() {
  const t = useTranslations('Language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (next: string) => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="inline-flex rounded-full border border-black/10 bg-white/40 p-0.5 backdrop-blur dark:border-white/15 dark:bg-white/5"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={locale === l}
          data-active={locale === l}
          className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase text-slate-600 transition-colors data-[active=true]:bg-brand-blue data-[active=true]:text-white dark:text-slate-300"
        >
          {l}
        </button>
      ))}
    </div>
  );
}
