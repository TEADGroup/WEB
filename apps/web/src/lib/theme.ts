import { DEFAULT_THEME_CONFIG } from '@tea/shared';
import type { ThemeConfig, ThemePhase } from '@tea/shared';

/** Manual theme override persisted in localStorage. */
export type ThemeOverride = 'auto' | 'light' | 'dark';

/**
 * Pure theme helpers — no React. Shared by the ThemeProvider and the inline
 * no-flash script (which mirrors these as raw JS because it runs pre-hydration).
 */

/** Compute the current phase from a Date, interpreted in Asia/Ho_Chi_Minh. */
export function computePhase(date: Date): ThemePhase {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    hour12: false,
  }).format(date);
  const hour = Number(hourStr) % 24;

  if (hour >= 5 && hour < 8) return 'dawn'; // 05:00–08:00 bình minh
  if (hour >= 8 && hour < 17) return 'day'; // 08:00–17:00 ban ngày
  if (hour >= 17 && hour < 19) return 'dusk'; // 17:00–19:00 hoàng hôn
  return 'night'; // 19:00–05:00 đêm (wraps past midnight)
}

/**
 * Resolve the EFFECTIVE phase (which gradient to show). A manual override pins
 * to a representative phase: Light → day gradient, Dark → night gradient. Auto
 * follows the clock. The phase's configured `mode` then decides light/dark UI.
 */
export function resolvePhase(override: ThemeOverride, timePhase: ThemePhase): ThemePhase {
  if (override === 'light') return 'day';
  if (override === 'dark') return 'night';
  return timePhase;
}

/** Apply a phase's gradient variables + `dark` class to <html>. */
export function applyTheme(phase: ThemePhase, config: ThemeConfig): void {
  if (typeof document === 'undefined') return;
  const p = config.phases[phase];
  const root = document.documentElement;
  root.style.setProperty('--tea-bg-from', p.from);
  if (p.via) root.style.setProperty('--tea-bg-via', p.via);
  root.style.setProperty('--tea-bg-to', p.to);
  root.style.setProperty('--tea-accent', p.accent);
  root.classList.toggle('dark', p.mode === 'dark');
}
