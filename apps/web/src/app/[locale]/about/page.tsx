import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/layout/PageHeader';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('About');

  const capabilities = [
    { vi: 'Thiết kế & chế tạo tủ điện điều khiển', en: 'Control cabinet design & fabrication' },
    { vi: 'Lập trình PLC / SCADA', en: 'PLC / SCADA programming' },
    { vi: 'Tích hợp hệ thống tự động', en: 'Automation system integration' },
    { vi: 'Bảo trì, hiệu chuẩn & hỗ trợ kỹ thuật', en: 'Maintenance, calibration & technical support' },
  ];

  return (
    <div>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('lead')} />

      <div className="grid gap-8 pb-12 md:grid-cols-2">
        <section className="rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {t('missionTitle')}
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{t('mission')}</p>
        </section>
        <section className="rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {t('teamTitle')}
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{t('team')}</p>
        </section>
      </div>

      <section className="pb-20">
        <h2 className="mb-6 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
          {t('capabilityTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {capabilities.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue/10 font-bold text-brand-blue">
                ✓
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {locale === 'vi' ? c.vi : c.en}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
