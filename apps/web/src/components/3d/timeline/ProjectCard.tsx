'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Calendar, MapPin, ArrowUpRight } from 'lucide-react';
import type { FeaturedProject } from './TimelineData';

interface ProjectCardProps {
  project: FeaturedProject;
  side: 'top' | 'bottom';
}

/**
 * ProjectCard — 3D glass card with hover depth animation.
 *
 * Design principles (per UI/UX Pro Max):
 * - Glassmorphism surface with backdrop blur
 * - Subtle 3D lift on hover (translateZ illusion via shadow + scale)
 * - Logo/image displayed in a consistent 4:3 container with gradient overlay
 * - Micro-animations on interactive elements
 */
export function ProjectCard({ project, side }: ProjectCardProps) {
  const locale = useLocale();
  const [isHovered, setIsHovered] = useState(false);

  const monthLabel = project.featured_month
    ? new Date(2024, project.featured_month - 1).toLocaleString(
        locale === 'vi' ? 'vi-VN' : 'en-US',
        { month: 'short' },
      )
    : '';

  const scope = locale === 'vi'
    ? (project.scope_vi || project.description_vi)
    : (project.scope_en || project.description_en);

  // Thumbnail image URL (fallback chain)
  const thumbUrl = project.images?.[0]?.url || project.company_logo_url || '';

  // Hover 3D transform: lift up, scale slightly, deepen shadow
  const hoverStyle = isHovered
    ? {
        transform: `translateY(${side === 'top' ? -6 : 6}px) scale(1.02)`,
        boxShadow: `
          0 12px 40px rgba(0, 153, 255, 0.15),
          0 4px 12px rgba(0, 153, 255, 0.10),
          0 0 0 1px rgba(0, 153, 255, 0.12)
        `,
      }
    : {
        transform: 'translateY(0px) scale(1)',
        boxShadow: `
          0 4px 20px rgba(0, 0, 0, 0.06),
          0 1px 4px rgba(0, 0, 0, 0.04)
        `,
      };

  return (
    <div
      className="group relative w-full overflow-hidden rounded-2xl border border-white/20
                  bg-white/70 backdrop-blur-xl
                  dark:border-slate-700/30 dark:bg-slate-800/40 dark:backdrop-blur-xl"
      style={{
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        ...hoverStyle,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ─── 3D edge glow overlay (shows on hover) ─── */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: 'linear-gradient(135deg, rgba(0,153,255,0.12), transparent 40%, transparent 60%, rgba(0,166,81,0.08))',
        }}
      />

      {/* ─── Top accent animated gradient ─── */}
      <div
        className="h-[3px] w-full transition-all duration-500"
        style={{
          background: isHovered
            ? 'linear-gradient(90deg, #0099FF, #33B5FF, #00A651)'
            : 'linear-gradient(90deg, #0099FF, #33B5FF, #0099FF)',
          backgroundSize: isHovered ? '200% 100%' : '100% 100%',
          backgroundPosition: isHovered ? '100% 0' : '0% 0',
        }}
      />

      {/* ═══ Image / Logo thumbnail ── contain, nhỏ hơn ─── */}
      {thumbUrl && (
        <div className="relative w-full h-[100px] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/30 dark:to-slate-800/30">
          {/* The image — contain mode, centered */}
          <img
            src={thumbUrl}
            alt={project.title}
            className="h-full w-full object-contain p-4 transition-all duration-500"
            loading="lazy"
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Soft gradient overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%)',
            }}
          />
          {/* Brand accent corner */}
          <div
            className="pointer-events-none absolute -top-6 -right-6 h-12 w-12 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(0,153,255,0.3), transparent)',
            }}
          />
        </div>
      )}

      {/* ─── Fallback: pure gradient if no image ─── */}
      {!thumbUrl && (
        <div className="relative w-full h-[100px] overflow-hidden">
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg,
                rgba(0,153,255,0.08),
                rgba(51,181,255,0.04) 50%,
                rgba(0,166,81,0.04)
              )`,
            }}
          />
          {/* Decorative grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,153,255,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,153,255,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
            }}
          />
        </div>
      )}

      {/* ═══ Content ─── */}
      <div className={`${thumbUrl ? 'p-4 pt-3' : 'p-4'}`}>
        {/* Meta row: month + year + location */}
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--brand-blue, #0099FF)' }}>
          {monthLabel && (
            <span className="flex items-center gap-1.5">
              <Calendar size={10} strokeWidth={2.5} />
              {monthLabel}
            </span>
          )}
          <span className="tabular-nums">{project.featured_year}</span>
          {project.location && (
            <span className="ml-auto flex items-center gap-1.5 truncate max-w-[110px] text-slate-400">
              <MapPin size={10} strokeWidth={2.5} />
              {project.location}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-display text-[14px] font-bold leading-snug text-slate-800 dark:text-slate-100 mb-1 line-clamp-2">
          {project.title}
        </h4>

        {/* Client */}
        {project.client && (
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2">
            {project.client}
            <ArrowUpRight
              size={10}
              className="inline-block ml-0.5 -mt-0.5 opacity-0 -translate-y-0.5 transition-all duration-300 group-hover:opacity-60 group-hover:translate-y-0"
            />
          </p>
        )}

        {/* Scope / Description */}
        {scope && (
          <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
            {scope}
          </p>
        )}

        {/* ─── Bottom accent: subtle separator ─── */}
        <div
          className="mt-3 h-px w-0 transition-all duration-500 group-hover:w-full opacity-40"
          style={{
            background: 'linear-gradient(90deg, rgba(0,153,255,0.4), rgba(0,166,81,0.2), transparent)',
          }}
        />
      </div>
    </div>
  );
}
