import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/server/modules/auth/rbac';
import { projectSectionsResultSchema, type AiConfig } from '@tea/shared';
import { createAiProvider } from '@/server/modules/hdvh-parser/provider-factory';
import { extractText, estimateTokens, extractDocxTextAndImages, extractPdfTextAndImages } from '@/server/modules/hdvh-parser/extract';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Node runtime required for pdf-parse and mammoth
export const runtime = 'nodejs';
export const maxDuration = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any; // Database type trong supabase.ts chưa đầy đủ — cần Supabase CLI gen types hoàn chỉnh

/**
 * POST /api/hdvh-parser/auto-create
 *
 * Upload a HDVH file → AI auto-creates a project + sections in one step.
 * Accepts multipart form: file (PDF/DOCX/TXT) + images (multiple, optional).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const svc = createSupabaseServiceClient() as Db;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageFiles = formData.getAll('images') as File[];
    const customPrompt = formData.get('customPrompt') as string || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No HDVH file provided' }, { status: 400 });
    }

    // 1. Extract text + embedded images from HDVH
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isPdf  = file.type === 'application/pdf';
    let text: string;
    let embeddedImages: Array<{ name: string; buffer: Buffer; mime: string }> = [];

    if (isDocx) {
      const result = await extractDocxTextAndImages(fileBuffer);
      text = result.text;
      embeddedImages = result.embeddedImages;
    } else if (isPdf) {
      const result = await extractPdfTextAndImages(fileBuffer);
      text = result.text;
      embeddedImages = result.embeddedImages;
    } else {
      text = await extractText(fileBuffer, file.type);
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Extracted text is empty' }, { status: 400 });
    }

    const tokens = estimateTokens(text);
    if (tokens > 800000) {
      return NextResponse.json({ error: `Document too large: ~${tokens} tokens (max 800000)` }, { status: 400 });
    }

    // 2. Read AI config
    const { data: aiConfigData } = await svc
      .from('settings')
      .select('value')
      .eq('key', 'ai_config')
      .single();
    const aiConfig = (aiConfigData?.value as AiConfig) || {};

    // 3. Call AI to parse document
    const provider = createAiProvider(aiConfig);
    const result = await provider.parseDocument({ text, language: 'vi', customPrompt }) as Record<string, unknown>;

    // Valid section types
    const validTypes = ['overview', 'equipment', 'specs', 'operating', 'maintenance', 'safety', 'other'];

    // Debug: log AI raw result
    console.log('[HDVH] Raw result:', JSON.stringify(result).slice(0, 500));

    // Manually extract with fallbacks for missing fields
    const rawSections = (result.sections || []) as Array<Record<string, unknown>>;
    const cleanSections = rawSections.map((s, i) => {
      let type = (s.type as string) || 'other';

      // Some local models return multiple types joined by | (e.g. "overview|specs")
      if (type.includes('|')) {
        type = type.split('|')[0]; // Take first one
      }

      // Ensure it's a known type
      if (!validTypes.includes(type)) type = 'other';

      // Items may be array of strings or array of objects — normalize to strings
      const rawItems = (s.items as unknown[]) || [];
      const items: string[] = rawItems.map((item: unknown) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          // Try to extract a string value from the object
          const obj = item as Record<string, unknown>;
          return Object.values(obj).find(v => typeof v === 'string') as string || JSON.stringify(item);
        }
        return String(item);
      });

      return {
        type,
        title_vi: (s.title_vi as string) || `Mục ${i + 1}`,
        title_en: (s.title_en as string) || `Section ${i + 1}`,
        content_vi: (s.content_vi as string) || '',
        content_en: (s.content_en as string) || '',
        items,
      };
    });

    const project_title_vi = (result.project_title_vi as string) || file.name.replace(/\.[^.]+$/, '');
    const client = result.client as string | undefined;
    const location = result.location as string | undefined;
    const summary_vi = result.summary_vi as string | undefined;
    const summary_en = result.summary_en as string | undefined;

    if (!cleanSections.length) {
      throw new Error('AI returned no sections');
    }

    // Validate with zod (should pass since we filled fallbacks)
    const validation = projectSectionsResultSchema.safeParse({
      project_title_vi,
      client,
      location,
      sections: cleanSections,
    });
    if (!validation.success) {
      throw new Error(`AI response validation failed: ${validation.error.message}`);
    }

    const sections = cleanSections;

    // 4. Create project from AI data
    const title = project_title_vi || file.name.replace(/\.[^.]+$/, '');
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data: project, error: projectError } = await svc
      .from('projects')
      .insert({
        slug,
        category: 'other',
        title,
        client: client || null,
        location: location || null,
        description_vi: summary_vi || '',
        description_en: summary_en || '',
        status: 'draft',
        created_by: admin.userId,
        attachments: [{
          name: file.name,
          path: `auto/${file.name}`,
          mime: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        }],
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(`Project creation failed: ${projectError?.message}`);
    }

    // 5. Upload HDVH file to storage
    const filePath = `${project.id}/${file.name}`;
    await svc.storage.from('project-docs').upload(filePath, fileBuffer, {
      upsert: true,
      contentType: file.type,
    });

    // 6. Write draft sections
    const sectionRows = sections.map((section, index) => ({
      project_id: project.id,
      type: section.type,
      title_vi: section.title_vi,
      title_en: section.title_en,
      content_vi: section.content_vi,
      content_en: section.content_en,
      items: section.items || [],
      sort_order: index,
      source_doc: file.name,
      status: 'draft' as const,
      parse_version: 1,
    }));

    await svc.from('project_sections').insert(sectionRows);

    // 7. Upload images — user-provided + AI-filtered embedded images from DOCX
    const projectImages: Array<{ url: string; caption: string }> = [];

    // Build the set of allowed image names from AI output.
    // When the AI populates image_names on sections, only those images are uploaded.
    // When no section has image_names, ALL embedded images are uploaded (graceful fallback).
    const allowedImageNames = new Set<string>();
    let hasImageNames = false;
    for (const section of sections) {
      const names = (section as Record<string, unknown>).image_names as string[] | undefined;
      if (names && names.length > 0) {
        hasImageNames = true;
        for (const n of names) allowedImageNames.add(n);
      }
    }
    if (hasImageNames) {
      console.log(`[HDVH] AI returned ${allowedImageNames.size} image_names across sections — filtering`);
    }
    // User-uploaded images
    for (const f of imageFiles) {
      const imgBuffer = Buffer.from(await f.arrayBuffer());
      const imgPath = `${project.id}/images/${f.name}`;
      await svc.storage.from('project-images').upload(imgPath, imgBuffer, {
        upsert: true, contentType: f.type,
      });
      const { data: urlData } = svc.storage.from('project-images').getPublicUrl(imgPath);
      if (urlData) projectImages.push({ url: urlData.publicUrl, caption: '' });
    }
    // Embedded images extracted from DOCX — filtered by AI's image_names if available
    let skippedImages = 0;
    for (const img of embeddedImages) {
      if (img.buffer.length === 0) continue; // Skip unreadable images
      if (hasImageNames && !allowedImageNames.has(img.name)) {
        skippedImages++;
        continue;
      }
      const fileName = `embedded-${Date.now()}-${img.name}`;
      const imgPath = `${project.id}/images/${fileName}`;
      await svc.storage.from('project-images').upload(imgPath, img.buffer, {
        upsert: true, contentType: img.mime,
      });
      const { data: urlData } = svc.storage.from('project-images').getPublicUrl(imgPath);
      if (urlData) projectImages.push({ url: urlData.publicUrl, caption: '' });
    }
    if (skippedImages > 0) {
      console.log(`[HDVH] Image filter: ${embeddedImages.length} total, ${projectImages.length - imageFiles.length} uploaded, ${skippedImages} skipped`);
    }

    // Update project with images + parse status
    await svc
      .from('projects')
      .update({
        parse_status: 'done',
        parse_version: 1,
        images: projectImages,
        attachments: [{
          name: file.name,
          path: filePath,
          mime: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        }],
      })
      .eq('id', project.id);

    // 8. Audit log
    await svc.from('audit_logs').insert({
      actor: admin.userId,
      action: 'hdvh_auto_create',
      entity: 'projects',
      entity_id: project.id,
      payload: { version: 1, sections: sections.length, provider: provider.name, images: projectImages.length },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        slug,
        title,
        sections: sections.length,
        images: projectImages.length,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
