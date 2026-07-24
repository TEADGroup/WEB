import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload to Supabase Storage (using project-docs bucket which already exists)
        const { data, error } = await supabase.storage
          .from('project-docs')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'error',
            error: error.message,
          };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-docs')
          .getPublicUrl(fileName);

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploaded',
          url: publicUrl,
          path: fileName,
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}