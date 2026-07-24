'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useTranslations, useLocale } from 'next-intl';
import { BarChart3, Target, Users, Cpu } from 'lucide-react';
import { PartnersUniverse } from '@/components/ui/PartnersUniverse';
import { statsData } from '../data';

/* ─── Animated counter ─── */
function AnimatedValue({ value, delay }: { value: string; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const num = parseInt(value.replace(/[^0-9]/g, ''));
    const suffix = value.replace(/[0-9]/g, '');
    if (isNaN(num)) { el.textContent = value; return; }

    const obj = { val: 0 };
    try {
      gsap.to(obj, {
        val: num,
        duration: 2.4,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; },
      });
    } catch (e) {
      // Fallback: set value directly if ScrollTrigger fails
      el.textContent = value;
    }
  }, [value, delay]);

  return <span ref={ref} className="font-display text-display-3 font-bold text-brand-blue">{value}</span>;
}

export function StatsSection() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    try {

    /* Counters — cinematic staggered entrance */
    const cards = el.querySelectorAll('.stats-card');
    if (cards.length) {
      gsap.fromTo(cards,
        { y: 50, opacity: 0, scale: 0.88 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.16, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: el, start: 'top 78%', once: true } },
      );
    }

    } catch (e) { console.warn('[StatsSection] GSAP animation skipped:', e); }
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-slate-50/40 to-white" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ═══ KINH NGHIỆM & THỰC NGHIỆM — TITLE LỚN, NỔI BẬT ═══ */}
        <div className="text-center mb-16">
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.05] tracking-tight text-slate-900">
            {locale === 'vi' ? 'KINH NGHIỆM & THỰC NGHIỆM' : 'EXPERIENCE & PROJECTS'}
          </h2>
          <p className="mt-3 text-body-lg text-slate-500 max-w-xl mx-auto">
            {locale === 'vi'
              ? 'Con số biết nói và những đối tác tin cậy'
              : 'Numbers that speak and trusted partners'}
          </p>
        </div>

        {/* ═══ COUNTERS — 4 cột ═══ */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 mb-16">
          {statsData.map((s, i) => {
            const Icon = s.Icon || BarChart3;
            return (
              <div
                key={s.value}
                className="stats-card group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-blue/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-brand-blue"><Icon size={24} /></span>
                  <AnimatedValue value={s.value} delay={i * 0.2} />
                </div>
                <span className="block text-sm font-bold uppercase tracking-wider text-slate-400">
                  {locale === 'vi' ? s.labelVi : s.labelEn}
                </span>
              </div>
            );
          })}
        </div>

        {/* ═══ ĐỐI TÁC — STARFIELD UNIVERSE ═══ */}
        </div>

        {/* PartnersUniverse full-width (ra khỏi max-w-7xl) */}
        <PartnersUniverse />

    </section>
  );
}
