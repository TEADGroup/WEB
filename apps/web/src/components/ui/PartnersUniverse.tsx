'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { useTranslations } from 'next-intl';

const PARTNER_LIST = [
  { name: 'Wipro', src: '/images/partners/wipro.png' },
  { name: 'SCC', src: '/images/partners/scc.png' },
  { name: 'Phú Lợi', src: '/images/partners/phu-loi.png' },
  { name: 'Vinacosmo', src: '/images/partners/vinacosmo.png' },
  { name: 'P&G', src: '/images/partners/p-g.png' },
  { name: 'Thiên Hương', src: '/images/partners/thien-huong.png' },
  { name: 'Acecook', src: '/images/partners/acecook.png' },
  { name: 'Chilica', src: '/images/partners/chilica.png' },
  { name: 'Daikin', src: '/images/partners/daikin.png' },
  { name: 'Omron', src: '/images/partners/omron.svg' },
];

export function PartnersUniverse() {
  const t = useTranslations('Home');
  const sectionRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  /* ── GSAP infinite marquee with 3D tunnel effect ── */
  useGSAP(() => {
    const row = rowRef.current;
    const section = sectionRef.current;
    if (!row || !section) return;

    const fullW = row.scrollWidth;
    const halfW = fullW / 2;
    if (halfW < 10) return;

    const items = Array.from(row.children) as HTMLElement[];
    const containerW = section.offsetWidth;

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'none' } });
    tl.fromTo(row, { x: -halfW }, {
      x: 0,
      duration: halfW / 60,
      onUpdate: () => {
        const currentX = gsap.getProperty(row, 'x') as number;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemCx = item.offsetLeft + currentX + item.offsetWidth / 2;
          const norm = gsap.utils.clamp(0, 1, itemCx / containerW);
          const dist = Math.abs(norm - 0.5) * 2; // 0=center, 1=edge

          // 3D tunnel: scaleX + scaleY (perspective shrink), rotateY for card-flip feel
          const s = gsap.utils.clamp(0.15, 1, 1 - dist * 0.85);
          const rotateY = (norm - 0.5) * 25; // -12.5deg left edge, +12.5deg right edge
          const o = gsap.utils.clamp(0.15, 1, 1 - dist * 0.85);

          item.style.transform = `perspective(1200px) scaleX(${s}) scaleY(${s}) rotateY(${rotateY}deg)`;
          item.style.opacity = `${o}`;
          item.style.zIndex = `${Math.round((1 - dist) * 100)}`;
        }
      },
    });

    const pause = () => tl.timeScale(0);
    const resume = () => tl.timeScale(1);
    section.addEventListener('mouseenter', pause);
    section.addEventListener('mouseleave', resume);

    return () => {
      tl.kill();
      section.removeEventListener('mouseenter', pause);
      section.removeEventListener('mouseleave', resume);
    };
  }, { scope: sectionRef });

  return (
    <div ref={sectionRef} className="w-full py-14 md:py-20">
      {/* ── Title ── */}
      <div className="text-center mb-12">
        <h2
          className="font-display text-[clamp(1.125rem,2.8vw,2rem)] font-black leading-[1.1] tracking-normal text-slate-900"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
        >
          {t('partnersEyebrow')}
        </h2>
      </div>

      {/* ── Marquee track ── */}
      <div className="overflow-hidden">
        <div
          ref={rowRef}
          className="flex items-center flex-nowrap w-max"
          style={{ gap: 0, perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
          {[...PARTNER_LIST, ...PARTNER_LIST].map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="flex-shrink-0 flex items-center"
              style={{
                width: 'clamp(340px, 60vw, 520px)',
                height: 'clamp(200px, 36vw, 300px)',
                transformOrigin: 'center center',
              }}
            >
              {/* Vertical line separator */}
              {i > 0 && (
                <div
                  className="flex-shrink-0 h-3/5"
                  style={{
                    width: '1px',
                    background: 'linear-gradient(to bottom, transparent, rgba(0,153,255,0.3), transparent)',
                  }}
                />
              )}
              <div className="flex-1 h-full flex items-center justify-center px-6 md:px-8">
                <img
                  src={p.src}
                  alt={p.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
