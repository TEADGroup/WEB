import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/layout/PageHeader';
import { ContactForm } from '@/components/layout/ContactForm';

const MAP_SRC =
  'https://www.google.com/maps?q=294%2F41%2F18+%C4%90%C6%B0%E1%BB%9Dng+s%E1%BB%91+8%2C+Th%C3%B4ng+T%C3%A2y+H%E1%BB%99i%2C+H%E1%BB%93+Ch%C3%AD+Minh&output=embed';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');
  const footer = await getTranslations('Footer');

  return (
    <div>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="grid gap-8 pb-20 lg:grid-cols-2">
        <ContactForm />

        <div className="space-y-4">
          <div className="rounded-xl border border-black/5 bg-white/50 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
              {t('addressLabel')}
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{footer('address')}</p>
          </div>

          <iframe
            title="TEA Group — map"
            src={MAP_SRC}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full rounded-xl border border-black/5 dark:border-white/10"
          />
        </div>
      </div>
    </div>
  );
}
