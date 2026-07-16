import { z } from 'zod';

/**
 * Project + tree-node data contract. Drives the Projects tree (Phase 3) and the
 * Admin Projects Manager (Phase 4).
 */

// ---------------------------------------------------------------------------
// Categories (solution domains)
// ---------------------------------------------------------------------------
export const projectCategorySchema = z.enum([
  'line-automation', // Tự động hoá dây chuyền
  'control-cabinets', // Tủ điện điều khiển
  'plc-scada', // PLC / SCADA
  'system-integration', // Tích hợp hệ thống
  'maintenance', // Bảo trì
  'other',
]);
export type ProjectCategory = z.infer<typeof projectCategorySchema>;

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'line-automation',
  'control-cabinets',
  'plc-scada',
  'system-integration',
  'maintenance',
  'other',
];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, { vi: string; en: string }> = {
  'line-automation': { vi: 'Tự động hoá dây chuyền', en: 'Line automation' },
  'control-cabinets': { vi: 'Tủ điện điều khiển', en: 'Control cabinets' },
  'plc-scada': { vi: 'PLC / SCADA', en: 'PLC / SCADA' },
  'system-integration': { vi: 'Tích hợp hệ thống', en: 'System integration' },
  maintenance: { vi: 'Bảo trì', en: 'Maintenance' },
  other: { vi: 'Khác', en: 'Other' },
};

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------
export const projectStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const parseStatusSchema = z.enum(['idle', 'pending', 'processing', 'done', 'failed']);
export type ParseStatus = z.infer<typeof parseStatusSchema>;

// ---------------------------------------------------------------------------
// Attachments (HDVH documents stored in Supabase Storage `project-docs`)
// ---------------------------------------------------------------------------
export const attachmentSchema = z.object({
  name: z.string(),
  path: z.string(), // Supabase Storage path inside the `project-docs` bucket
  mime: z.string(),
  size: z.number().int().nonnegative().optional(),
  uploaded_at: z.string().optional(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

// ---------------------------------------------------------------------------
// Validation schema for create/update project payloads (Admin)
// ---------------------------------------------------------------------------
export const projectInputSchema = z.object({
  slug: z.string().min(1),
  category: projectCategorySchema,
  title: z.string().min(1),
  client: z.string().optional(),
  location: z.string().optional(),
  date: z.string().optional(), // ISO yyyy-mm-dd
  status: projectStatusSchema.default('draft'),
  description_vi: z.string().optional(),
  description_en: z.string().optional(),
  images: z.array(z.string()).default([]),
  attachments: z.array(attachmentSchema).default([]),
  /** Persisted xyflow/dagre node positions from the admin editor. */
  position: z.unknown().optional(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;
