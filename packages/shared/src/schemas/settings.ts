import { z } from 'zod';

/**
 * System Settings contract (the editable Headless-CMS layer). Stored as key/value
 * rows in the `settings` table; each key has its own value schema.
 */

// ---------------------------------------------------------------------------
// Dynamic time-of-day theme (Phase 1 hook + Phase 4 admin editor)
// ---------------------------------------------------------------------------
export const themePhaseSchema = z.enum(['dawn', 'day', 'dusk', 'night']);
export type ThemePhase = z.infer<typeof themePhaseSchema>;

export const THEME_PHASES: ThemePhase[] = ['dawn', 'day', 'dusk', 'night'];

export const themePhaseConfigSchema = z.object({
  from: z.string(), // hex color
  via: z.string().optional(),
  to: z.string(), // hex color
  accent: z.string(), // hex — neon accent
  mode: z.enum(['light', 'dark']),
});
export type ThemePhaseConfig = z.infer<typeof themePhaseConfigSchema>;

export const themeConfigSchema = z.object({
  // Fixed 4 phases as an explicit object (NOT z.record) so the inferred type is
  // complete — indexing by phase never yields `undefined`.
  phases: z.object({
    dawn: themePhaseConfigSchema,
    day: themePhaseConfigSchema,
    dusk: themePhaseConfigSchema,
    night: themePhaseConfigSchema,
  }),
});
export type ThemeConfig = z.infer<typeof themeConfigSchema>;

// ---------------------------------------------------------------------------
// Company info
// ---------------------------------------------------------------------------
export const companyInfoSchema = z.object({
  name: z.string(),
  name_en: z.string().optional(),
  slogan_vi: z.string().optional(),
  slogan_en: z.string().optional(),
  description_vi: z.string().optional(),
  description_en: z.string().optional(),
  address: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo_url: z.string().optional(),
});
export type CompanyInfo = z.infer<typeof companyInfoSchema>;

// ---------------------------------------------------------------------------
// Social links (open map — allow arbitrary future platforms)
// ---------------------------------------------------------------------------
export const socialsSchema = z
  .object({
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional(),
    zalo: z.string().optional(),
    website: z.string().optional(),
  })
  .catchall(z.string().optional());
export type Socials = z.infer<typeof socialsSchema>;

// ---------------------------------------------------------------------------
// Home stats (project count, years of experience, …)
// ---------------------------------------------------------------------------
export const homeStatSchema = z.object({
  key: z.string(),
  value: z.string(),
  label_vi: z.string(),
  label_en: z.string().optional(),
});
export type HomeStat = z.infer<typeof homeStatSchema>;

export const homeStatsSchema = z.array(homeStatSchema);
export type HomeStats = z.infer<typeof homeStatsSchema>;
