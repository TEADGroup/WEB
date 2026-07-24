/**
 * Knowledge Base — nguồn tri thức nội bộ cho AI Chat.
 *
 * Query Supabase để lấy:
 * - Published projects + sections (dự án đã triển khai)
 * - Company info (thông tin công ty)
 * - Home stats (số liệu)
 * - AI memory (bài học từ các lần chat trước)
 *
 * Tất cả được nén gọn → inject vào system prompt để AI trả lời chính xác.
 */

import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any; // Database type trong supabase.ts chưa đầy đủ — cần Supabase CLI gen types hoàn chỉnh

// ─── Types ────────────────────────────────────────────────────

export interface KnowledgeBaseData {
  projects: Array<{
    slug: string;
    title: string;
    client: string | null;
    location: string | null;
    date: string | null;
    description_vi: string | null;
    description_en: string | null;
    category: string;
    sections: Array<{
      type: string;
      title_vi: string | null;
      title_en: string | null;
      content_vi: string | null;
      content_en: string | null;
      items: string[];
    }>;
  }>;
  company: Record<string, string> | null;
  stats: Array<{ key: string; value: string; label_vi: string }> | null;
}

// ─── Fetch KB data ────────────────────────────────────────────

/**
 * Query toàn bộ Knowledge Base từ Supabase.
 * Kết quả đã được nén gọn, sẵn sàng để inject.
 */
export async function fetchKnowledgeBase(): Promise<KnowledgeBaseData> {
  const supabase = createSupabaseServiceClient() as Db;

  // 1) Published projects + sections
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      slug, title, client, location, date,
      description_vi, description_en, category,
      project_sections (type, title_vi, title_en, content_vi, content_en, items)
    `)
    .eq('status', 'published')
    .order('date', { ascending: false });

  const formattedProjects = (projects || []).map((p: Record<string, unknown>) => ({
    slug: p.slug as string,
    title: p.title as string,
    client: (p.client as string) || null,
    location: (p.location as string) || null,
    date: (p.date as string) || null,
    description_vi: (p.description_vi as string) || null,
    description_en: (p.description_en as string) || null,
    category: (p.category as string) || 'other',
    sections: ((p.project_sections as Array<Record<string, unknown>>) || [])
      .filter((s: Record<string, unknown>) => (s as { status?: string }).status !== 'draft')
      .map((s: Record<string, unknown>) => ({
        type: s.type as string,
        title_vi: (s.title_vi as string) || null,
        title_en: (s.title_en as string) || null,
        content_vi: (s.content_vi as string) || null,
        content_en: (s.content_en as string) || null,
        items: (s.items as string[]) || [],
      })),
  }));

  // 2) Company info
  const { data: companyData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'company')
    .single();
  const company = (companyData?.value as Record<string, string>) || null;

  // 3) Home stats
  const { data: statsData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'home_stats')
    .single();
  const stats = (statsData?.value as Array<{ key: string; value: string; label_vi: string }>) || null;

  return {
    projects: formattedProjects,
    company,
    stats,
  };
}

// ─── Nén KB thành context cho AI ──────────────────────────────

/**
 * Nén Knowledge Base thành text ngắn gọn (tối đa ~4000 ký tự).
 * AI đọc là biết ngay TEA Group có những dự án nào, thông tin gì.
 */
export function formatKnowledgeBase(kb: KnowledgeBaseData): string {
  const lines: string[] = [];

  // Company info
  if (kb.company) {
    lines.push('── THÔNG TIN CÔNG TY ──');
    if (kb.company.name) lines.push(`Tên: ${kb.company.name}`);
    if (kb.company.slogan_vi) lines.push(`Slogan: ${kb.company.slogan_vi}`);
    if (kb.company.description_vi) lines.push(`Mô tả: ${kb.company.description_vi}`);
    if (kb.company.address) lines.push(`Địa chỉ: ${kb.company.address}`);
    if (kb.company.phone) lines.push(`Điện thoại: ${kb.company.phone}`);
    if (kb.company.email) lines.push(`Email: ${kb.company.email}`);
    lines.push('');
  }

  // Stats
  if (kb.stats && kb.stats.length > 0) {
    lines.push('── SỐ LIỆU NỔI BẬT ──');
    for (const s of kb.stats) {
      lines.push(`${s.label_vi}: ${s.value}`);
    }
    lines.push('');
  }

  // Projects
  if (kb.projects.length > 0) {
    lines.push(`── DỰ ÁN ĐÃ TRIỂN KHAI (${kb.projects.length} dự án) ──`);
    for (const p of kb.projects.slice(0, 10)) {
      lines.push(`\n• ${p.title} (${p.category})`);
      if (p.client) lines.push(`  Khách hàng: ${p.client}`);
      if (p.location) lines.push(`  Địa điểm: ${p.location}`);
      if (p.date) lines.push(`  Thời gian: ${p.date}`);
      if (p.description_vi) lines.push(`  Mô tả: ${p.description_vi.slice(0, 200)}`);

      // Sections (tối đa 3 section/dự án, mỗi section 2 dòng)
      if (p.sections.length > 0) {
        for (const s of p.sections.slice(0, 3)) {
          const title = s.title_vi || s.title_en || s.type;
          const content = (s.content_vi || s.content_en || '').slice(0, 150);
          lines.push(`  - ${title}: ${content}`);
          if (s.items && s.items.length > 0) {
            lines.push(`    ${s.items.slice(0, 3).join(' | ')}`);
          }
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
