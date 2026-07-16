import type { ThemeConfig } from './schemas/settings';

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

/** localStorage key for the manual theme override: 'auto' | 'light' | 'dark'. */
export const THEME_STORAGE_KEY = 'tea-theme';

/** Settings table keys (kept in sync with supabase/migrations). */
export const SETTINGS_KEYS = {
  company: 'company',
  socials: 'socials',
  homeStats: 'home_stats',
  themeConfig: 'theme_config',
  contactEmail: 'contact_email',
} as const;

// ---------------------------------------------------------------------------
// Default theme config — canonical client fallback.
// NOTE: supabase/seed.sql mirrors these same values so the DB is the source of
// truth at runtime; this constant is the safe default before settings load and
// for SSR/no-JS. Keep the two in sync when changing gradients.
// ---------------------------------------------------------------------------
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  // Brand palette (from the TEA Group logo): blue #0099FF, green #00A651,
  // red #FF3333 (triadic). Backgrounds use desaturated TINTS of these hues so
  // the page never feels garish/eye-straining; the saturated brand colors are
  // reserved for small accents (logo, CTAs, stat numbers).
  phases: {
    // 05:00–08:00 — bình minh / dawn: pale brand-blue → soft warm glow
    dawn: { from: '#DCEFFC', via: '#FBE9E7', to: '#FFF4EE', accent: '#0099FF', mode: 'light' },
    // 08:00–17:00 — ban ngày / day: pale blue → pale mint → off-white (Light)
    day: { from: '#E3F1FB', via: '#E9F6EF', to: '#F6F8FB', accent: '#0099FF', mode: 'light' },
    // 17:00–19:00 — hoàng hôn / dusk: muted twilight blue → muted plum
    dusk: { from: '#1F3A5C', via: '#3B2E5C', to: '#5C2E47', accent: '#FF6666', mode: 'dark' },
    // 19:00–05:00 — đêm / night: deep navy → deep indigo (NOT pure black — gentler)
    night: { from: '#0A1626', via: '#0F1D33', to: '#141432', accent: '#33B5FF', mode: 'dark' },
  },
};

/** Default contact recipient (overridden by `settings.contact_email`). */
export const DEFAULT_CONTACT_EMAIL = 'contact@teagroup.vn';
