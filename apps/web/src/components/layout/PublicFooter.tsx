import { useTranslations } from 'next-intl';

export function PublicFooter() {
  const t = useTranslations('Footer');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-white/30 backdrop-blur-nav">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-body-sm text-secondary">
        <p className="font-display font-semibold text-primary">
          TEA Co., Ltd — {t('tagline')}
        </p>
        <p>{t('address')}</p>
        <p>&copy; {year} TEA Co., Ltd. {t('rights')}</p>
      </div>
    </footer>
  );
}
