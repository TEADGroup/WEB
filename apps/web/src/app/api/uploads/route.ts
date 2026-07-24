import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/server/modules/auth/rbac';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any; // Database type trong supabase.ts chưa đầy đủ — cần Supabase CLI gen types hoàn chỉnh

/**
 * POST /api/uploads — upload a file to Supabase Storage.
 * Admin-only. Supports project-images and project-docs buckets.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient() as Db;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'project-docs';
    const projectId = formData.get('projectId') as string;
    const caption = formData.get('caption') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'No projectId provided' }, { status: 400 });
    }

    // Upload file to storage
    const filePath = `${projectId}/${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // If uploading to project-images, append { url, caption } to projects.images
    if (bucket === 'project-images') {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || null;

      if (publicUrl) {
        const { data: project } = await supabase
          .from('projects')
          .select('images')
          .eq('id', projectId)
          .single();

        const images = [...((project?.images as Array<{ url: string; caption?: string }>) || [])];
        images.push({ url: publicUrl, caption });

        await supabase
          .from('projects')
          .update({ images })
          .eq('id', projectId);
      }
    }

    // If uploading HDVH to project-docs, update project attachments and set parse_status
    if (bucket === 'project-docs') {
      const { data: project } = await supabase
        .from('projects')
        .select('attachments')
        .eq('id', projectId)
        .single();

      const attachments = [
        ...((project?.attachments as Array<{ name: string; path: string; mime: string; size: number }>) || []),
        {
          name: file.name,
          path: filePath,
          mime: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        },
      ];

      await supabase
        .from('projects')
        .update({
          attachments,
          parse_status: 'pending',
        })
        .eq('id', projectId);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      path: filePath,
      name: file.name,
      size: file.size,
      publicUrl: urlData?.publicUrl || null,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
