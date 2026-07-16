import { useTranslations } from 'next-intl';

/** Server component — uses next-intl's request-config translations directly. */
export function PublicFooter() {
  const t = useTranslations('Footer');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-black/5 bg-white/30 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-slate-600 dark:text-slate-300">
        <p className="font-display font-semibold text-slate-800 dark:text-white">
          TEA Co., Ltd — {t('tagline')}
        </p>
        <p>{t('address')}</p>
        <p>
          © {year} TEA Co., Ltd. {t('rights')}
        </p>
      </div>
    </footer>
  );
}
