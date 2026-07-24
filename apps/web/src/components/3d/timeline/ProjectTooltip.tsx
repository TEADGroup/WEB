'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import type { FeaturedProject } from './TimelineData';

interface ProjectTooltipProps {
  project: FeaturedProject | null;
  mouseX: number;
  mouseY: number;
}

export function ProjectTooltip({ project, mouseX, mouseY }: ProjectTooltipProps) {
  const locale = useLocale();

  if (!project) return null;

  const title = project.title;
  const scope = locale === 'vi' ? (project.scope_vi || project.description_vi) : (project.scope_en || project.description_en);
  const location = project.location;

  /* Format month label */
  const monthLabel = project.featured_month
    ? new Date(2024, project.featured_month - 1).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'long' })
    : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="pointer-events-none fixed z-50 max-w-xs rounded-2xl bg-white/95 backdrop-blur-xl p-5 shadow-2xl border border-slate-200/60"
        style={{
          left: Math.min(mouseX + 16, window.innerWidth - 320),
          top: Math.min(mouseY - 16, window.innerHeight - 250),
        }}
      >
        {/* Date */}
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue mb-2">
          <span>{monthLabel}</span>
          {project.featured_year && <span>· {project.featured_year}</span>}
          {location && <span>· {location}</span>}
        </div>

        {/* Title */}
        <h4 className="font-display text-sm font-bold text-slate-800 mb-1.5 leading-snug">
          {title}
        </h4>

        {/* Client */}
        {project.client && (
          <p className="text-xs text-slate-400 mb-2">
            {project.client}
          </p>
        )}

        {/* Scope / Description */}
        {scope && (
          <p className="text-xs leading-relaxed text-slate-500 line-clamp-3">
            {scope}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
