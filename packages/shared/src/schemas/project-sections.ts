import { z } from 'zod';

/**
 * HDVH (Hướng dẫn vận hành) document structure — the contract for the AI parser.
 *
 * This schema is used in three places:
 *   1. the Anthropic `messages.parse` call (via `zodOutputFormat`),
 *   2. server-side validation before writing `project_sections`,
 *   3. the Admin preview/diff UI.
 * Keep it the single source of truth — change the structure here once.
 */

// ---------------------------------------------------------------------------
// Section types
// ---------------------------------------------------------------------------
export const sectionTypeSchema = z.enum([
  'overview', // Tổng quan hệ thống — System overview
  'equipment', // Danh mục thiết bị — Equipment list
  'specs', // Thông số kỹ thuật — Technical specifications
  'operating', // Quy trình vận hành — Operating procedures
  'maintenance', // Quy trình bảo trì — Maintenance procedures
  'safety', // Cảnh báo / an toàn — Safety / warnings
  'other',
]);
export type SectionType = z.infer<typeof sectionTypeSchema>;

export const SECTION_TYPES: SectionType[] = [
  'overview',
  'equipment',
  'specs',
  'operating',
  'maintenance',
  'safety',
  'other',
];

/** Human-readable labels per section type, bilingual. */
export const SECTION_TYPE_LABELS: Record<SectionType, { vi: string; en: string }> = {
  overview: { vi: 'Tổng quan hệ thống', en: 'System overview' },
  equipment: { vi: 'Danh mục thiết bị', en: 'Equipment list' },
  specs: { vi: 'Thông số kỹ thuật', en: 'Technical specifications' },
  operating: { vi: 'Quy trình vận hành', en: 'Operating procedures' },
  maintenance: { vi: 'Quy trình bảo trì', en: 'Maintenance procedures' },
  safety: { vi: 'Cảnh báo / an toàn', en: 'Safety / warnings' },
  other: { vi: 'Khác', en: 'Other' },
};

// ---------------------------------------------------------------------------
// One parsed section
// ---------------------------------------------------------------------------
export const projectSectionSchema = z.object({
  type: sectionTypeSchema,
  title_vi: z.string().min(1).describe('Tiêu đề mục (Tiếng Việt)'),
  title_en: z.string().min(1).describe('Section title (English)'),
  content_vi: z.string().describe('Nội dung chi tiết, có thể nhiều dòng (Tiếng Việt)'),
  content_en: z.string().describe('Detailed content, may be multi-line (English)'),
  /** Optional bullet items (e.g. equipment list entries, spec rows). */
  items: z.array(z.string()).optional(),
  /** Image filenames belonging to this section, from [HÌNH: ...] markers. */
  image_names: z.array(z.string()).optional().describe(
    'Tên file hình ảnh thuộc section này, lấy từ các marker [HÌNH: tên_file] trong tài liệu',
  ),
});
export type ProjectSection = z.infer<typeof projectSectionSchema>;

// ---------------------------------------------------------------------------
// The full result the AI must return
// ---------------------------------------------------------------------------
export const projectSectionsResultSchema = z.object({
  project_title_vi: z.string().optional().describe('Tên dự án nếu có trong tài liệu (Tiếng Việt) — thường là tên hệ thống/máy/dây chuyền'),
  project_title_en: z.string().optional().describe('Project name if present (English)'),
  client: z.string().optional().describe('Tên khách hàng / chủ đầu tư — thường xuất hiện dạng "Công ty TNHH..." trong phần đầu tài liệu'),
  location: z.string().optional().describe('Địa điểm lắp đặt — thường xuất hiện dạng "tỉnh/thành phố" trong tài liệu'),
  summary_vi: z.string().optional().describe('Tóm tắt 1–2 câu về hệ thống (Tiếng Việt)'),
  summary_en: z.string().optional().describe('1–2 sentence system summary (English)'),
  sections: z.array(projectSectionSchema).min(1),
});
export type ProjectSectionsResult = z.infer<typeof projectSectionsResultSchema>;
