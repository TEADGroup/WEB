/**
 * Test script: Extract text + images from a DOCX and test AI parsing
 *
 * Usage: node scripts/test-docx-extract.mjs [customPrompt]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function toFileUrl(p) { return pathToFileURL(p).href; }

async function main() {
  const docxPath = join(rootDir, 'test-embedded-image.docx');
  const docxBuffer = readFileSync(docxPath);

  console.log('=== DOCX Extraction Test ===\n');
  console.log('File size:', (docxBuffer.length / 1024).toFixed(1), 'KB\n');

  // ---- Extract images using raw ZIP ----
  const AdmZipModule = await import(toFileUrl(join(rootDir, 'apps', 'web', 'node_modules', 'adm-zip', 'adm-zip.js')));
  const AdmZip = AdmZipModule.default || AdmZipModule;
  const zip = new AdmZip(docxBuffer);
  const entries = zip.getEntries();

  let imageCount = 0;
  const imageNames = [];
  for (const entry of entries) {
    if (!entry.entryName.startsWith('word/media/')) continue;
    if (entry.isDirectory) continue;
    imageCount++;
    imageNames.push(entry.entryName.replace('word/media/', ''));
  }
  console.log('Embedded images:', imageCount);
  imageNames.forEach(function(name) { console.log('   -', name); });

  // ---- Extract text ----
  const mammoth = await import(toFileUrl(join(rootDir, 'apps', 'web', 'node_modules', 'mammoth', 'lib', 'index.js')));

  // Strategy A - markdown
  const md = await mammoth.convertToMarkdown({ buffer: docxBuffer });
  const richText = md.value || '';
  console.log('\nMarkdown extraction:', richText.length, 'chars');

  // Strategy B - plain text
  const raw = await mammoth.extractRawText({ buffer: docxBuffer });
  const plainText = raw.value || '';
  console.log('Plain text extraction:', plainText.length, 'chars');

  // Which one would be chosen?
  let chosenText, chosenMethod;
  if (plainText.length > 0 && plainText.length < richText.length * 0.85) {
    chosenText = plainText;
    chosenMethod = 'plain';
  } else {
    chosenText = richText;
    chosenMethod = 'markdown';
  }
  console.log('Chosen:', chosenMethod, '(' + chosenText.length + ' chars)\n');

  // Print the extracted text
  console.log('=== EXTRACTED TEXT ===');
  console.log(chosenText.slice(0, 3000));
  if (chosenText.length > 3000) {
    console.log('\n... [truncated, ' + (chosenText.length - 3000) + ' more chars]');
  }

  // Save extracted text
  const outputPath = join(rootDir, 'test-docx-text.txt');
  writeFileSync(outputPath, chosenText, 'utf-8');
  console.log('\nFull text saved to: test-docx-text.txt');

  // ---- Test AI parsing ----
  const customPrompt = process.argv[2] || undefined;
  if (customPrompt) {
    console.log('\nCustom prompt:', JSON.stringify(customPrompt));
  } else {
    console.log('\nNo custom prompt provided — AI will parse everything');
  }
  console.log('\n=== Testing AI parsing ===\n');

  // Build prompt
  const systemPrompt = [
    'Bạn là kỹ sư tự động hoá giàu kinh nghiệm, chuyên phân tích tài liệu Hướng dẫn Vận hành (HDVH).',
    'Nhiệm vụ của bạn là trích xuất chính xác cấu trúc dự án từ tài liệu.',
    '',
    'HƯỚNG DẪN ĐỊNH DẠNG:',
    'Tài liệu được trích xuất với các marker cấu trúc sau:',
    '- `## Tiêu đề ##` — tiêu đề section (heading)',
    '- `--- nội dung` — mục trong danh sách',
    '- `=== TABLE === ... === END TABLE ===` — bảng dữ liệu',
    '- `### [PAGE n] ###` — phân cách trang',
  ].join('\n');

  const body = chosenText.slice(0, 25000); // Cap for token

  let userPrompt = 'Phân tích tài liệu HDVH sau đây và trích xuất thông tin có cấu trúc.\n\n';

  userPrompt += [
    'TRẢ VỀ JSON với format:',
    '{',
    '  "project_title_vi": "...",',
    '  "project_title_en": "...",',
    '  "client": "...",',
    '  "location": "...",',
    '  "summary_vi": "...",',
    '  "summary_en": "...",',
    '  "sections": [',
    '    {',
    '      "type": "overview|equipment|specs|operating|maintenance|safety|other",',
    '      "title_vi": "...",',
    '      "title_en": "...",',
    '      "content_vi": "...",',
    '      "content_en": "...",',
    '      "items": ["..."]',
    '    }',
    '  ]',
    '}',
    '',
    'Section types:',
    '- overview: Tổng quan hệ thống',
    '- equipment: Danh mục thiết bị',
    '- specs: Thông số kỹ thuật',
    '- operating: Quy trình vận hành',
    '- maintenance: Quy trình bảo trì',
    '- safety: Cảnh báo an toàn',
    '- other: Khác',
    '',
  ].join('\n');

  if (customPrompt) {
    userPrompt += 'HƯỚNG DẪN BỔ SUNG TỪ NGƯỜI DÙNG:\n' + customPrompt + '\n\n';
  }

  userPrompt += 'TÀI LIỆU:\n' + body;

  // Call Ollama
  console.log('Sending prompt (' + userPrompt.length + ' chars) to Ollama...');
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:7b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      options: { temperature: 0.1 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Ollama error ' + response.status + ':', errText.slice(0, 500));
    return;
  }

  const data = await response.json();
  const content = data.message && data.message.content;

  if (!content) {
    console.error('Ollama returned empty response');
    console.log('Response:', JSON.stringify(data).slice(0, 500));
    return;
  }

  console.log('\n=== AI Raw Response ===');
  console.log(content);
  console.log('=== End AI Response ===\n');

  // Try to parse JSON
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  }
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

  try {
    const parsed = JSON.parse(cleaned);
    console.log('✅ Successfully parsed JSON:');
    console.log('   Project:', parsed.project_title_vi || '—');
    console.log('   Client:', parsed.client || '—');
    console.log('   Location:', parsed.location || '—');
    console.log('   Sections:', parsed.sections ? parsed.sections.length : 0);
    if (parsed.sections) {
      parsed.sections.forEach(function(s, i) {
        console.log('   [' + i + '] type=' + s.type + ' | title="' + s.title_vi + '" | items=' + (s.items ? s.items.length : 0));
      });
    }
    writeFileSync(join(rootDir, 'test-docx-result.json'), JSON.stringify(parsed, null, 2), 'utf-8');
    console.log('\n📄 Result saved to: test-docx-result.json');
  } catch (e) {
    console.error('JSON parse failed:', e.message);
  }
}

main().catch(console.error);
