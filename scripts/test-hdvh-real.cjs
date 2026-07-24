/**
 * Full pipeline test: Real HDVH DOCX → extract → AI parse → filter images
 *
 * Usage: node scripts/test-hdvh-real.cjs "custom prompt here"
 */
const fs = require('fs');
const path = require('path');
const mammoth = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'mammoth'));

const DOCX_PATH = path.join(__dirname, '..', 'apps', 'web', 'src', 'HDVH-Maxkleen 10T New- Wipro Unza-02072026.docx');

// --- Copy of extract.ts logic (compactText + extractDocxTextAndImages) ---
function compactText(raw) {
  let s = raw
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[ \t]*(?:Trang|Page|Tr.)?\s*\d+\s*(?:\/|of|trang)?\s*\d*[ \t]*$/gmi, '')
    .replace(/^[-—=_*]{4,}$/gm, '')
    .split('\n').map(function(l) { return l.trim(); }).join('\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

function mimeToExt(mime) {
  var map = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
    'image/bmp': 'bmp', 'image/svg+xml': 'svg', 'image/webp': 'webp',
    'image/tiff': 'tif',
  };
  return map[mime] || 'png';
}

async function extractDocxTextAndImages(buffer) {
  var capturedImages = [];
  var imageCounter = 0;

  var result = await mammoth.convertToMarkdown({ buffer: buffer }, {
    convertImage: mammoth.images.imgElement(function(image) {
      imageCounter++;
      var ext = mimeToExt(image.contentType || 'image/png');
      var name = 'img_' + imageCounter + '.' + ext;
      return image.read().then(function(imageBuffer) {
        capturedImages.push({ name: name, buffer: Buffer.from(imageBuffer), mime: image.contentType || 'image/png' });
        return { src: '[HÌNH: ' + name + ']' };
      }).catch(function() {
        capturedImages.push({ name: name, buffer: Buffer.alloc(0), mime: 'image/png' });
        return { src: '[HÌNH: ' + name + ' (không đọc được)]' };
      });
    }),
  });

  return { text: compactText(result.value || ''), embeddedImages: capturedImages };
}

// --- AI prompts (mirrors prompts.ts) ---
function buildSystemPrompt() {
  return [
    'Bạn là kỹ sư tự động hoá giàu kinh nghiệm, chuyên phân tích tài liệu HDVH.',
    '',
    'HƯỚNG DẪN ĐỊNH DẠNG:',
    '- `## Tiêu đề ##` — tiêu đề section (heading)',
    '- `--- nội dung` — mục trong danh sách',
    '- `![]([HÌNH: img_N.png])` — vị trí hình ảnh (ghi tên file vào image_names của section chứa nó)',
    '- `=== TABLE === ... === END TABLE ===` — bảng dữ liệu',
    '',
    'NGUYÊN TẮC:',
    '1. `##` là heading của section',
    '2. Nội dung sau heading thuộc section đó',
    '3. Ghi marker [HÌNH: img_N.png] vào image_names[] của section chứa nó',
    '4. Nếu người dùng yêu cầu CHỈ lấy ảnh section cụ thể, CHỈ liệt kê image_names cho section đó',
    '5. Mỗi section phải có content song ngữ Việt + Anh',
  ].join('\n');
}

function buildUserPrompt(text, customPrompt) {
  var p = 'Phân tích tài liệu HDVH sau đây và trích xuất thông tin có cấu trúc.\n\n';

  p += 'THÔNG TIN CẦN TRÍCH XUẤT:\n';
  p += '1. project_title_vi / project_title_en — TÊN DỰ ÁN\n';
  p += '2. client — KHÁCH HÀNG\n';
  p += '3. location — ĐỊA ĐIỂM\n';
  p += '4. summary_vi / summary_en — TÓM TẮT\n';
  p += '5. sections — CÁC MỤC NỘI DUNG + image_names\n\n';

  p += 'Section types: overview, equipment, specs, operating, maintenance, safety, other\n\n';

  p += 'ĐỊNH DẠNG JSON:\n';
  p += '{\n';
  p += '  "project_title_vi": "...",\n';
  p += '  "project_title_en": "...",\n';
  p += '  "client": "...",\n';
  p += '  "location": "...",\n';
  p += '  "summary_vi": "...",\n';
  p += '  "summary_en": "...",\n';
  p += '  "sections": [\n';
  p += '    {\n';
  p += '      "type": "overview|equipment|specs|operating|maintenance|safety|other",\n';
  p += '      "title_vi": "...",\n';
  p += '      "title_en": "...",\n';
  p += '      "content_vi": "...",\n';
  p += '      "content_en": "...",\n';
  p += '      "items": ["..."],\n';
  p += '      "image_names": ["img_1.png"]\n';
  p += '    }\n';
  p += '  ]\n';
  p += '}\n\n';

  if (customPrompt) {
    p += 'HƯỚNG DẪN BỔ SUNG TỪ NGƯỜI DÙNG:\n' + customPrompt + '\n\n';
  }

  p += 'TÀI LIỆU CẦN PHÂN TÍCH:\n' + text;
  return p;
}

// --- JSON parser (mirrors ollama.ts fix) ---
function parseOllamaResponse(content) {
  var cleaned = content.trim();

  // Try markdown fences
  var fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try { ... } block
  if (!cleaned.startsWith('{')) {
    var braceStart = cleaned.indexOf('{');
    var braceEnd = cleaned.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
      cleaned = cleaned.slice(braceStart, braceEnd + 1);
    }
  }

  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  return JSON.parse(cleaned);
}

// --- Main ---
async function main() {
  var customPrompt = process.argv[2] || 'Tôi chỉ muốn lấy hình ảnh trong section "Main Mixer". CHỈ liệt kê image_names cho section Main Mixer. KHÔNG liệt kê image_names cho các section khác.';

  // === STEP 1: Extract ===
  console.log('═══════════════════════════════════════════════════');
  console.log('  STEP 1: Extract text + images from DOCX');
  console.log('═══════════════════════════════════════════════════\n');

  var docxPath = DOCX_PATH;
  if (!fs.existsSync(docxPath)) {
    console.error('❌ File not found: ' + docxPath);
    process.exit(1);
  }
  var buf = fs.readFileSync(docxPath);
  console.log('File: ' + path.basename(docxPath));
  console.log('Size: ' + (buf.length / 1024).toFixed(1) + ' KB\n');

  var extracted = await extractDocxTextAndImages(buf);
  var text = extracted.text;
  var allImages = extracted.embeddedImages;

  console.log('Text extracted: ' + text.length + ' chars (~' + Math.round(text.length / 4) + ' tokens)');
  console.log('Images found:   ' + allImages.length);
  allImages.forEach(function(img, i) {
    console.log('  [' + i + '] ' + img.name + ' (' + (img.buffer.length / 1024).toFixed(1) + ' KB, ' + img.mime + ')');
  });

  // Show document structure summary
  var headings = text.match(/##\s+.+?\s+##/g) || [];
  console.log('\nHeadings found: ' + headings.length);
  headings.forEach(function(h) { console.log('  ' + h.trim()); });

  // Show image marker positions
  var imgMarkers = text.match(/\[HÌNH:\s*img_\d+\.\w+]/g) || [];
  console.log('Image markers in text: ' + imgMarkers.length);
  imgMarkers.forEach(function(m) { console.log('  ' + m); });

  // Save extracted text for inspection
  fs.writeFileSync(path.join(__dirname, '..', 'test-hdvh-real-text.txt'), text, 'utf-8');
  console.log('\n📄 Full text saved to: test-hdvh-real-text.txt');

  // === STEP 2: AI Parse ===
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  STEP 2: AI Parse with customPrompt');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Custom prompt: ' + JSON.stringify(customPrompt));
  console.log('Sending to Ollama qwen2.5:7b...\n');

  var systemPrompt = buildSystemPrompt();
  var userPrompt = buildUserPrompt(text, customPrompt);

  // Cap text if too large for model context
  var maxPromptChars = 50000;
  if (userPrompt.length > maxPromptChars) {
    console.log('⚠️  Prompt too large (' + userPrompt.length + ' chars), capping to ' + maxPromptChars);
    userPrompt = userPrompt.slice(0, maxPromptChars);
  }

  var resp = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      options: { temperature: 0.1, num_ctx: 8192 },
    }),
  });

  if (!resp.ok) {
    console.error('❌ Ollama error ' + resp.status + ': ' + (await resp.text()).slice(0, 300));
    process.exit(1);
  }

  var data = await resp.json();
  var content = data.message && data.message.content;
  if (!content) {
    console.error('❌ Ollama returned empty response');
    process.exit(1);
  }

  console.log('--- AI Response (first 2000 chars) ---');
  console.log(content.slice(0, 2000));
  if (content.length > 2000) console.log('...[truncated, ' + content.length + ' total chars]');
  console.log('---\n');

  // === STEP 3: Parse + Filter ===
  console.log('═══════════════════════════════════════════════════');
  console.log('  STEP 3: Parse JSON + Filter images');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    var parsed = parseOllamaResponse(content);

    console.log('✅ JSON parsed OK');
    console.log('   Project: ' + (parsed.project_title_vi || '—'));
    console.log('   Client:  ' + (parsed.client || '—'));
    console.log('   Location: ' + (parsed.location || '—'));

    var sections = parsed.sections || [];
    console.log('   Sections: ' + sections.length + '\n');

    // Build allowed image names set
    var allowedImageNames = new Set();
    var hasImageNames = false;

    sections.forEach(function(s, i) {
      var imgs = s.image_names || [];
      if (imgs.length > 0) {
        hasImageNames = true;
        imgs.forEach(function(n) { allowedImageNames.add(n); });
      }
      console.log('   [' + i + '] type=' + s.type + ' | ' + s.title_vi);
      console.log('       items=' + (s.items || []).length + ' | images=' + (imgs.length > 0 ? imgs.join(', ') : '(none)'));
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  FILTER RESULTS');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('Total images in DOCX:   ' + allImages.length);
    console.log('Images AI keeps:        ' + allowedImageNames.size);
    if (hasImageNames) {
      console.log('Allowed names:          ' + Array.from(allowedImageNames).join(', '));
    } else {
      console.log('⚠️  AI did NOT return image_names → all images would be kept (fallback)');
    }

    var kept = 0, skipped = 0;
    allImages.forEach(function(img) {
      var keep = !hasImageNames || allowedImageNames.has(img.name);
      if (keep) {
        kept++;
        console.log('  ✅ KEPT:    ' + img.name + ' (' + (img.buffer.length / 1024).toFixed(1) + ' KB)');
      } else {
        skipped++;
        console.log('  ❌ SKIPPED: ' + img.name + ' (' + (img.buffer.length / 1024).toFixed(1) + ' KB)');
      }
    });

    console.log('\n📊 Result: ' + kept + ' kept, ' + skipped + ' skipped (out of ' + allImages.length + ' total)');
    if (hasImageNames && skipped > 0) {
      console.log('✅ Image filtering WORKS — customPrompt successfully filtered images!');
    }

    // Save result
    fs.writeFileSync(
      path.join(__dirname, '..', 'test-hdvh-real-result.json'),
      JSON.stringify({ parsed: parsed, filter: { total: allImages.length, kept: kept, skipped: skipped, allowed: Array.from(allowedImageNames) } }, null, 2),
      'utf-8'
    );
    console.log('\n📄 Full result saved to: test-hdvh-real-result.json');

  } catch (e) {
    console.error('❌ Parse failed: ' + e.message);
    console.error('\nRaw content that failed to parse:');
    console.error(content.slice(0, 500));
    process.exit(1);
  }
}

main().catch(function(e) { console.error(e); process.exit(1); });
