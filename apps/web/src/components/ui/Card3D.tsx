'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

interface Card3DProps {
  children: ReactNode;
  glowColor?: string;
  className?: string;
}

/**
 * Card3D — Card với GSAP hover animation: glow border + lift + pulse.
 * Không dùng 3D tilt nữa.
 */
export function Card3D({
  children,
  glowColor = 'rgba(0,153,255,0.12)',
  className = '',
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const handleEnter = () => {
      gsap.to(card, { y: -3, scale: 1.01, duration: 0.35, ease: 'power2.out' });
      gsap.to(glow, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
    };
    const handleLeave = () => {
      gsap.to(card, { y: 0, scale: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(glow, { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.out' });
    };

    card.addEventListener('mouseenter', handleEnter);
    card.addEventListener('mouseleave', handleLeave);
    return () => {
      card.removeEventListener('mouseenter', handleEnter);
      card.removeEventListener('mouseleave', handleLeave);
    };
  }, { scope: cardRef });

  return (
    <div ref={cardRef} className={`relative ${className}`}>
      {/* Glow layer */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute -inset-2 rounded-3xl opacity-0"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
          scale: 0.95,
        }}
      />

      {/* Border highlight layer */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-slate-200/60 transition-all duration-300 hover:ring-brand-blue/30 group-hover:ring-brand-blue/30" />

      {/* Content */}
      <div className="relative rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm transition-shadow duration-300 hover:shadow-md">
        {children}
      </div>
    </div>
  );
}
