import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/layout/PageHeader';

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Careers');

  return (
    <div>
      <PageHeader title={t('title')} />
      <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/30 px-6 py-20 text-center dark:border-white/15 dark:bg-white/5">
        <p className="max-w-md text-slate-600 dark:text-slate-300">{t('comingSoon')}</p>
      </div>
    </div>
  );
}
