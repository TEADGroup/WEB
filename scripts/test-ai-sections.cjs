/**
 * Test: AI image filtering by section via customPrompt (final verification)
 *
 * Uses the real mammoth output format: ![]([HÌNH: img_N.png])
 */
var http = require('http');

var simulatedMarkdown = [
  '## Tổng quan hệ thống ##',
  '',
  'Hệ thống điều khiển trung tâm cho nhà máy sản xuất thực phẩm.',
  '',
  '![]([HÌNH: img_1.png])',
  '![]([HÌNH: img_2.png])',
  '',
  '## Danh mục thiết bị chính ##',
  '',
  '--- PLC: Siemens S7-1500',
  '--- HMI: Siemens TP1200 Comfort',
  '--- Biến tần: Siemens G120C, 7.5kW',
  '',
  '![]([HÌNH: img_3.png])',
  '![]([HÌNH: img_4.png])',
  '',
  '## Main Mixer ##',
  '',
  'Hệ thống trộn chính motor 37kW, biến tần điều khiển tốc độ.',
  '',
  '![]([HÌNH: img_5.png])',
  '![]([HÌNH: img_6.png])',
  '![]([HÌNH: img_7.png])',
  '',
  '## Tủ điện điều khiển ##',
  '',
  'Tủ điện 2000x800x600mm.',
  '',
  '![]([HÌNH: img_8.png])',
  '',
  '## Quy trình vận hành ##',
  '',
  '--- Bước 1: Kiểm tra nguồn',
  '--- Bước 2: Bật CB chính',
  '',
  '## Cảnh báo an toàn ##',
  '',
  '--- Nguy hiểm điện áp cao',
].join('\n');

var systemPrompt = [
  'Bạn là kỹ sư tự động hoá giàu kinh nghiệm.',
  '![]([HÌNH: img_X.png]) là vị trí hình ảnh trong tài liệu.',
  'Ghi tên file vào image_names của section chứa nó.',
  'Section types: overview, equipment, specs, operating, maintenance, safety, other',
].join('\n');

function buildUserPrompt(customPrompt) {
  var p = 'Phân tích tài liệu HDVH sau và trích xuất cấu trúc.\n\n';
  p += 'TRẢ VỀ JSON: {"sections": [{"type": "...", "title_vi": "...", "title_en": "...", "content_vi": "...", "content_en": "...", "items": ["..."], "image_names": ["img_1.png"]}]}\n\n';
  if (customPrompt) {
    p += 'HƯỚNG DẪN BỔ SUNG TỪ NGƯỜI DÙNG:\n' + customPrompt + '\n\n';
  }
  p += 'TÀI LIỆU:\n' + simulatedMarkdown;
  return p;
}

async function ollamaChat(messages) {
  var resp = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:7b',
      messages: messages,
      stream: false,
      options: { temperature: 0.1 },
    }),
  });
  var data = await resp.json();
  return data.message && data.message.content;
}

function parseResult(content) {
  var cleaned = content.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  return JSON.parse(cleaned);
}

async function runTest(label, customPrompt) {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ' + label);
  console.log('═══════════════════════════════════════════════════\n');
  if (customPrompt) console.log('Custom: ' + JSON.stringify(customPrompt));
  console.log('Expected: 7 sections, 8 images (Main Mixer has 3)\n');
  console.log('Calling Ollama...\n');

  var userPrompt = buildUserPrompt(customPrompt);
  var content = await ollamaChat([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]);
  if (!content) { console.log('NO RESPONSE\n'); return; }

  // Show truncated response
  console.log('--- AI Response (first 1000 chars) ---');
  console.log(content.slice(0, 1000));
  if (content.length > 1000) console.log('...[truncated]');
  console.log('---\n');

  try {
    var p = parseResult(content);
    var total = 0;
    (p.sections || []).forEach(function(s) {
      var imgs = s.image_names || [];
      total += imgs.length;
      console.log('  [' + s.type + '] ' + s.title_vi + (imgs.length ? ' ✅ ' + imgs.length + ' images: ' + imgs.join(', ') : ' ❌ 0 images'));
    });
    console.log('\n  TOTAL IMAGES: ' + total + ' / 8');
    if (customPrompt && total === 3) console.log('  ✅ customPrompt FILTERED correctly (Main Mixer = 3)');
    else if (!customPrompt && total >= 7) console.log('  ✅ Baseline: all/most images returned');
    else console.log('  ⚠️ Unexpected — check AI output');
  } catch (e) {
    console.log('  ❌ JSON parse failed: ' + e.message);
  }
  console.log('');
}

async function main() {
  await runTest('TEST 1: WITHOUT customPrompt (baseline)', undefined);
  await runTest('TEST 2: WITH customPrompt "Main Mixer only"', 'Tôi chỉ muốn lấy hình ảnh của section "Main Mixer". CHỈ liệt kê image_names cho section Main Mixer. KHÔNG liệt kê image_names cho các section khác.');
}

main().catch(console.error);
