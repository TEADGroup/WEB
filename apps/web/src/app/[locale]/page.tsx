import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Hero3D } from '@/components/3d/Hero3D';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContactForm } from '@/components/layout/ContactForm';
import { ModelViewer } from '@/components/3d/ModelViewer';

const MAP_SRC =
  'https://www.google.com/maps?q=294%2F41%2F18+%C4%90%C6%B0%E1%BB%9Dng+s%E1%BB%91+8%2C+Th%C3%B4ng+T%C3%A2y+H%E1%BB%99i%2C+H%E1%BB%93+Ch%C3%AD+Minh&output=embed';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');
  const aboutT = await getTranslations('About');
  const contactT = await getTranslations('Contact');
  const footerT = await getTranslations('Footer');

  const stats = [
    { value: '120+', labelVn: 'Dự án triển khai', labelEn: 'Projects delivered' },
    { value: '15+', labelVn: 'Năm kinh nghiệm', labelEn: 'Years of experience' },
    { value: '50+', labelVn: 'Khách hàng / nhà máy', labelEn: 'Clients / plants' },
    { value: '24/7', labelVn: 'Hỗ trợ kỹ thuật', labelEn: 'Technical support' },
  ];

  const solutions = [
    { key: 'control', model: '/models3d/BrainStem.glb', labelVi: 'Thiết kế & chế tạo tủ điện điều khiển', labelEn: 'Control cabinet design & fabrication' },
    { key: 'plc', model: '/models3d/CesiumMilkTruck.glb', labelVi: 'Lập trình PLC / SCADA', labelEn: 'PLC / SCADA programming' },
    { key: 'integration', model: '/models3d/ChronographWatch.glb', labelVi: 'Tích hợp hệ thống tự động', labelEn: 'Automation system integration' },
    { key: 'line', model: null, labelVi: 'Tự động hoá dây chuyền', labelEn: 'Line automation' },
    { key: 'support', model: null, labelVi: 'Bảo trì, hiệu chuẩn & hỗ trợ kỹ thuật', labelEn: 'Maintenance, calibration & support' },
  ];

  return (
    <div className="flex flex-col">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section
        id="home"
        className="relative flex min-h-[78vh] flex-col justify-center overflow-hidden py-24"
      >
        <Hero3D />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/10 to-transparent dark:from-slate-950/60 dark:via-transparent"
        />
        <div className="relative z-10 max-w-3xl animate-fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">
            {t('heroEyebrow')}
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#solutions"
              className="rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02]"
            >
              {t('heroCta')}
            </a>
            <a
              href="#contact"
              className="rounded-lg bg-white/60 px-5 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition-colors hover:text-brand-blue dark:bg-white/5 dark:text-white dark:hover:text-brand-cyan"
            >
              {t('heroSecondary')}
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS ═══════════════════ */}
      <section className="py-12">
        <h2 className="mb-6 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
          {t('statsTitle')}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.value}
              className="rounded-xl bg-white/40 p-5 backdrop-blur dark:bg-white/5"
            >
              <p className="font-display text-3xl font-bold text-brand-blue">{s.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {locale === 'vi' ? s.labelVn : s.labelEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ ABOUT ═══════════════════ */}
      <section id="about" className="py-16">
        <PageHeader eyebrow={aboutT('eyebrow')} title={aboutT('title')} subtitle={aboutT('lead')} />

        <div className="grid gap-8 pb-12 md:grid-cols-2">
          <section className="rounded-2xl bg-white/40 p-6 backdrop-blur dark:bg-white/5">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {aboutT('missionTitle')}
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{aboutT('mission')}</p>
          </section>
          <section className="rounded-2xl bg-white/40 p-6 backdrop-blur dark:bg-white/5">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {aboutT('teamTitle')}
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{aboutT('team')}</p>
          </section>
        </div>
      </section>

      {/* ═══════════════════ SOLUTIONS ═══════════════════ */}
      <section id="solutions" className="py-16">
        <PageHeader eyebrow={t('solutionsEyebrow')} title={t('solutionsTitle')} subtitle={t('solutionsSubtitle')} />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((sol, i) => (
            <div
              key={sol.key}
              className="flex flex-col overflow-hidden rounded-2xl bg-white/40 backdrop-blur dark:bg-white/5"
            >
              {sol.model ? (
                <ModelViewer src={sol.model} className="h-44 w-full" />
              ) : (
                /* procedural mini-scene for the 2 items without a GLB */
                <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-brand-blue/5 via-brand-green/5 to-brand-red/5">
                  <span className="text-5xl opacity-20">{i === 3 ? '⚙️' : '🔧'}</span>
                </div>
              )}
              <div className="flex flex-1 flex-col justify-center px-5 py-4">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {locale === 'vi' ? sol.labelVi : sol.labelEn}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ PROJECTS ═══════════════════ */}
      <section id="projects" className="py-16">
        <PageHeader eyebrow={t('projectsEyebrow')} title={t('projectsTitle')} subtitle={t('projectsSubtitle')} />

        <div className="grid place-items-center rounded-2xl bg-brand-blue/5 px-6 py-20 text-center">
          <p className="max-w-md text-slate-600 dark:text-slate-300">{t('projectsComingSoon')}</p>
          <a
            href="#contact"
            className="mt-6 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02]"
          >
            {locale === 'vi' ? 'Liên hệ tư vấn' : 'Talk to us'}
          </a>
        </div>
      </section>

      {/* ═══════════════════ CONTACT ═══════════════════ */}
      <section id="contact" className="py-16">
        <PageHeader eyebrow={contactT('eyebrow')} title={contactT('title')} subtitle={contactT('subtitle')} />

        <div className="grid gap-8 pb-20 lg:grid-cols-2">
          <ContactForm />

          <div className="space-y-4">
            <div className="rounded-xl bg-white/40 p-5 backdrop-blur dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                {contactT('addressLabel')}
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {footerT('address')}
              </p>
            </div>

            <iframe
              title="TEA Group — map"
              src={MAP_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full rounded-xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
