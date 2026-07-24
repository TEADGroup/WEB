'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { VideoBackground } from '@/components/video/VideoBackground';

interface Partner { name: string; src: string; }
const PARTNERS: Partner[] = [
  { name: 'Siemens', src: '/images/partners/siemens.svg' },
  { name: 'Mitsubishi', src: '/images/partners/mitsubishi.svg' },
  { name: 'Schneider', src: '/images/partners/schneider.svg' },
  { name: 'Allen-Bradley', src: '/images/partners/allen-bradley.svg' },
  { name: 'Omron', src: '/images/partners/omron.svg' },
];

export function HeroSection() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    try {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(el.querySelector('.hero-logo'),     { y: -40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.7 }, 0.05);
      tl.fromTo(el.querySelector('.hero-eyebrow'),  { y: 24, opacity: 0 },              { y: 0, opacity: 1, duration: 0.5 }, 0.25);
      tl.fromTo(el.querySelector('.hero-title'),    { y: 30, opacity: 0, skewY: 2 },    { y: 0, opacity: 1, skewY: 0, duration: 0.65 }, 0.4);
      tl.fromTo(el.querySelector('.hero-subtitle'), { y: 20, opacity: 0 },              { y: 0, opacity: 1, duration: 0.5 }, 0.6);
      tl.fromTo(el.querySelector('.hero-cta'),      { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, stagger: 0.1 }, 0.75);
      tl.fromTo(el.querySelector('.hero-partners'), { y: 20, opacity: 0 },              { y: 0, opacity: 1, duration: 0.6 }, 0.9);
    } catch (e) { console.warn('[HeroSection] GSAP animation skipped:', e); }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100dvh', background: '#e8eff9' }}
    >
      {/* ═══ Video background ═══ */}
      <VideoBackground
        src="/videos/hero-factory.mp4"
        opacity={0.55}
        overlay={false}
      />

      {/* ═══ Gradient mask ═══ */}
      <div className="pointer-events-none absolute inset-0 z-[1]" style={{
        background: 'linear-gradient(90deg, #e8eff9 0%, #e8eff9 30%, rgba(232,239,249,0.7) 50%, transparent 70%, transparent 100%)',
      }} />

      {/* ═══ Text content ═══ */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-6 sm:px-8" style={{ minHeight: '100dvh' }}>
        <div className="flex w-full flex-col items-start justify-center lg:w-2/5 lg:pr-4">
          <Image src="/images/logo.png" alt="TEA Co., Ltd" width={220} height={217}
            className="hero-logo mb-5 h-auto w-52 max-w-full object-contain max-md:w-40" priority />
          <p className="hero-eyebrow mb-4 font-display text-eyebrow uppercase tracking-[0.25em] text-brand-blue">{t('heroEyebrow')}</p>
          <h1 className="hero-title font-display text-[1.4rem] sm:text-[1.8rem] md:text-[2rem] lg:text-[2.2rem] font-bold tracking-tight text-slate-800 break-words">{t('heroTitle')}</h1>
          <p className="hero-subtitle mt-5 max-w-lg text-body-lg leading-relaxed text-slate-500">{t('heroSubtitle')}</p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#contact" className="hero-cta rounded-button bg-gradient-to-r from-brand-green to-brand-green/80 px-7 py-3.5 text-body font-semibold text-white shadow-lg shadow-brand-green/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-brand-green/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2">{t('heroCta')}</a>
            <a href="#solutions" className="hero-cta rounded-button border border-slate-200 bg-white px-7 py-3.5 text-body font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-brand-blue/30 hover:text-brand-blue hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">{t('heroSecondary')}</a>
          </div>

          {/* Partners */}
          <div className="hero-partners mt-10 w-full border-t border-slate-200 pt-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted">{t('heroTrustTitle')}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {PARTNERS.map((p) => (
                <Image key={p.name} src={p.src} alt={p.name} width={80} height={24}
                  className="h-5 w-auto object-contain opacity-45 grayscale transition-all duration-300 hover:opacity-75 hover:grayscale-0" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
