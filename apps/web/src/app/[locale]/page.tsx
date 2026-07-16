import React from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/layout/PageHeader';
import { ContactForm } from '@/components/layout/ContactForm';
import {
  Cog, CircuitBoard, Cpu, Wrench, HardDrive, Target, BarChart3, Users,
} from 'lucide-react';

const MAP_SRC =
  'https://www.google.com/maps?q=294%2F41%2F18+%C4%90%C6%B0%E1%BB%9Dng+s%E1%BB%91+8%2C+Th%C3%B4ng+T%C3%A2y+H%E1%BB%99i%2C+H%E1%BB%93+Ch%C3%AD+Minh&output=embed';

const capabilitiesIcon = [Cog, CircuitBoard, Cpu, Wrench, HardDrive];

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
    { value: '120+', labelVn: 'Dự án triển khai', labelEn: 'Projects delivered', Icon: BarChart3 },
    { value: '15+', labelVn: 'Năm kinh nghiệm', labelEn: 'Years of experience', Icon: Target },
    { value: '50+', labelVn: 'Khách hàng / nhà máy', labelEn: 'Clients / plants', Icon: Users },
    { value: '24/7', labelVn: 'Hỗ trợ kỹ thuật', labelEn: 'Technical support', Icon: Cpu },
  ];

  const capabilities = [
    { vi: 'Thiết kế & chế tạo tủ điện điều khiển', en: 'Control cabinet design & fabrication' },
    { vi: 'Lập trình PLC / SCADA', en: 'PLC / SCADA programming' },
    { vi: 'Tích hợp hệ thống tự động', en: 'Automation system integration' },
    { vi: 'Tự động hoá dây chuyền', en: 'Line automation' },
    { vi: 'Bảo trì, hiệu chuẩn & hỗ trợ kỹ thuật', en: 'Maintenance, calibration & support' },
  ];

  const solutions = [
    { labelVi: 'Thiết kế & chế tạo tủ điện điều khiển', labelEn: 'Control cabinet design & fabrication', gif: '/images/control-cabinet.gif' },
    { labelVi: 'Lập trình PLC / SCADA', labelEn: 'PLC / SCADA programming', gif: '/images/plc-scada.gif' },
    { labelVi: 'Tích hợp hệ thống tự động', labelEn: 'Automation system integration', gif: '/images/automation.gif' },
    { labelVi: 'Tự động hoá dây chuyền', labelEn: 'Line automation', gif: '/images/factory-line.gif' },
    { labelVi: 'Bảo trì, hiệu chuẩn & hỗ trợ kỹ thuật', labelEn: 'Maintenance, calibration & support', gif: '/images/engineering.gif' },
  ];

  return (
    <div className="flex flex-col">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section id="home" className="relative flex min-h-[78vh] flex-col justify-center overflow-hidden py-24">
        <div className="relative z-10 max-w-3xl animate-fade-up">
          <p className="mb-5 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
            {t('heroEyebrow')}
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#solutions"
              className="rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02]"
            >
              {t('heroCta')}
            </a>
            <a
              href="#contact"
              className="rounded-lg bg-white/60 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition-colors hover:text-brand-blue dark:bg-white/5 dark:text-white dark:hover:text-brand-cyan"
            >
              {t('heroSecondary')}
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SOLUTIONS — animated GIF cards ═══════════════════ */}
      <section id="solutions" className="py-20">
        <PageHeader eyebrow={t('solutionsEyebrow')} title={t('solutionsTitle')} subtitle={t('solutionsSubtitle')} />

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((sol, i) => (
            <div
              key={sol.labelVi}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white/30 backdrop-blur transition-shadow hover:shadow-lg dark:bg-white/5"
            >
              <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-brand-blue/5 via-brand-green/5 to-brand-red/5">
                <img
                  src={sol.gif}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
              </div>
              <div className="flex flex-1 items-center gap-3 px-5 py-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue/10 text-brand-blue">
                  {React.createElement(capabilitiesIcon[i], { size: 16 })}
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {locale === 'vi' ? sol.labelVi : sol.labelEn}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ ABOUT + CAPABILITIES ═══════════════════ */}
      <section id="about" className="py-20">
        <PageHeader eyebrow={aboutT('eyebrow')} title={aboutT('title')} subtitle={aboutT('lead')} />

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Vision */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white/30 p-7 backdrop-blur dark:bg-white/5">
            <Target className="text-brand-blue" size={28} />
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{aboutT('missionTitle')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{aboutT('mission')}</p>
            </div>
          </div>
          {/* Team */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white/30 p-7 backdrop-blur dark:bg-white/5">
            <Users className="text-brand-blue" size={28} />
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{aboutT('teamTitle')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{aboutT('team')}</p>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-16">
          <h2 className="mb-8 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
            {aboutT('capabilityTitle')}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {capabilities.map((c, i) => {
              const Icon = capabilitiesIcon[i];
              return (
                <div
                  key={c.vi}
                  className="flex items-start gap-4 rounded-2xl bg-white/30 p-5 backdrop-blur dark:bg-white/5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-blue/10">
                    <Icon size={20} className="text-brand-blue" />
                  </span>
                  <span className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                    {locale === 'vi' ? c.vi : c.en}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS (Năng lực nổi bật) ═══════════════════ */}
      <section className="py-20">
        <h2 className="mb-8 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
          {t('statsTitle')}
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.Icon;
            return (
              <div
                key={s.value}
                className="flex flex-col items-center gap-3 rounded-2xl bg-white/30 p-6 text-center backdrop-blur dark:bg-white/5"
              >
                <Icon size={28} className="text-brand-blue" />
                <p className="font-display text-3xl font-bold text-brand-blue">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {locale === 'vi' ? s.labelVn : s.labelEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════ PROJECTS ═══════════════════ */}
      <section id="projects" className="py-20">
        <PageHeader
          eyebrow={t('projectsEyebrow')}
          title={t('projectsTitle')}
          subtitle={t('projectsSubtitle')}
        />

        <div className="mt-8 grid place-items-center rounded-2xl bg-brand-blue/5 px-6 py-24 text-center">
          <HardDrive size={40} className="mb-4 text-brand-blue/40" />
          <p className="max-w-md text-slate-600 dark:text-slate-300">{t('projectsComingSoon')}</p>
          <a
            href="#contact"
            className="mt-6 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02]"
          >
            {locale === 'vi' ? 'Liên hệ tư vấn' : 'Talk to us'}
          </a>
        </div>
      </section>

      {/* ═══════════════════ CONTACT ═══════════════════ */}
      <section id="contact" className="py-20">
        <PageHeader
          eyebrow={contactT('eyebrow')}
          title={contactT('title')}
          subtitle={contactT('subtitle')}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <ContactForm />

          <div className="space-y-5">
            <div className="rounded-2xl bg-white/30 p-6 backdrop-blur dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                {contactT('addressLabel')}
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {footerT('address')}
              </p>
            </div>

            <iframe
              title="TEA Co., Ltd — map"
              src={MAP_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full rounded-2xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
