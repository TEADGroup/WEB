'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_THEME_CONFIG, THEME_STORAGE_KEY } from '@tea/shared';
import type { ThemePhase } from '@tea/shared';
import { applyTheme, computePhase, resolvePhase, type ThemeOverride } from '@/lib/theme';

export interface ThemeState {
  /** Effective phase (after applying the override) — drives the gradient. */
  phase: ThemePhase;
  /** Raw time-of-day phase (what the clock says). */
  timePhase: ThemePhase;
  /** Effective color mode derived from the effective phase. */
  mode: 'light' | 'dark';
  override: ThemeOverride;
  mounted: boolean;
  setOverride: (value: ThemeOverride) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

/**
 * SINGLE source of truth for the time-of-day theme.
 *
 * Previously `useTimeOfDay` was called from two components (ThemeBackground +
 * ThemeToggle), creating two independent states that fought each other. This
 * provider runs the engine exactly once: it computes the phase, applies the
 * gradient variables to <html>, ticks every minute, and exposes the state via
 * context. The no-flash script handles the very first paint.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [timePhase, setTimePhase] = useState<ThemePhase>('day');
  const [override, setOverrideState] = useState<ThemeOverride>('auto');
  const [mounted, setMounted] = useState(false);

  // Read the persisted override once on mount.
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeOverride | null;
    if (stored === 'light' || stored === 'dark') setOverrideState(stored);
  }, []);

  // Apply theme + tick every minute. Re-runs when the override changes.
  useEffect(() => {
    const update = () => {
      const tp = computePhase(new Date());
      setTimePhase(tp);
      applyTheme(resolvePhase(override, tp), DEFAULT_THEME_CONFIG);
    };
    update();
    setMounted(true);
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [override]);

  const setOverride = (value: ThemeOverride) => {
    localStorage.setItem(THEME_STORAGE_KEY, value);
    setOverrideState(value);
  };

  const phase = resolvePhase(override, timePhase);
  const mode = DEFAULT_THEME_CONFIG.phases[phase].mode;

  return (
    <ThemeContext.Provider value={{ phase, timePhase, mode, override, mounted, setOverride }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Consume the theme. Must be used within <ThemeProvider>. */
export function useTimeOfDay(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTimeOfDay must be used within <ThemeProvider>');
  return ctx;
}
