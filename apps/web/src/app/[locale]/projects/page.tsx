import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Projects');

  return (
    <div>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="grid place-items-center rounded-2xl border border-dashed border-brand-blue/30 bg-brand-blue/5 px-6 py-20 text-center">
        <div className="mb-4 text-4xl">🌳</div>
        <p className="max-w-md text-slate-600 dark:text-slate-300">{t('comingSoon')}</p>
        <Link
          href="/contact"
          className="mt-6 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02]"
        >
          {locale === 'vi' ? 'Liên hệ tư vấn' : 'Talk to us'}
        </Link>
      </div>
    </div>
  );
}
