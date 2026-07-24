'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { Cog, CircuitBoard, Cpu, Wrench, HardDrive, ArrowRight, Award, Headphones, FileCheck, Settings2 } from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   SOLUTIONS — ANIMATION-FIRST DESIGN
   - Each card: cinematic entrance with split timing
   - Text readable: strong dark overlay + bold colors
   - Interactive parallax depth on scroll
   ══════════════════════════════════════════════════════════ */

interface ServiceData {
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  video: string;
  vi: string;
  en: string;
  descVi: string;
  descEn: string;
  subsVi: string[];
  subsEn: string[];
  values: { Icon: React.ComponentType<{ size?: number }>; vi: string; en: string; color: string }[];
}

const SERVICES: ServiceData[] = [
  {
    icon: Cog,
    color: '#0099FF',
    video: '/videos/machinery-closeup.mp4',
    vi: 'THIẾT KẾ & CHẾ TẠO TỦ ĐIỆN ĐIỀU KHIỂN',
    en: 'CONTROL CABINET DESIGN & FABRICATION',
    descVi: 'Tủ phân phối, MCC, PLC/DCS, phòng sạch & ATEX — thiết kế theo tiêu chuẩn IEC quốc tế, vật tư chính hãng CO/CQ đầy đủ.',
    descEn: 'Distribution, MCC, PLC/DCS, clean-room & ATEX — IEC-compliant design with genuine materials and full CO/CQ documentation.',
    subsVi: ['Tủ phân phối & chiếu sáng', 'Tủ điều khiển trung tâm (MCC)', 'Tủ PLC / DCS / điều khiển máy', 'Tủ phòng sạch & ATEX'],
    subsEn: ['Distribution & lighting panels', 'Motor Control Centers (MCC)', 'PLC / DCS / machine control', 'Clean-room & ATEX panels'],
    values: [
      { Icon: FileCheck, vi: 'Chuẩn IEC quốc tế', en: 'International IEC standards', color: '#0099FF' },
      { Icon: Award, vi: 'CO/CQ đầy đủ', en: 'Full CO/CQ certified', color: '#33B5FF' },
    ],
  },
  {
    icon: CircuitBoard,
    color: '#00A651',
    video: '/videos/automation-line.mp4',
    vi: 'LẬP TRÌNH PLC / SCADA',
    en: 'PLC / SCADA PROGRAMMING',
    descVi: 'Siemens, Mitsubishi, Schneider — SCADA/HMI giám sát tập trung & DCS. Đội ngũ kỹ sư được chứng nhận quốc tế.',
    descEn: 'Siemens, Mitsubishi, Schneider — SCADA/HMI supervision & DCS systems. Internationally certified engineering team.',
    subsVi: ['Siemens / Mitsubishi / Schneider', 'SCADA / HMI giám sát tập trung', 'Hệ thống DCS & điều khiển phân tán', 'Cảm biến & đo lường công nghiệp'],
    subsEn: ['Siemens / Mitsubishi / Schneider', 'SCADA / HMI central supervision', 'DCS & distributed control', 'Industrial sensors & instrumentation'],
    values: [
      { Icon: Award, vi: 'Kỹ sư được chứng nhận', en: 'Certified engineers', color: '#00A651' },
      { Icon: Settings2, vi: 'Giải pháp tùy chỉnh', en: 'Custom solutions', color: '#33CC80' },
    ],
  },
  {
    icon: Cpu,
    color: '#0099FF',
    video: '/videos/solar-production.mp4',
    vi: 'TÍCH HỢP HỆ THỐNG TỰ ĐỘNG',
    en: 'AUTOMATION SYSTEM INTEGRATION',
    descVi: 'Profinet, Modbus, EtherNet/IP — IoT công nghiệp & tích hợp MES/ERP. Kết nối chuẩn hóa end-to-end.',
    descEn: 'Profinet, Modbus, EtherNet/IP — industrial IoT & MES/ERP integration. Standardized end-to-end connectivity.',
    subsVi: ['Profinet, Modbus, EtherNet/IP', 'IoT công nghiệp & thu thập dữ liệu', 'Tích hợp MES / ERP nhà máy', 'Truyền thông không dây & từ xa'],
    subsEn: ['Profinet, Modbus, EtherNet/IP', 'Industrial IoT & data acquisition', 'MES / ERP plant integration', 'Wireless & remote communication'],
    values: [
      { Icon: Settings2, vi: 'Tích hợp end-to-end', en: 'End-to-end integration', color: '#0099FF' },
      { Icon: Headphones, vi: 'Hỗ trợ từ xa 24/7', en: '24/7 remote support', color: '#33B5FF' },
    ],
  },
  {
    icon: HardDrive,
    color: '#FF3333',
    video: '/videos/conveyor-system.mp4',
    vi: 'TỰ ĐỘNG HOÁ DÂY CHUYỀN',
    en: 'PRODUCTION LINE AUTOMATION',
    descVi: 'Robot, vision, băng tải, đóng gói — tự động hóa toàn bộ dây chuyền. Giảm downtime, tăng OEE.',
    descEn: 'Robotics, vision, conveyors, packaging — full line automation. Reduce downtime, increase OEE.',
    subsVi: ['Robot hóa công đoạn sản xuất', 'Băng tải & hệ thống phân loại', 'Kiểm tra chất lượng bằng vision', 'Đóng gói & pallet hóa tự động'],
    subsEn: ['Robotic process automation', 'Conveyor & sorting systems', 'Vision inspection & quality control', 'Automated packaging & palletizing'],
    values: [
      { Icon: Award, vi: 'Kinh nghiệm thực chiến', en: 'Battle-tested experience', color: '#FF3333' },
      { Icon: FileCheck, vi: 'Kiểm thử 3 cấp độ', en: '3-level rigorous testing', color: '#FF6666' },
    ],
  },
  {
    icon: Wrench,
    color: '#33B5FF',
    video: '/videos/hero-factory.mp4',
    vi: 'BẢO TRÌ, HIỆU CHUẨN & HỖ TRỢ KỸ THUẬT',
    en: 'MAINTENANCE, CALIBRATION & SUPPORT',
    descVi: 'Bảo trì dự phòng, hiệu chuẩn, hỗ trợ 24/7 — dịch vụ turn-key trọn gói. Cam kết phản hồi dưới 4 giờ.',
    descEn: 'Preventive maintenance, calibration, 24/7 support — turn-key services. Guaranteed response time under 4 hours.',
    subsVi: ['Bảo trì dự phòng & sửa chữa', 'Hiệu chuẩn thiết bị đo lường', 'Hỗ trợ kỹ thuật từ xa 24/7', 'Dịch vụ turn-key cho nhà máy mới'],
    subsEn: ['Preventive maintenance & repair', 'Instrument calibration', 'Remote technical support 24/7', 'Turn-key service for new plants'],
    values: [
      { Icon: Headphones, vi: 'Phản hồi dưới 4 giờ', en: '<4hr response time', color: '#33B5FF' },
      { Icon: Award, vi: 'Bảo hành 12-24 tháng', en: '12-24 month warranty', color: '#0099FF' },
    ],
  },
];

/* ── Intersection observer for lazy video load ── */
function useLazyVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Solitary card animation hook — cinematic reveal per card ── */
function useCardAnimation(cardRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    try {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: card, start: 'top 78%', once: true },
      });

      /* Number — drops from above with overshoot */
      tl.fromTo(card.querySelector('.solutions-card-num'), { y: -80, opacity: 0, scale: 1.4 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.7)' }, 0);

      /* Icon box — spins in */
      tl.fromTo(card.querySelector('.solutions-card-icon-box'), { rotate: -45, scale: 0, opacity: 0 },
        { rotate: 0, scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(2)' }, 0.1);

      /* Title — slides up */
      tl.fromTo(card.querySelector('.solutions-card-title'), { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.25);

      /* Description */
      tl.fromTo(card.querySelector('.solutions-card-desc'), { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.4);

      /* Subs — staggered from left */
      tl.fromTo(card.querySelectorAll('.solutions-card-sub'), { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, 0.5);

      /* Value badges — pop in from 0 scale */
      tl.fromTo(card.querySelectorAll('.solutions-card-badge'), { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, stagger: 0.1, ease: 'back.out(1.8)' }, 0.6);

      /* CTA — slide up */
      tl.fromTo(card.querySelector('.solutions-card-cta'), { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0.7);

      /* Accent side — slide from opposite direction based on card index */
      const isOdd = Number(card.dataset.idx || 0) % 2 === 1;
      const accentStartX = isOdd ? -80 : 80;
      tl.fromTo(card.querySelector('.solutions-card-accent'), { x: accentStartX, opacity: 0, scale: 0.7 },
        { x: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power4.out' }, 0.35);
    } catch (e) { console.warn('[SolutionsSection] Card animation skipped:', e); }
  }, [cardRef]);
}

/* ── Video layer — lazy load + stronger overlay for readability ── */
function CardVideo({ src, poster }: { src: string; poster: string }) {
  const { ref, visible } = useLazyVideo();
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {visible && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={poster}
          autoPlay muted loop playsInline
          preload="none"
        />
      )}
      {/* STRONG overlay — ensures text is crisp & readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export function SolutionsSection() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);

  /* Section header animation */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    try {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      });

      tl.fromTo(el.querySelector('.solutions-eyebrow'), { y: 24, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });

      /* BIG title — characters stagger */
      tl.fromTo(el.querySelectorAll('.solutions-title-char'), { y: 100, opacity: 0, rotateX: -40 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.7, stagger: 0.04, ease: 'back.out(1.4)' }, 0.15);

      tl.fromTo(el.querySelector('.solutions-subtitle'), { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.5);
    } catch (e) { console.warn('[SolutionsSection] Header animation skipped:', e); }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="solutions"
      className="relative w-screen overflow-hidden bg-white"
      style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}
    >
      {/* ═══ SECTION HEADER ═══ */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 md:pt-40 pb-12 md:pb-20">
        <div className="flex flex-col items-center text-center gap-4">
          <span className="solutions-eyebrow inline-block rounded-full border-2 border-brand-blue/30 bg-brand-blue/[0.08] px-6 py-2 font-display text-xs font-bold uppercase tracking-[0.35em] text-brand-blue">
            {t('solutionsEyebrow')}
          </span>

          {/* Animated character-level BIG title */}
          <h2 className="font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-tight text-slate-900 uppercase" aria-label={locale === 'vi' ? 'GIẢI PHÁP' : 'SOLUTIONS'}>
            {(locale === 'vi' ? 'GIẢI PHÁP' : 'SOLUTIONS').split('').map((ch, i) => (
              <span key={i} className="solutions-title-char inline-block">{ch === ' ' ? ' ' : ch}</span>
            ))}
          </h2>

          <p className="solutions-subtitle max-w-xl text-body-lg leading-relaxed text-slate-600 font-medium">
            {t('solutionsSubtitle')}
          </p>
        </div>
      </div>

      {/* ═══ SOLUTION CARDS ═══ */}
      {SERVICES.map((svc, i) => {
        const localeTitle = locale === 'vi' ? svc.vi : svc.en;
        const localeDesc = locale === 'vi' ? svc.descVi : svc.descEn;
        const subs = locale === 'vi' ? svc.subsVi : svc.subsEn;
        const posterSrc = svc.video.replace('.mp4', '-poster.jpg');

        return (
          <SolutionCard
            key={svc.en}
            svc={svc}
            localeTitle={localeTitle}
            localeDesc={localeDesc}
            subs={subs}
            posterSrc={posterSrc}
            index={i}
            locale={locale}
          />
        );
      })}
    </section>
  );
}

/* ════════════════ INDIVIDUAL SOLUTION CARD ════════════════ */

function SolutionCard({
  svc, localeTitle, localeDesc, subs, posterSrc, index, locale,
}: {
  svc: ServiceData;
  localeTitle: string;
  localeDesc: string;
  subs: string[];
  posterSrc: string;
  index: number;
  locale: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  useCardAnimation(cardRef);

  return (
    <div
      ref={cardRef}
      className="sol-card relative w-full overflow-hidden"
      data-idx={index}
      style={{ minHeight: 'min(100vh, 900px)', paddingTop: '1px', paddingBottom: '1px' }}
    >
      {/* Soft white top gap — breathable separation */}
      <div className="absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none" aria-hidden="true" />
      {/* Soft white bottom gap */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" aria-hidden="true" />

      {/* Video background */}
      <CardVideo src={svc.video} poster={posterSrc} />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8 md:py-24">
        <div className={`flex w-full flex-col gap-12 md:flex-row md:items-center md:gap-16 lg:gap-24 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>

          {/* === TEXT SIDE === */}
          <div className="flex w-full flex-col gap-5 md:w-1/2">

            {/* Number */}
            <span className="solutions-card-num font-mono text-[5rem] font-black leading-none text-slate-200 select-none md:text-[7rem]" aria-hidden>
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* Icon + Title row */}
            <div className="flex items-center gap-5">
              <div
                className="solutions-card-icon-box grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, ${svc.color}, ${svc.color}dd)` }}
              >
                <svc.icon size={32} />
              </div>
              <h3 className="solutions-card-title font-display text-[clamp(1.6rem,3.5vw,2.8rem)] font-extrabold leading-[1.1] tracking-tight text-slate-900">
                {localeTitle}
              </h3>
            </div>

            {/* Description */}
            <p className="solutions-card-desc max-w-xl text-lg leading-relaxed text-slate-800 font-medium">
              {localeDesc}
            </p>

            {/* Sub-services */}
            <ul className="flex flex-col gap-3">
              {subs.map((sub, j) => (
                <li key={j} className="solutions-card-sub flex items-center gap-4 text-base font-semibold text-slate-900">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white text-xs font-bold"
                    style={{ background: svc.color }}
                  >
                    ✓
                  </span>
                  {sub}
                </li>
              ))}
            </ul>

            {/* Value badges */}
            <div className="mt-2 flex flex-wrap gap-3">
              {svc.values.map((val, vi) => (
                <span
                  key={vi}
                  className="solutions-card-badge inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold uppercase tracking-wide shadow-sm"
                  style={{ color: val.color, background: `${val.color}15`, border: `1.5px solid ${val.color}35` }}
                >
                  <val.Icon size={15} />
                  {locale === 'vi' ? val.vi : val.en}
                </span>
              ))}
            </div>

            {/* CTA */}
            <a
              href="#contact"
              className="solutions-card-cta group mt-4 inline-flex items-center gap-3 self-start rounded-full px-8 py-4 text-base font-extrabold tracking-wide text-white shadow-2xl transition-all duration-300 hover:scale-[1.04] hover:shadow-3xl"
              style={{ background: `linear-gradient(135deg, ${svc.color}, ${svc.color}dd)` }}
            >
              <span>{locale === 'vi' ? 'LIÊN HỆ TƯ VẤN' : 'GET A CONSULTATION'}</span>
              <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </a>
          </div>

          {/* === ACCENT SIDE === */}
          <div className="solutions-card-accent hidden w-full md:flex md:w-1/2 items-center justify-center" aria-hidden="true">
            <div className="relative w-full max-w-[380px] aspect-square">
              {/* Outer pulsing ring */}
              <div
                className="absolute inset-0 rounded-full animate-pulse-soft"
                style={{ background: `radial-gradient(circle, ${svc.color}18 0%, ${svc.color}05 60%, transparent 70%)` }}
              />
              {/* Ring layers */}
              {[0, 1, 2].map((r) => (
                <div
                  key={r}
                  className="absolute rounded-full"
                  style={{
                    inset: `${8 + r * 14}%`,
                    border: `2px solid ${svc.color}${30 - r * 10}`,
                    opacity: 0.5 - r * 0.15,
                  }}
                />
              ))}
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="grid h-24 w-24 place-items-center rounded-3xl text-white shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${svc.color}, ${svc.color}cc)` }}
                >
                  <svc.icon size={48} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
