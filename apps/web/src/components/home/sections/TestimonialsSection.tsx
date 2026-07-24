'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useTranslations, useLocale } from 'next-intl';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

import { testimonialData } from '../data';

export function TestimonialsSection() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [prevActive, setPrevActive] = useState(0);
  const total = testimonialData.length;

  useEffect(() => {
    const timer = setInterval(() => setActive((p) => (p + 1) % total), 6000);
    return () => clearInterval(timer);
  }, [total]);

  /* GSAP fade transition on slide change */
  useEffect(() => {
    if (active === prevActive || !cardRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setPrevActive(active) });
    tl.to(cardRef.current, { y: -12, opacity: 0, duration: 0.2, ease: 'power2.in' })
      .set(cardRef.current, { y: 12 })
      .to(cardRef.current, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  }, [active, prevActive]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    try {
      gsap.fromTo(el.querySelectorAll('.testimonials-label'), { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 78%', once: true } });
      gsap.fromTo(el.querySelector('.testimonials-content'), { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    } catch (e) { console.warn('[TestimonialsSection] GSAP animation skipped:', e); }
  }, []);

  const goTo = useCallback((i: number) => setActive(i), []);
  const prev = useCallback(() => setActive((p) => (p - 1 + total) % total), [total]);
  const next = useCallback(() => setActive((p) => (p + 1) % total), [total]);

  const cur = testimonialData[active];

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-16 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-brand-blue/[0.02] to-white" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Narrative label */}
        <div className="testimonials-label mb-8 flex items-center gap-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue">
            10 · {locale === 'vi' ? 'KHÁCH HÀNG' : 'CLIENTS'}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-brand-blue/30 to-transparent" />
        </div>

        <h2 className="testimonials-label font-display text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-slate-800">
          {t('testimonialTitle')}
        </h2>
        <p className="testimonials-label mt-3 max-w-2xl text-body-lg leading-relaxed text-slate-500">
          {t('testimonialLead')}
        </p>

        <div className="testimonials-content mt-12">
          <div ref={cardRef} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
            {/* Background watermark */}
            <Quote size={48} className="absolute right-6 top-6 text-brand-blue/[0.06]" />

            {/* Star rating */}
            <div className="mb-6 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} className="fill-brand-blue/30 text-brand-blue/30" />
              ))}
            </div>

            {/* Quote */}
            <p className="relative z-10 text-body-lg leading-relaxed text-slate-600 md:text-xl">
              &ldquo;{locale === 'vi' ? cur.quoteVi : cur.quoteEn}&rdquo;
            </p>

            {/* Metric */}
            <div
              className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white"
              style={{ backgroundColor: cur.metricColor }}
            >
              {locale === 'vi' ? cur.metricVi : cur.metricEn}
            </div>

            {/* Author */}
            <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-blue to-brand-cyan text-sm font-bold text-white shadow-md">
                {cur.author.charAt(0)}
              </div>
              <div>
                <p className="font-display text-base font-bold text-slate-800">{cur.author}</p>
                <p className="text-sm text-slate-500">
                  {locale === 'vi' ? cur.roleVi : cur.roleEn} — {cur.company}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button onClick={prev} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 transition-all duration-200 hover:border-brand-blue/30 hover:text-brand-blue" aria-label="Previous">
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {testimonialData.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-brand-blue' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button onClick={next} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 transition-all duration-200 hover:border-brand-blue/30 hover:text-brand-blue" aria-label="Next">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
