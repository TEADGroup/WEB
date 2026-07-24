'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useTranslations, useLocale } from 'next-intl';
import { Clock, Database, Wrench, Search, AlertTriangle, ArrowRight, ShieldAlert, Factory, ServerCog } from 'lucide-react';

const PAIN_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  clock: Clock,
  database: Database,
  settings: Wrench,
  search: Search,
};

const PAINT_COLORS = ['#DC2626', '#EA580C', '#2563EB', '#059669'];

export function PainPointsSection() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    try {
      /* ── Headline cinematic entrance ── */
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      });
      tl.fromTo(el.querySelector('.painpoints-eyebrow'),
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' },
      );
      tl.fromTo(el.querySelector('.painpoints-headline'),
        { y: 30, opacity: 0, rotateX: 10 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.65, ease: 'power3.out' },
        '-=0.25',
      );
      tl.fromTo(el.querySelector('.painpoints-lead'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
        '-=0.3',
      );

      /* ── Each card ── */
      el.querySelectorAll('.painpoints-card').forEach((card) => {
        const iconSide = card.querySelector('.painpoints-icon-side');
        const textSide = card.querySelector('.painpoints-text-side');

        if (iconSide) {
          gsap.fromTo(iconSide,
            { x: 60, opacity: 0, scale: 0.8, rotate: 8 },
            { x: 0, opacity: 1, scale: 1, rotate: 0, duration: 0.75, delay: 0.1, ease: 'back.out(1.5)',
              scrollTrigger: { trigger: card, start: 'top 80%', once: true } },
          );
        }
        if (textSide) {
          gsap.fromTo(textSide,
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.7, delay: 0.15, ease: 'power3.out',
              scrollTrigger: { trigger: card, start: 'top 80%', once: true } },
          );
        }
      });

      /* ── CTA fade up ── */
      gsap.fromTo(el.querySelector('.painpoints-cta-wrapper'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 72%', once: true } },
      );

      return () => {
        ScrollTrigger.getAll().forEach(st => st.kill());
      };
    } catch (e) { console.warn('[PainPointsSection] GSAP animation skipped:', e); }
  }, []);

  /* ── Pain data ── */
  const painPoints = [
    {
      key: 'pain1', icon: 'clock', color: PAINT_COLORS[0],
      title: locale === 'vi' ? 'DOWNTIME KÉO DÀI — TỔN THẤT LỚN' : 'EXTENDED DOWNTIME — MASSIVE LOSS',
      desc: locale === 'vi'
        ? 'Mỗi giờ ngừng sản xuất có thể khiến bạn thiệt hại hàng trăm triệu. Khi không có đội ngũ bảo trì kịp thời và hệ thống cảnh báo sớm, sự cố nhỏ nhanh chóng trở thành thảm họa.'
        : 'Every hour of production stoppage can cost you hundreds of millions in losses. Without a timely maintenance team and early warning systems, a small issue quickly becomes a disaster.',
      stat: locale === 'vi' ? 'Thiệt hại: ~50-200 triệu/giờ' : 'Loss: ~$2K-8K/hour',
    },
    {
      key: 'pain2', icon: 'database', color: PAINT_COLORS[1],
      title: locale === 'vi' ? 'DỮ LIỆU SẢN XUẤT PHÂN TÁN' : 'DISCONNECTED PRODUCTION DATA',
      desc: locale === 'vi'
        ? 'Số liệu sản xuất nằm rải rác giữa các bộ phận — không có cái nhìn tổng thể thời gian thực. Quyết định dựa trên cảm tính thay vì dữ liệu, dẫn đến lãng phí và kém hiệu quả.'
        : 'Production data scattered across departments — no real-time single source of truth. Decisions are gut-feel instead of data-driven, leading to waste and inefficiency.',
      stat: locale === 'vi' ? '60% dữ liệu không được sử dụng' : '60% of data goes unused',
    },
    {
      key: 'pain3', icon: 'settings', color: PAINT_COLORS[2],
      title: locale === 'vi' ? 'HỆ THỐNG CŨ — CẦN NÂNG CẤP' : 'LEGACY SYSTEMS — NEED UPGRADE',
      desc: locale === 'vi'
        ? 'Bạn muốn hiện đại hóa nhà máy nhưng lo ngại gián đoạn sản xuất, thời gian chết kéo dài và rủi ro kỹ thuật. Giải pháp tích hợp từng bước giúp chuyển đổi mượt mà, không dừng máy.'
        : 'You want to modernize your plant but worry about production disruption, extended downtime, and technical risks. Step-by-step integration ensures smooth transformation without stopping operations.',
      stat: locale === 'vi' ? 'Giảm 40% thời gian nâng cấp' : '40% faster upgrade time',
    },
    {
      key: 'pain4', icon: 'search', color: PAINT_COLORS[3],
      title: locale === 'vi' ? 'KIỂM SOÁT CHẤT LƯỢNG THỦ CÔNG' : 'MANUAL QUALITY CONTROL GAPS',
      desc: locale === 'vi'
        ? 'Kiểm tra thủ công dễ bỏ sót lỗi, tỉ lệ phế phẩm cao, khó truy xuất nguồn gốc. Hệ thống vision AI và cảm biến thông minh giúp phát hiện lỗi ngay lập tức trên dây chuyền.'
        : 'Manual inspection misses defects, high rejection rates, difficult traceability. Vision AI and smart sensors detect issues instantly on the production line.',
      stat: locale === 'vi' ? 'Tỉ lệ phát hiện lỗi: 99.5%' : 'Defect detection rate: 99.5%',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 md:py-32"
    >
      {/* Dark gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#eef3f8] via-white to-[#eef3f8]/60" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ══ Headline ══ */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          {/* Badge */}
          <div className="painpoints-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-red-200/60 bg-red-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-600 backdrop-blur-sm">
            <AlertTriangle size={12} />
            {locale === 'vi' ? 'THỰC TRẠNG NGÀNH' : 'INDUSTRY REALITY'}
          </div>

          {/* Headline */}
          <h2
            ref={titleRef}
            className="painpoints-headline font-display text-[clamp(1.8rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-slate-800"
          >
            {locale === 'vi' ? 'Nhà máy của bạn đang gặp phải vấn đề gì?' : 'What challenges is your plant facing?'}
          </h2>

          {/* Lead */}
          <p className="painpoints-lead mt-4 text-body-lg leading-relaxed text-slate-500 max-w-2xl mx-auto">
            {locale === 'vi'
              ? 'Những rào cản phổ biến trong sản xuất công nghiệp — và cách TEA Group giúp bạn vượt qua.'
              : 'Common roadblocks in industrial production — and how TEA Group helps you overcome them.'}
          </p>
        </div>

        {/* ══ Cards — alternating text/icon position sole nhau ══ */}
        <div className="flex flex-col gap-8 md:gap-10">
          {painPoints.map((p, i) => {
            const Icon = PAIN_ICONS[p.icon] || AlertTriangle;
            const isReversed = i % 2 === 1;
            const sideClass = isReversed ? 'md:flex-row-reverse' : 'md:flex-row';

            return (
              <div
                key={p.key}
                className="painpoints-card group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 transition-all duration-500 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Color accent — top edge */}
                <div
                  className="absolute inset-x-0 top-0 h-[3px] transition-all duration-500 group-hover:h-[4px]"
                  style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}66, transparent)` }}
                />

                <div className={`flex flex-col ${sideClass} items-stretch`}>
                  {/* Icon side — 40% width, bigger */}
                  <div className="painpoints-icon-side flex items-center justify-center p-10 md:p-14 md:w-[40%]" style={{ background: `linear-gradient(135deg, ${p.color}08, ${p.color}02)` }}>
                    <div
                      className="grid h-28 w-28 shrink-0 place-items-center rounded-3xl text-white shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"
                      style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)` }}
                    >
                      <Icon size={48} />
                    </div>
                  </div>

                  {/* Text side — 60% width */}
                  <div className="painpoints-text-side flex flex-col justify-center p-10 md:p-14 md:w-[60%]">
                    <h3 className="font-display text-heading-2 font-bold text-slate-800 mb-3">
                      {p.title}
                    </h3>
                    <p className="text-body-sm leading-relaxed text-slate-500 mb-5">
                      {p.desc}
                    </p>
                    <div>
                      <div
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.stat}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ══ CTA ══ */}
        <div className="painpoints-cta-wrapper mt-14 text-center">
          <a
            href="#solutions"
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan px-8 py-4 text-body font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-brand-blue/30"
          >
            {locale === 'vi' ? 'Xem giải pháp của TEA Group' : 'Explore TEA Group solutions'}
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
