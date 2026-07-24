import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ParseRequestFile {
  id: string;
  name: string;
  path: string;
  url: string;
}

interface ParseRequest {
  files: ParseRequestFile[];
  options?: {
    accuracy?: 'fast' | 'balanced' | 'precise';
    includeImages?: boolean;
    provider?: 'claude' | 'openai' | 'ollama';
    mode?: 'auto' | 'structure' | 'specs';
  };
}

interface ParsedSection {
  title: string;
  description: string;
  type: string;
  order: number;
  content?: string;
  children?: ParsedSection[];
}

interface ParsedProjectStructure {
  projectName: string;
  description: string;
  category: string;
  sections: ParsedSection[];
  metadata: {
    confidence?: number;
    notes?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: ParseRequest = await req.json();
    const { files, options } = body;
    const provider = options?.provider || 'claude';
    const parseMode = options?.mode || 'auto';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files to parse' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const startTime = Date.now();

    // Download file contents from Supabase storage
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const { data, error } = await supabase.storage
          .from('project-docs')
          .download(file.path);

        if (error || !data) {
          console.error('Download error:', error);
          return null;
        }

        const buffer = Buffer.from(await data.arrayBuffer());

        return {
          id: file.id,
          name: file.name,
          path: file.path,
          url: file.url,
          content: buffer.toString('base64'),
          mimeType: file.path.toLowerCase().endsWith('.pdf') ? 'application/pdf' as const : 'image/png' as const,
        };
      })
    );

    const validFiles = fileContents.filter((f): f is NonNullable<typeof f> => f !== null);

    if (validFiles.length === 0) {
      return NextResponse.json({ error: 'Failed to download any files' }, { status: 500 });
    }

    // Prepare AI prompt - adapt based on parse mode
    const modeInstructions = parseMode === 'structure'
      ? 'Focus on extracting the document structure/hierarchy only. Identify chapters, sections, subsections and their relationships.'
      : parseMode === 'specs'
      ? 'Focus on extracting technical specifications, parameters, equipment lists, model numbers, and performance metrics. Create detailed specification sections.'
      : 'Perform a complete analysis: extract document structure, technical specifications, equipment details, operating procedures, and maintenance requirements. Create a comprehensive project hierarchy.';

    const systemPrompt = `You are an expert technical documentation analyzer specializing in industrial automation and electrical control systems (PLC, SCADA, HMI, Variable Frequency Drives, Electrical Cabinets). Your task is to analyze HDVH (Hướng Dẫn Vận Hành - Operation Manuals) documents and extract structured project information.

${modeInstructions}

Rules:
1. Extract the main project name and description from the document content
2. Identify the document category (e.g., PLC Programming, HMI Design, Electrical Cabinet, System Integration, Network Configuration, Maintenance)
3. Create a hierarchical structure of sections, subsections, and technical specifications
4. Preserve the original document structure and numbering (e.g., 1.0, 1.1, 1.1.1)
5. Extract key technical specifications: equipment models, parameters, wiring details, programming info
6. Identify safety requirements and operating procedures if present
7. For images/diagrams, describe what you see and extract any readable text
8. Assign appropriate types: chapter, section, subsection, or specification
9. Maintain parent-child relationships in the hierarchy
10. Assign confidence scores based on clarity of the extracted information

Output MUST be valid JSON ONLY, no markdown, no explanation:
{
  "projectName": "string (descriptive project name derived from document)",
  "description": "string (2-3 sentences summarizing the document purpose)",
  "category": "string (one of: line-automation, control-cabinets, plc-scada, system-integration, maintenance, other)",
  "sections": [
    {
      "title": "string",
      "description": "brief description of this section's content",
      "type": "chapter|section|subsection|specification",
      "order": 1,
      "content": "detailed content extracted from the document",
      "children": []
    }
  ],
  "metadata": {
    "confidence": 85,
    "notes": "any concerns or observations about the document quality"
  }
}`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // If no API key, generate mock structure for demo
      const mockProjectName = validFiles[0].name.replace(/\.(pdf|png|jpg|jpeg)$/i, '');
      const mockStructure: ParsedProjectStructure = {
        projectName: mockProjectName,
        description: `This project was extracted from "${validFiles[0].name}". The document contains technical specifications and operational procedures for industrial automation systems.`,
        category: 'system-integration',
        sections: [
          {
            title: 'Tổng Quan Hệ Thống',
            description: 'System overview and architecture',
            type: 'chapter',
            order: 1,
            content: 'General system description and architecture overview extracted from the HDVH document.',
            children: [
              {
                title: 'Mục Đích',
                description: 'Purpose and scope',
                type: 'section',
                order: 1,
                children: [],
              },
              {
                title: 'Phạm Vi Áp Dụng',
                description: 'Applicable scope',
                type: 'section',
                order: 2,
                children: [],
              },
            ],
          },
          {
            title: 'Thiết Bị & Vật Tư',
            description: 'Equipment and materials',
            type: 'chapter',
            order: 2,
            content: 'List of equipment, specifications, and materials required.',
            children: [
              {
                title: 'PLC Controller',
                description: 'Programmable Logic Controller specifications',
                type: 'specification',
                order: 1,
                content: 'PLC model and configuration details',
                children: [],
              },
              {
                title: 'Cảm Biến',
                description: 'Sensor specifications',
                type: 'section',
                order: 2,
                children: [],
              },
            ],
          },
          {
            title: 'Quy Trình Vận Hành',
            description: 'Operating procedures',
            type: 'chapter',
            order: 3,
            content: 'Step-by-step operating procedures and safety guidelines.',
            children: [
              {
                title: 'Khởi Động Hệ Thống',
                description: 'System startup procedures',
                type: 'section',
                order: 1,
                children: [],
              },
              {
                title: 'Vận Hành Bình Thường',
                description: 'Normal operation procedures',
                type: 'section',
                order: 2,
                children: [],
              },
              {
                title: 'Dừng Khẩn Cấp',
                description: 'Emergency shutdown',
                type: 'section',
                order: 3,
                children: [],
              },
            ],
          },
          {
            title: 'Bảo Trì',
            description: 'Maintenance procedures',
            type: 'chapter',
            order: 4,
            content: 'Scheduled maintenance tasks and inspection checklists.',
            children: [
              {
                title: 'Bảo Trì Hàng Ngày',
                description: 'Daily maintenance',
                type: 'section',
                order: 1,
                children: [],
              },
              {
                title: 'Bảo Trì Định Kỳ',
                description: 'Periodic maintenance schedule',
                type: 'section',
                order: 2,
                children: [],
              },
            ],
          },
        ],
        metadata: {
          confidence: 75,
          notes: 'Demo mode: AI analysis not available without ANTHROPIC_API_KEY. Structure generated from filename and document metadata.',
        },
      };

      // Generate slug from project name
      const slug = mockProjectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 100);

      // Create project in database
      const projResult = await supabase
        .from('projects')
        .insert({
          slug: slug + '-' + Date.now().toString(36),
          title: mockProjectName,
          category: mockStructure.category,
          status: 'draft',
          description_vi: mockStructure.description,
          parse_status: 'done',
          parse_version: 1,
        } as any)
        .select()
        .single() as any;

      if (projResult.error || !projResult.data) {
        console.error('Project creation error:', projResult.error);
        return NextResponse.json({ error: 'Failed to create project in database' }, { status: 500 });
      }

      const projectData = projResult.data;

      // Create sections recursively - simplified: no parent-child tracking
      for (const section of mockStructure.sections) {
        await supabase
          .from('project_sections')
          .insert({
            project_id: projectData.id,
            parent_id: null,
            title_vi: section.title,
            title_en: section.title,
            description_vi: section.description,
            content_vi: section.content || null,
            type: section.type === 'chapter' ? 'overview' as const : section.type === 'specification' ? 'specs' as const : 'other' as const,
            sort_order: section.order,
            status: 'draft',
            parse_version: 1,
          } as any);

        if (section.children) {
          for (const child of section.children) {
            await supabase
              .from('project_sections')
              .insert({
                project_id: projectData.id,
                parent_id: null,
                title_vi: child.title,
                title_en: child.title,
                description_vi: child.description,
                content_vi: child.content || null,
                type: 'other' as const,
                sort_order: child.order,
                status: 'draft',
                parse_version: 1,
              } as any);
          }
        }
      }

      // Store uploaded file references
      for (const file of validFiles) {
        await supabase.from('project_documents').insert({
          project_id: projectData.id,
          file_name: file.name,
          file_path: file.path,
          file_url: file.url,
          file_size: file.content.length,
          file_type: file.mimeType,
          status: 'done',
        } as any);
      }

      const processingTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        projectId: projectData.id,
        structure: mockStructure,
        processingTime,
        mode: 'demo',
      });
    }

    // Real Anthropic API call
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze these ${validFiles.length} HDVH document(s) and extract the project structure in JSON format. Files:\n${validFiles.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}`,
              },
              ...validFiles.slice(0, 5).map((file) => ({
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: file.mimeType,
                  data: file.content,
                },
              })),
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json({ error: 'AI analysis service error: ' + (errorText.includes('rate') ? 'Rate limit exceeded' : 'Service temporarily unavailable') }, { status: 502 });
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response did not contain valid JSON' }, { status: 422 });
    }

    const parsedStructure: ParsedProjectStructure = JSON.parse(jsonMatch[0]);

    // Create project in database
    const projectSlug = parsedStructure.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);

    const projResult2 = await supabase
      .from('projects')
      .insert({
        slug: projectSlug + '-' + Date.now().toString(36),
        title: parsedStructure.projectName,
        category: parsedStructure.category || 'other',
        status: 'draft',
        description_vi: parsedStructure.description,
        parse_status: 'done',
        parse_version: 1,
      } as any)
      .select()
      .single() as any;

    if (projResult2.error || !projResult2.data) {
      console.error('Project creation error:', projResult2.error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    const projectData2 = projResult2.data;

    // Create sections
    for (const section of parsedStructure.sections) {
      await supabase.from('project_sections').insert({
        project_id: projectData2.id,
        parent_id: null,
        title_vi: section.title,
        title_en: section.title,
        description_vi: section.description,
        content_vi: section.content || null,
        type: section.type === 'chapter' ? 'overview' as const :
              section.type === 'specification' ? 'specs' as const : 'other' as const,
        sort_order: section.order,
        status: 'draft',
        parse_version: 1,
      } as any);

      if (section.children) {
        for (const child of section.children) {
          await supabase.from('project_sections').insert({
            project_id: projectData2.id,
            parent_id: null,
            title_vi: child.title,
            title_en: child.title,
            description_vi: child.description,
            content_vi: child.content || null,
            type: 'other' as const,
            sort_order: child.order,
            status: 'draft',
            parse_version: 1,
          } as any);
        }
      }
    }

    // Store uploaded file references
    for (const file of validFiles) {
      await supabase.from('project_documents').insert({
        project_id: projectData2.id,
        file_name: file.name,
        file_path: file.path,
        file_url: file.url,
        file_size: file.content.length,
        file_type: file.mimeType,
        status: 'done',
      } as any);
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      projectId: projectData2.id,
      structure: parsedStructure,
      processingTime,
      mode: 'ai',
    });
  } catch (error) {
    console.error('Parse API error:', error);
    return NextResponse.json(
      { error: 'Failed to parse documents. Please try again.' },
      { status: 500 }
    );
  }
}