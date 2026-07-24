import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/server/modules/auth/rbac';
import { projectSectionsResultSchema, type AiConfig } from '@tea/shared';
import { createAiProvider } from '@/server/modules/hdvh-parser/provider-factory';
import { extractText, estimateTokens, extractDocxTextAndImages } from '@/server/modules/hdvh-parser/extract';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Node runtime required for pdf-parse and mammoth
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large documents

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any; // Database type trong supabase.ts chưa đầy đủ — cần Supabase CLI gen types hoàn chỉnh

/**
 * POST /api/hdvh-parser?projectId=xxx&version=1
 *
 * Parse a project's HDVH document using the configured AI provider.
 * Flow:
 *   1. Auth check (admin-only)
 *   2. Download attachment from project-docs bucket
 *   3. Extract text (PDF / DOCX / TXT)
 *   4. Read AI provider config from settings
 *   5. Call AI provider to extract structured sections
 *   6. Validate with zod schema
 *   7. Write draft project_sections
 *   8. Update project parse_status
 *   9. Log audit trail
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const version = parseInt(searchParams.get('version') || '1', 10);
    const customPrompt = searchParams.get('customPrompt') || undefined;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient() as Db;
    const storageClient = createSupabaseServiceClient();

    // Fetch the project and its attachments
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get latest attachment (the most recently uploaded HDVH doc)
    const attachments = project.attachments as Array<{
      name: string;
      path: string;
      mime: string;
    }>;

    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ error: 'No HDVH attachments found for this project' }, { status: 400 });
    }

    const doc = attachments[attachments.length - 1];

    // Set parse status to processing (async — return 202 immediately)
    await supabase
      .from('projects')
      .update({ parse_status: 'processing' })
      .eq('id', projectId);

    // Process asynchronously (return 202 immediately)
    const serviceClient = createSupabaseServiceClient();
    processDocument(projectId, doc, version, admin.userId, serviceClient as Db, customPrompt)
      .catch((err: Error) => {
        console.error('HDVH parse async error:', err);
      });

    return NextResponse.json(
      { status: 'processing', message: 'Document parsing started' },
      { status: 202 },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

/**
 * Process a document asynchronously: download → extract → AI parse → write sections.
 * Uses service client (bypasses RLS) because cookie session expires after response.
 */
async function processDocument(
  projectId: string,
  doc: { name: string; path: string; mime: string },
  version: number,
  userId: string,
  svc: Db,
  customPrompt?: string,
) {
  try {
    // Download file from storage
    const { data: fileData, error: downloadError } = await svc.storage
      .from('project-docs')
      .download(doc.path);

    if (downloadError || !fileData) {
      throw new Error(`Download failed: ${downloadError?.message}`);
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    const isDocx = doc.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Extract text + embedded images
    let text: string;
    let embeddedImages: Array<{ name: string; buffer: Buffer; mime: string }> = [];

    if (isDocx) {
      const result = await extractDocxTextAndImages(fileBuffer);
      text = result.text;
      embeddedImages = result.embeddedImages;
    } else {
      text = await extractText(fileBuffer, doc.mime);
    }

    if (!text.trim()) {
      throw new Error('Extracted text is empty');
    }

    // Check token budget
    const tokens = estimateTokens(text);
    if (tokens > 800000) {
      throw new Error(`Document too large: ~${tokens} tokens (max 800000). Please split the file.`);
    }

    // Read AI provider config from settings
    const { data: aiConfigData } = await svc
      .from('settings')
      .select('value')
      .eq('key', 'ai_config')
      .single();

    const aiConfig = (aiConfigData?.value as AiConfig) || {};

    // Create AI provider and parse
    const provider = createAiProvider(aiConfig);
    const result = await provider.parseDocument({ text, language: 'vi', customPrompt });

    // Validate result with zod schema
    const validation = projectSectionsResultSchema.safeParse(result);
    if (!validation.success) {
      throw new Error(`AI response validation failed: ${validation.error.message}`);
    }

    const { sections, project_title_vi, summary_vi, summary_en } = validation.data;

    if (!sections || sections.length === 0) {
      throw new Error('AI returned no sections');
    }

    console.log(`[HDVH] Parsed ${sections.length} sections for project ${projectId}`);

    // Write draft sections
    const sectionRows = sections.map((section, index) => ({
      project_id: projectId,
      type: section.type,
      title_vi: section.title_vi,
      title_en: section.title_en,
      content_vi: section.content_vi,
      content_en: section.content_en,
      items: section.items || [],
      sort_order: index,
      source_doc: doc.name,
      status: 'draft' as const,
      parse_version: version,
    }));

    // Delete old draft sections, insert new ones (use admin auth via server client)
    await svc.from('project_sections').delete().eq('project_id', projectId).eq('status', 'draft');
    const { data: inserted, error: insertError } = await svc
      .from('project_sections')
      .insert(sectionRows)
      .select();
    if (insertError) {
      console.error(`[HDVH] Insert error:`, insertError);
      throw new Error(`Insert sections failed: ${insertError.message}`);
    }
    console.log(`[HDVH] Inserted ${inserted?.length || 0} sections`);

    // Update project status
    const updateData: Record<string, unknown> = {
      parse_status: 'done',
      parse_version: version,
    };
    if (project_title_vi) updateData.title = project_title_vi;
    if (summary_vi) updateData.description_vi = summary_vi;
    if (summary_en) updateData.description_en = summary_en;

    await svc.from('projects').update(updateData).eq('id', projectId);

    // Upload AI-filtered embedded images
    const allowedImageNames = new Set<string>();
    let hasImageNames = false;
    for (const section of sections) {
      const names = (section as { image_names?: string[] }).image_names;
      if (names && names.length > 0) {
        hasImageNames = true;
        for (const n of names) allowedImageNames.add(n);
      }
    }

    let skippedImages = 0;
    for (const img of embeddedImages) {
      if (img.buffer.length === 0) continue;
      if (hasImageNames && !allowedImageNames.has(img.name)) {
        skippedImages++;
        continue;
      }
      try {
        const fileName = `embedded-${Date.now()}-${img.name}`;
        const imgPath = `${projectId}/images/${fileName}`;
        await svc.storage.from('project-images').upload(imgPath, img.buffer, {
          upsert: true, contentType: img.mime,
        });
        const { data: urlData } = svc.storage.from('project-images').getPublicUrl(imgPath);
        if (urlData) {
          const { data: proj } = await svc.from('projects').select('images').eq('id', projectId).single();
          const currentImages: Array<{ url: string; caption: string }> = proj?.images || [];
          currentImages.push({ url: urlData.publicUrl, caption: '' });
          await svc.from('projects').update({ images: currentImages }).eq('id', projectId);
        }
      } catch (e) {
        console.warn('[HDVH] Failed to upload embedded image:', img.name, e);
      }
    }
    if (hasImageNames) {
      console.log(`[HDVH] Image filter: ${embeddedImages.length} total, ${allowedImageNames.size} allowed, ${skippedImages} skipped`);
    }

    // Audit log
    await svc.from('audit_logs').insert({
      actor: userId,
      action: 'hdvh_parse',
      entity: 'project_sections',
      entity_id: projectId,
      payload: { version, count: sections.length, provider: provider.name },
    });

  } catch (error) {
    // Mark as failed
    try {
      await svc.from('projects').update({
        parse_status: 'failed',
        parse_error: (error as Error).message,
      }).eq('id', projectId);
    } catch (_e) {
      console.error('Failed to update parse_error status:', _e);
    }
  }
}
