import { z } from 'zod';

/**
 * System Settings contract (the editable Headless-CMS layer). Stored as key/value
 * rows in the `settings` table; each key has its own value schema.
 */

// ---------------------------------------------------------------------------
// AI Provider config (which AI provider and its settings)
// ---------------------------------------------------------------------------
export const aiConfigSchema = z.object({
  // Provider selection: 'ollama', 'openrouter', or 'anthropic'
  provider: z.enum(['ollama', 'openrouter', 'anthropic']).optional(),

  // Ollama (local, free, no API key)
  ollamaBaseUrl: z.string().default('http://localhost:11434'),
  ollamaModel: z.string().default('qwen2.5vl:7b'),

  // OpenRouter (free tier API access to multiple models)
  openrouterApiKey: z.string().optional(),
  openrouterModel: z.string().optional(),
  openrouterBaseUrl: z.string().optional(),

  // Anthropic (direct API, paid)
  anthropicApiKey: z.string().optional(),
});
export type AiConfig = z.infer<typeof aiConfigSchema>;

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'ollama',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'qwen2.5vl:7b',
};

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
