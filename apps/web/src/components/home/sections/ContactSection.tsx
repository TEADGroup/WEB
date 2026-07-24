'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useTranslations } from 'next-intl';
import { Cog } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { ContactForm } from '@/components/layout/ContactForm';
import { MAP_SRC } from '../data';

function BgGear({ size, color, top, left, speed }: { size: number; color: string; top: string; left: string; speed: number }) {
  return (
    <div className="absolute pointer-events-none" style={{ top, left, width: size, height: size }}>
      <Cog size={size} className="animate-[spin_var(--gear-speed)_linear_infinite]"
        style={{ color, opacity: 0.04, ['--gear-speed' as string]: `${speed}s` } as React.CSSProperties} />
    </div>
  );
}

export function ContactSection() {
  const contactT = useTranslations('Contact');
  const footerT = useTranslations('Footer');
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    try {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 78%', once: true }, defaults: { ease: 'power3.out' } });
      tl.fromTo(el.querySelector('.contact-form-wrapper'), { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55 })
        .fromTo(el.querySelector('.contact-info-wrapper'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
        .fromTo(el.querySelector('.contact-map'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.15');
    } catch (e) { console.warn('[ContactSection] GSAP animation skipped:', e); }
  }, []);

  return (
    <section ref={sectionRef} id="contact" className="relative py-14 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/30 to-white pointer-events-none" />
      <BgGear size={100} color="#0099FF" top="5%" left="2%" speed={32} />
      <BgGear size={70} color="#00A651" top="18%" left="94%" speed={24} />
      <BgGear size={55} color="#FF3333" top="75%" left="96%" speed={20} />
      <BgGear size={85} color="#33B5FF" top="80%" left="3%" speed={28} />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <PageHeader eyebrow={contactT('eyebrow')} title={contactT('title')} subtitle={contactT('subtitle')} />

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="contact-form-wrapper"><ContactForm /></div>
          <div className="space-y-5">
            <div className="contact-info-wrapper rounded-card bg-white/70 p-6 shadow-sm ring-1 ring-slate-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <p className="text-label uppercase text-brand-blue">{contactT('addressLabel')}</p>
              <p className="mt-2 text-body text-slate-500">{footerT('address')}</p>
            </div>
            <iframe title="TEA Co., Ltd — map" src={MAP_SRC} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              className="contact-map h-72 w-full rounded-card shadow-sm ring-1 ring-slate-200/40 transition-all duration-300 hover:shadow-md" />
          </div>
        </div>
      </div>
    </section>
  );
}
