/**
 * Test script: Extract text + images from a DOCX and test AI parsing
 *
 * Usage: npx tsx scripts/test-docx-extract.ts [customPrompt]
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Simulate the extraction since we can't directly import from the Next.js module
// We'll use mammoth + adm-zip directly for the test
async function main() {
  const docxPath = join(process.cwd(), 'test-embedded-image.docx');
  const docxBuffer = readFileSync(docxPath);

  console.log('=== DOCX Extraction Test ===\n');
  console.log(`File size: ${(docxBuffer.length / 1024).toFixed(1)} KB\n`);

  // ---- Extract images ----
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(docxBuffer);
  const entries = zip.getEntries();

  let imageCount = 0;
  const imageNames: string[] = [];
  for (const entry of entries) {
    if (!entry.entryName.startsWith('word/media/')) continue;
    if (entry.isDirectory) continue;
    imageCount++;
    imageNames.push(entry.entryName.replace('word/media/', ''));
  }
  console.log(`📷 Embedded images: ${imageCount}`);
  imageNames.forEach(name => console.log(`   - ${name}`));

  // ---- Extract text (both strategies) ----
  const mammothMod = await import('mammoth');
  const mammoth = mammothMod as any;

  // Strategy A - markdown
  const md = await mammoth.convertToMarkdown({ buffer: docxBuffer });
  const richText = md.value || '';
  console.log(`\n📝 Markdown extraction: ${richText.length} chars`);

  // Strategy B - plain text
  const raw = await mammoth.extractRawText({ buffer: docxBuffer });
  const plainText = raw.value || '';
  console.log(`📝 Plain text extraction: ${plainText.length} chars`);

  // Which one would be chosen?
  let chosenText: string;
  let chosenMethod: string;
  if (plainText.length > 0 && plainText.length < richText.length * 0.85) {
    chosenText = plainText;
    chosenMethod = 'plain';
  } else {
    chosenText = richText;
    chosenMethod = 'markdown';
  }
  console.log(`✅ Chosen: ${chosenMethod} (${chosenText.length} chars)\n`);

  // Print the extracted text
  console.log('=== EXTRACTED TEXT ===');
  console.log(chosenText.slice(0, 3000));
  if (chosenText.length > 3000) {
    console.log(`\n... [truncated, ${chosenText.length - 3000} more chars]`);
  }

  // Save extracted text to file for inspection
  const outputPath = join(process.cwd(), 'test-docx-text.txt');
  writeFileSync(outputPath, chosenText, 'utf-8');
  console.log(`\n📄 Full text saved to: ${outputPath}`);

  // ---- Now test AI parsing with customPrompt ----
  const customPrompt = process.argv[2] || undefined;

  if (customPrompt) {
    console.log(`\n🔧 Custom prompt: "${customPrompt}"`);
  } else {
    console.log('\n⚠️  No custom prompt provided — AI will parse everything');
  }

  console.log('\n=== Testing AI parsing ===\n');

  // Build the same prompt as the real app would
  const systemPrompt = `Bạn là kỹ sư tự động hoá giàu kinh nghiệm, chuyên phân tích tài liệu Hướng dẫn Vận hành (HDVH) và Bảo trì (O&M Manuals). Nhiệm vụ của bạn là trích xuất chính xác cấu trúc dự án từ tài liệu.

HƯỚNG DẪN ĐỊNH DẠNG:
Tài liệu được trích xuất với các marker cấu trúc sau. Hãy DỰA VÀO CÁC MARKER này để xác định sections:
- \`## Tiêu đề ##\` — tiêu đề section (heading)
- \`--- nội dung\` — mục trong danh sách (list item)
- \`=== TABLE === ... === END TABLE ===\` — bảng dữ liệu (ưu tiên trích xuất thông số kỹ thuật từ đây)
- \`### [PAGE n] ###\` — phân cách trang (giúp theo dõi flow tài liệu)

NGUYÊN TẮC XỬ LÝ:
1. Các dòng bắt đầu bằng \`##\` gần như chắc chắn là heading của section
2. Nội dung ngay sau heading thuộc về section đó
3. Các dòng bắt đầu bằng \`---\` hoặc \`-\` là items trong list
4. Bảng dữ liệu liên quan đến thông số kỹ thuật nên được gán type="specs"
5. Mỗi section phải có nội dung đầy đủ bằng cả tiếng Việt và tiếng Anh`;

  // Simplified user prompt for the test
  const maxChars = 800000;
  const body = chosenText.length > maxChars ? chosenText.slice(0, maxChars) : chosenText;

  const userPrompt = `Phân tích tài liệu HDVH (Hướng dẫn Vận hành) sau đây và trích xuất thông tin có cấu trúc bằng tiếng Việt.

THÔNG TIN CẦN TRÍCH XUẤT:

1. project_title_vi / project_title_en — TÊN DỰ ÁN:
   Tìm trong phần đầu tài liệu. Có thể là tên hệ thống/dây chuyền/máy.

2. client — KHÁCH HÀNG / CHỦ ĐẦU TƯ

3. location — ĐỊA ĐIỂM LẮP ĐẶT

4. summary_vi / summary_en — TÓM TẮT 1-2 câu

5. sections — CÁC MỤC NỘI DUNG CHÍNH

Section types:
- overview: Tổng quan hệ thống
- equipment: Danh mục thiết bị
- specs: Thông số kỹ thuật
- operating: Quy trình vận hành
- maintenance: Quy trình bảo trì
- safety: Cảnh báo an toàn
- other: Khác

ĐỊNH DẠNG ĐẦU RA JSON:
{
  "project_title_vi": "tên dự án (hoặc bỏ trống)",
  "project_title_en": "project name (or empty)",
  "client": "tên khách hàng (hoặc bỏ trống)",
  "location": "địa điểm (hoặc bỏ trống)",
  "summary_vi": "tóm tắt 1-2 câu",
  "summary_en": "1-2 sentence summary",
  "sections": [
    {
      "type": "loại section (chọn 1)",
      "title_vi": "tiêu đề mục",
      "title_en": "section title",
      "content_vi": "nội dung CHI TIẾT ở đây",
      "content_en": "DETAILED content here",
      "items": ["item 1", "item 2"]
    }
  ]
}

LƯU Ý QUAN TRỌNG:
- Luôn luôn điền content_vi và content_en ĐẦY ĐỦ
- KHÔNG thêm section type nào không có trong danh sách
- Trích xuất TẤT CẢ các sections, không bỏ sót
${customPrompt ? `\nHƯỚNG DẪN BỔ SUNG TỪ NGƯỜI DÙNG:\n${customPrompt}\n` : ''}
TÀI LIỆU CẦN PHÂN TÍCH:
${body}`;

  // Call Ollama
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:7b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt.slice(0, 50000) }, // Cap for safety
      ],
      stream: false,
      options: { temperature: 0.1 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`❌ Ollama error ${response.status}: ${errText.slice(0, 500)}`);
    return;
  }

  const data = await response.json();
  const content = data.message?.content;

  if (!content) {
    console.error('❌ Ollama returned empty response');
    console.log('Response:', JSON.stringify(data).slice(0, 500));
    return;
  }

  console.log('🤖 AI Raw Response:');
  console.log(content);

  // Try to parse as JSON
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  }
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

  try {
    const parsed = JSON.parse(cleaned);
    console.log('\n✅ Successfully parsed JSON:');
    console.log(`   Project: ${parsed.project_title_vi || '—'}`);
    console.log(`   Client: ${parsed.client || '—'}`);
    console.log(`   Location: ${parsed.location || '—'}`);
    console.log(`   Sections: ${parsed.sections?.length || 0}`);
    if (parsed.sections) {
      parsed.sections.forEach((s: any, i: number) => {
        console.log(`   [${i}] type=${s.type} | title="${s.title_vi}" | items=${s.items?.length || 0}`);
      });
    }
  } catch (e) {
    console.error('❌ JSON parse failed:', (e as Error).message);
  }
}

main().catch(console.error);
