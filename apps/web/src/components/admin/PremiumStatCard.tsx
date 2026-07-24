'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PremiumStatCardProps {
  label: string;
  value: number | string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  delay?: number;
}

export function PremiumStatCard({
  label,
  value,
  color,
  trend = 'neutral',
  trendValue,
  icon,
  delay = 0
}: PremiumStatCardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Color mapping for backgrounds
  const colorMap: Record<string, { bg: string; glow: string }> = {
    'text-brand-blue': { bg: 'from-blue-500/5', glow: 'from-blue-500/20' },
    'text-brand-green': { bg: 'from-emerald-500/5', glow: 'from-emerald-500/20' },
    'text-brand-red': { bg: 'from-red-500/5', glow: 'from-red-500/20' },
    'text-amber-500': { bg: 'from-amber-500/5', glow: 'from-amber-500/20' },
  };

  const colors = colorMap[color] || { bg: 'from-slate-500/5', glow: 'from-slate-500/20' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{
        y: -2,
        boxShadow: '0 16px 64px rgba(0, 153, 255, 0.12)'
      }}
      className="group relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl p-3.5 sm:p-5 lg:p-6 border border-white/20 shadow-premium"
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} to-transparent`} />
      </div>

      {/* Glow effect on hover */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${colors.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
            <motion.p
              className={`mt-0.5 sm:mt-1.5 font-display text-xl sm:text-3xl lg:text-4xl font-bold ${color} leading-none`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.15, type: 'spring' }}
            >
              {value}
            </motion.p>

            {trendValue && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.3 }}
                className={`mt-1 sm:mt-2 flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium ${trendColor} flex-wrap`}
              >
                <TrendIcon size={10} className="sm:size-3" />
                <span>{trendValue}</span>
                <span className="text-slate-400 ml-0.5 hidden sm:inline">vs last month</span>
              </motion.div>
            )}
          </div>

          {icon && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: delay + 0.2, type: 'spring' }}
              className="flex h-7 w-7 sm:h-10 sm:w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner"
            >
              {icon}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}