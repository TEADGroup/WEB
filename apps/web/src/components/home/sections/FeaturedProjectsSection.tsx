'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { Sparkles, Calendar, MapPin } from 'lucide-react';
import { useTimelineProjects } from '@/components/3d/timeline/TimelineData';

/* ─── Dynamic import R3F scene (client-only) ─── */
const TimelineScene = dynamic(
  () => import('@/components/3d/timeline/TimelineScene').then((m) => m.TimelineScene),
  { ssr: false, loading: () => null },
);

/* ─── Mobile 2D Timeline fallback ─── */
function MobileTimeline() {
  const locale = useLocale();
  const { projects } = useTimelineProjects();

  if (!projects.length) return null;

  return (
    <div className="flex flex-col gap-6 px-4">
      {projects.map((p) => {
        const monthLabel = p.featured_month
          ? new Date(2024, p.featured_month - 1).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' })
          : '';
        return (
          <div key={p.id} className="relative flex items-start gap-4 pl-8">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-brand-blue/30 to-transparent" />
            {/* Dot */}
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-brand-blue flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-brand-blue" />
            </div>
            {/* Content */}
            <div className="flex-1 rounded-2xl bg-white/70 backdrop-blur-sm p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue mb-1">
                {monthLabel && <span className="flex items-center gap-1"><Calendar size={10} />{monthLabel}</span>}
                <span>{p.featured_year}</span>
                {p.location && <span className="flex items-center gap-1"><MapPin size={10} />{p.location}</span>}
              </div>
              <h4 className="font-display text-sm font-bold text-slate-800">{p.title}</h4>
              {p.client && <p className="text-xs text-slate-400 mt-0.5">{p.client}</p>}
              {(locale === 'vi' ? p.scope_vi : p.scope_en) && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {locale === 'vi' ? p.scope_vi : p.scope_en}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export function FeaturedProjectsSection() {
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  /* Responsive check */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Entrance animation */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    try {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      });
      tl.fromTo(el.querySelectorAll('.featured-eyebrow, .featured-title, .featured-subtitle'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
      );
      return () => { tl.scrollTrigger?.kill(); tl.kill(); };
    } catch (e) {
      // Safe fallback if ScrollTrigger fails (e.g. loaded directly to #featured)
      el.querySelectorAll('.featured-eyebrow, .featured-title, .featured-subtitle').forEach(
        (el) => { (el as HTMLElement).style.opacity = '1'; (el as HTMLElement).style.transform = 'translateY(0)'; }
      );
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="featured"
      className="relative"
      style={{
        minHeight: '100dvh',
      }}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }} />

      {/* ═══ HEADER ═══ */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8 pt-20 md:pt-32 pb-8 text-center">
        <div className="featured-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/[0.05] px-5 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-brand-blue">
          <Sparkles size={12} />
          {locale === 'vi' ? 'DỰ ÁN TIÊU BIỂU' : 'FEATURED PROJECTS'}
        </div>
        <h2 className="featured-title font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.05] tracking-tight text-slate-900">
          {locale === 'vi' ? 'HÀNH TRÌNH CỦA CHÚNG TÔI' : 'OUR JOURNEY'}
        </h2>
        <p className="featured-subtitle mt-4 max-w-2xl mx-auto text-body-lg leading-relaxed text-slate-500">
          {locale === 'vi'
            ? 'Những dự án tiêu biểu đã triển khai — mỗi dấu mốc là một câu chuyện về sự tận tâm và chuyên nghiệp.'
            : 'Notable projects delivered — each milestone tells a story of dedication and expertise.'}
        </p>
      </div>

      {/* 2D Timeline — desktop only */}
      {!isMobile && (
        <div className="relative z-10 w-full pb-20">
          <TimelineScene />
        </div>
      )}

      {/* Mobile 2D timeline */}
      {isMobile && (
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
          <MobileTimeline />
        </div>
      )}
    </section>
  );
}
