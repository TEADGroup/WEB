'use client';

import { useRef, useEffect, useState } from 'react';
import type { ProjectNode2D, YearMarker2D } from './TimelineData';

interface TimelinePathSVGProps {
  nodes: ProjectNode2D[];
  years: YearMarker2D[];
  pathD: string;
  totalWidth: number;
  totalHeight: number;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

const BRAND_BLUE = '#0099FF';
const BRAND_GREEN = '#00A651';
const BRAND_BLUE_LIGHT = '#33B5FF';
const BRAND_RED = '#FF3333';

/**
 * TimelinePathSVG — premium 3D multi-layer horizontal S-curve path.
 *
 * 7 stacked strokes for cinematic depth:
 *   deep shadow → ambient glow → tube body → core gradient → rim light → edge highlight → sparkle layer
 *
 * Year badges float above with 3D layering and animated beam glow.
 * Path dots pulse continuously for a "living" energy feel.
 */
export function TimelinePathSVG({
  nodes,
  years,
  pathD,
  totalWidth,
  totalHeight,
  hoveredId,
  onHover,
}: TimelinePathSVGProps) {
  const [pulseT, setPulseT] = useState(0);

  // ─── Continuous pulse animation ───
  useEffect(() => {
    let frame: number;
    let start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      setPulseT(Math.sin(elapsed * 1.2) * 0.5 + 0.5); // smooth 0→1 oscillation
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  /* ─── Glass Tube Neon — 9 lớp blur 3D ───
   *
   *  Cấu trúc (từ ngoài vào trong) — mỗi lớp có blur tăng depth:
   *  ① Neon outer glow     — phát sáng xanh, blur mạnh nhất (sigma 28)
   *  ② Neon medium glow    — blur trung bình (sigma 20)
   *  ③ Glass shell         — vỏ ống thủy tinh, blur nhẹ (sigma 6)
   *  ④ Border rim          — viền ống, blur nhẹ (sigma 3)
   *  ⑤ Inner glow          — phát sáng lòng ống (sigma 10)
   *  ⑥ Core gradient       — lõi màu (no blur)
   *  ⑦ Center bright       — lõi sáng (sigma 2)
   *  ⑧ Rim highlight       — phản xạ đỉnh (no blur)
   *  ⑨ Sparkle edge        — lấp lánh (no blur)
   */
  const LAYERS = [
    { stroke: '#0099FF', width: 90, opacity: 0.08 + pulseT * 0.035, blur: 28, yOff: 0 },
    { stroke: '#33D4FF', width: 68, opacity: 0.04 + pulseT * 0.025, blur: 22, yOff: 0 },
    { stroke: 'rgba(255,255,255,0.04)', width: 52, opacity: 0.3, blur: 6, yOff: 0 },
    { stroke: 'url(#tubeBorderGradient)', width: 48, opacity: 0.18, blur: 3, yOff: 0 },
    { stroke: '#66CCFF', width: 38, opacity: 0.05 + pulseT * 0.035, blur: 12, yOff: 0 },
    { stroke: 'url(#pathGradient)', width: 22, opacity: 1, blur: 0, yOff: 0 },
    { stroke: '#FFFFFF', width: 8, opacity: 0.2, blur: 2, yOff: 0 },
    { stroke: '#FFFFFF', width: 2.5, opacity: 0.08 + pulseT * 0.06, blur: 0, yOff: -5 },
    { stroke: 'url(#sparkleGradient)', width: 2.5, opacity: 0.1 + pulseT * 0.12, blur: 0, yOff: 3 },
  ] as const;

  if (!nodes.length || !pathD) return null;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="block w-full"
      style={{ height: 'auto', maxHeight: 'none' }}
      preserveAspectRatio="xMidYMin meet"
    >
      <defs>
        {/* ─── Tube border gradient (glass rim) ─── */}
        <linearGradient id="tubeBorderGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={BRAND_RED} stopOpacity={0.2} />
          <stop offset="25%"  stopColor={BRAND_BLUE_LIGHT} stopOpacity={0.35} />
          <stop offset="50%"  stopColor="#66CCFF" stopOpacity={0.4} />
          <stop offset="75%"  stopColor={BRAND_BLUE} stopOpacity={0.35} />
          <stop offset="100%" stopColor={BRAND_GREEN} stopOpacity={0.2} />
        </linearGradient>

        {/* ─── Year badge gradient — trắng → xám nhạt ─── */}
        <linearGradient id="yearBadgeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8ECF0" />
        </linearGradient>

        {/* ─── Year badge border — xám nhạt ─── */}
        <linearGradient id="yearBadgeGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#D0D5DD" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#98A2B3" stopOpacity={0.4} />
        </linearGradient>

        {/* ─── Core path gradient: red → blue → green — VIBRANT ─── */}
        <linearGradient id="pathGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#FF4444" stopOpacity={0.1} />
          <stop offset="10%"  stopColor="#FF4444" stopOpacity={0.8} />
          <stop offset="22%"  stopColor="#FF6644" stopOpacity={1} />
          <stop offset="35%"  stopColor="#33B5FF" stopOpacity={1} />
          <stop offset="45%"  stopColor="#0099FF" stopOpacity={1} />
          <stop offset="55%"  stopColor="#33D4FF" stopOpacity={1} />
          <stop offset="65%"  stopColor="#0099FF" stopOpacity={1} />
          <stop offset="78%"  stopColor="#00CC77" stopOpacity={1} />
          <stop offset="90%"  stopColor="#00A651" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#00A651" stopOpacity={0.1} />
        </linearGradient>

        {/* ─── Sparkle highlight ─── */}
        <linearGradient id="sparkleGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="30%"  stopColor="#FFFFFF" stopOpacity={0.4} />
          <stop offset="50%"  stopColor="#FFFFFF" stopOpacity={0.6} />
          <stop offset="70%"  stopColor="#FFFFFF" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>

        {/* ─── Year badge gradient: red → blue → green ─── */}
        <linearGradient id="yearGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FF5555" />
          <stop offset="35%"  stopColor={BRAND_BLUE} />
          <stop offset="65%"  stopColor={BRAND_BLUE_LIGHT} />
          <stop offset="100%" stopColor={BRAND_GREEN} />
        </linearGradient>

        <linearGradient id="yearGlowGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FF5555" stopOpacity={0.9} />
          <stop offset="35%"  stopColor={BRAND_BLUE} stopOpacity={0.9} />
          <stop offset="65%"  stopColor={BRAND_BLUE_LIGHT} stopOpacity={0.9} />
          <stop offset="100%" stopColor={BRAND_GREEN} stopOpacity={0.9} />
        </linearGradient>

        <filter id="depthBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
        </filter>

        <filter id="blurLight" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>

        <filter id="blurMedium" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>

        <filter id="blurStrong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" />
        </filter>

        <filter id="blurMax" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="28" />
        </filter>

        <filter id="yearBeamGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="yearShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#98A2B3" floodOpacity={0.3} />
        </filter>

        <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="nodeShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor={BRAND_BLUE} floodOpacity={0.4} />
        </filter>

        <filter id="beamGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>

        <filter id="dotPulse" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur">
            <feFuncA type="table" tableValues="0 0.5 0.3 1 0.5" />
          </feComponentTransfer>
        </filter>
      </defs>

      {/* ═══════════════════════════════════════════════
          1. 3D PATH — 7 stacked strokes (always fully visible)
          ═══════════════════════════════════════════════ */}
      {LAYERS.map((layer, idx) => {
        // Map blur value to correct filter
        let blurFilter: string | undefined;
        if (layer.blur >= 20) blurFilter = 'url(#blurMax)';
        else if (layer.blur >= 10) blurFilter = 'url(#blurStrong)';
        else if (layer.blur >= 5) blurFilter = 'url(#blurMedium)';
        else if (layer.blur > 0) blurFilter = 'url(#blurLight)';
        else blurFilter = undefined;

        return (
          <path
            key={`layer-${idx}`}
            d={pathD}
            fill="none"
            stroke={layer.stroke}
            strokeWidth={layer.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={typeof layer.opacity === 'number' ? layer.opacity : 1}
            filter={blurFilter}
            transform={layer.yOff ? `translate(0, ${layer.yOff})` : undefined}
          />
        );
      })}

      {/* Animated sparkle dots traveling along the glass tube */}
      <path
        d={pathD}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="3 240"
        strokeDashoffset={-pulseT * 300}
        opacity={0.2 + pulseT * 0.15}
        filter="url(#dotPulse)"
      />

      {/* ═══════════════════════════════════════════════
          2. YEAR MARKERS — floating 3D badges with animated beam
          ═══════════════════════════════════════════════ */}
      {years.map((ym) => {
        const beamOpacity = 0.2 + pulseT * 0.2;

        return (
          <g key={`year-${ym.year}`}>
            {/* Beam: gray dashed line */}
            <line
              x1={ym.x} y1={ym.y + 40}
              x2={ym.x} y2={ym.curveAnchorY}
              stroke="#98A2B3"
              strokeWidth={1.2}
              opacity={beamOpacity * 0.4}
              strokeDasharray="3 8"
            />

            {/* 3D Year Badge — trắng/xám + chữ đen */}
            <g filter="url(#yearShadow)">
              {/* Outer glow ring */}
              <rect
                x={ym.x - 62} y={ym.y - 31}
                width={124} height={62} rx={31}
                fill="none" stroke="url(#yearBadgeGlow)" strokeWidth={2.5}
                opacity={0.4} filter="url(#yearBeamGlow)"
              />
              {/* 3D depth layers */}
              <rect x={ym.x - 60} y={ym.y - 29} width={120} height={58} rx={29}
                fill="#E8ECF0" opacity={0.5} transform="translate(0, 3)"
              />
              <rect x={ym.x - 59} y={ym.y - 28} width={118} height={56} rx={28}
                fill="#F2F4F7" opacity={0.7} transform="translate(0, 1.5)"
              />
              {/* Badge body — trắng */}
              <rect x={ym.x - 58} y={ym.y - 27} width={116} height={54} rx={27}
                fill="url(#yearBadgeGradient)" opacity={0.95}
              />
              {/* Inner shadow top */}
              <rect x={ym.x - 58} y={ym.y - 27} width={116} height={27} rx={27}
                fill="rgba(0,0,0,0.03)"
              />
              {/* Border */}
              <rect x={ym.x - 58} y={ym.y - 27} width={116} height={54} rx={27}
                fill="none" stroke="#D0D5DD" strokeWidth={0.8} opacity={0.6}
              />
              {/* Year text — đen */}
              <text
                x={ym.x} y={ym.y}
                textAnchor="middle" dominantBaseline="central"
                fill="#1D2939" fontSize={22} fontWeight={800}
                fontFamily="inherit" letterSpacing="0.15em"
              >
                {ym.year}
              </text>
            </g>
          </g>
        );
      })}

      {/* ═══════════════════════════════════════════════
          3. NODE DOTS + CONNECTORS (with hover + pulse)
          ═══════════════════════════════════════════════ */}
      {nodes.map((node) => {
        const isHovered = hoveredId === node.project.id;
        const cardEdgeY = node.side === 'top' ? node.cardY + 130 : node.cardY;
        const connectorColor = isHovered ? '#FF6644' : '#FF8844';
        const connectorOpacity = isHovered ? 0.7 : 0.25 + pulseT * 0.15;

        return (
          <g key={`group-${node.project.id}`}>
            {/* Connector line — dày, màu cam tương phản */}
            <line
              x1={node.x} y1={node.y}
              x2={node.x} y2={cardEdgeY}
              stroke={connectorColor}
              strokeWidth={isHovered ? 3 : 2}
              strokeLinecap="round"
              opacity={connectorOpacity}
              className="transition-all duration-300"
            />

            {/* Connector glow line */}
            <line
              x1={node.x} y1={node.y}
              x2={node.x} y2={cardEdgeY}
              stroke={connectorColor}
              strokeWidth={isHovered ? 8 : 6}
              strokeLinecap="round"
              opacity={connectorOpacity * 0.15}
              filter="url(#beamGlow)"
              className="transition-all duration-300"
            />

            {/* Hover glow ring */}
            {(isHovered || true) && (
              <circle
                cx={node.x} cy={node.y} r={isHovered ? 22 : 14 + pulseT * 4}
                fill="none"
                stroke={BRAND_BLUE_LIGHT}
                strokeWidth={isHovered ? 2.5 : 1}
                opacity={isHovered ? 0.3 : 0.06 + pulseT * 0.06}
                filter="url(#nodeGlow)"
                className="transition-all duration-300"
              />
            )}

            {/* Outer circle */}
            <circle
              cx={node.x} cy={node.y} r={isHovered ? 11 : 9}
              fill={isHovered ? '#FFFFFF' : '#F0F8FF'}
              stroke={isHovered ? BRAND_BLUE_LIGHT : BRAND_BLUE}
              strokeWidth={isHovered ? 3 : 2.5}
              filter="url(#nodeShadow)"
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => onHover(node.project.id)}
              onMouseLeave={() => onHover(null)}
              style={{ cursor: 'pointer' }}
            />

            {/* Inner pulsing dot */}
            <circle
              cx={node.x} cy={node.y}
              r={isHovered ? 5 : 3 + pulseT * 1.2}
              fill={isHovered ? BRAND_BLUE_LIGHT : BRAND_BLUE}
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => onHover(node.project.id)}
              onMouseLeave={() => onHover(null)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        );
      })}
    </svg>
  );
}
