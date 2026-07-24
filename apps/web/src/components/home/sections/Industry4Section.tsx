'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';

import { industry4Data } from '../data';

export function Industry4Section() {
  const t = useTranslations('Industry4');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    try {
      const cards = gsap.utils.toArray<Element>('.industry4-card', el);

      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
        defaults: { ease: 'power3.out' },
      });
      tl.fromTo(el.querySelector('.industry4-eyebrow'), { y: 18, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45 });
      tl.fromTo(el.querySelector('.industry4-title'), { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }, '-=0.2');
      tl.fromTo(el.querySelector('.industry4-subtitle'), { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 }, '-=0.3');

      tl.fromTo(cards,
        { y: 60, opacity: 0, scale: 0.88 },
        { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.1, ease: 'back.out(1.3)' },
        '>-0.25',
      );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    } catch (e) {
      console.warn('[Industry4Section] GSAP animation skipped:', e);
    }
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 md:py-32">
      {/* layered bg */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-white" />
      <div className="pointer-events-none absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-blue/10 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ══ HEADLINE ══ */}
        <div className="mb-14 text-center">
          <div className="industry4-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/[0.05] px-5 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Sparkles size={12} />
            {t('eyebrow')}
          </div>
          <h2 className="industry4-title font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.05] tracking-tight text-slate-900">
            {t('title')}
          </h2>
          <p className="industry4-subtitle mt-4 max-w-2xl mx-auto text-body-lg leading-relaxed text-slate-500">
            {t('subtitle')}
          </p>
        </div>

        {/* ══ CARDS — 2×4 grid, rộng hơn ══ */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {industry4Data.map((item, i) => {
            const Icon = item.icon;
            const title = locale === 'vi' ? item.titleVi : item.titleEn;
            const desc = locale === 'vi' ? item.descVi : item.descEn;

            return (
              <div
                key={i}
                className="industry4-card group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-7 shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1.5 hover:border-slate-300/80"
              >
                {/* top gradient line */}
                <div
                  className="absolute inset-x-0 top-0 h-[3px] transition-all duration-500 group-hover:h-[4px]"
                  style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}66, transparent)` }}
                />

                {/* icon — bigger */}
                <div
                  className="mb-5 grid h-14 w-14 place-items-center rounded-xl text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}bb)` }}
                >
                  <Icon size={26} />
                </div>

                {/* title — bold + brand color */}
                <h3
                  className="mb-3 font-display text-lg font-black tracking-tight"
                  style={{ color: item.color }}
                >
                  {title}
                </h3>

                {/* desc */}
                <p className="text-sm leading-relaxed text-slate-600">
                  {desc}
                </p>

                {/* hover link */}
                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-2.5" style={{ color: item.color }}>
                  <span>{locale === 'vi' ? 'Tìm hiểu thêm' : 'Learn more'}</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
