// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

/** Settings table keys (kept in sync with supabase/migrations). */
export const SETTINGS_KEYS = {
  company: 'company',
  socials: 'socials',
  homeStats: 'home_stats',
  themeConfig: 'theme_config',
  contactEmail: 'contact_email',
  aiConfig: 'ai_config',
} as const;

/** Default contact recipient (overridden by `settings.contact_email`). */
export const DEFAULT_CONTACT_EMAIL = 'contact@teagroup.vn';
