import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Hero3D } from '@/components/3d/Hero3D';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // `getTranslations` (not `useTranslations`) because this is an async component.
  const t = await getTranslations('Home');

  const stats = [
    { value: '120+', label_vi: 'Dự án triển khai', label_en: 'Projects delivered' },
    { value: '15+', label_vi: 'Năm kinh nghiệm', label_en: 'Years of experience' },
    { value: '50+', label_vi: 'Khách hàng / nhà máy', label_en: 'Clients / plants' },
    { value: '24/7', label_vi: 'Hỗ trợ kỹ thuật', label_en: 'Technical support' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero with live 3D scene behind the copy. */}
      <section className="relative flex min-h-[78vh] flex-col justify-center overflow-hidden py-24">
        <Hero3D />
        {/* left-side scrim keeps the copy readable over the 3D */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/10 to-transparent dark:from-slate-950/60 dark:via-transparent"
        />
        <div className="relative z-10 max-w-3xl animate-fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">
            {t('heroEyebrow')}
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02]"
            >
              {t('heroCta')}
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-slate-300 bg-white/60 px-5 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition-colors hover:border-brand-blue hover:text-brand-blue dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-brand-cyan dark:hover:text-brand-cyan"
            >
              {t('heroSecondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip (Phase 4 will read these from settings.home_stats) */}
      <section className="py-12">
        <h2 className="mb-6 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
          {t('statsTitle')}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label_en}
              className="rounded-xl border border-black/5 bg-white/50 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5"
            >
              <p className="font-display text-3xl font-bold text-brand-blue">{s.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {locale === 'vi' ? s.label_vi : s.label_en}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
