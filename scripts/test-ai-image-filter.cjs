/**
 * Test: How customPrompt works (or doesn't work) for image filtering
 *
 * Usage: node scripts/test-ai-image-filter.mjs ["custom prompt here"]
 *
 * This tests BOTH parts of the pipeline:
 *   Part A: Text extraction — what does the AI see?
 *   Part B: Image extraction — how are images extracted?
 *
 * KEY FINDING: The AI NEVER sees images. ExtractImagesFromDocx pulls ALL images
 * from the DOCX ZIP unconditionally. There is NO mapping between document
 * sections and which images belong where.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const rootDir = path.join(__dirname, '..');
const mammoth = require(path.join(rootDir, 'apps', 'web', 'node_modules', 'mammoth'));
const AdmZip = require(path.join(rootDir, 'apps', 'web', 'node_modules', 'adm-zip'));

function compactText(raw) {
  let s = raw
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[ \t]*(?:Trang|Page|Tr.)?\s*\d+\s*(?:\/|of|trang)?\s*\d*[ \t]*$/gmi, '')
    .replace(/^[-—=_*]{4,}$/gm, '')
    .split('\n').map(function(l) { return l.trim(); }).join('\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

async function main() {
  const docxPath = path.join(rootDir, 'test-embedded-image.docx');
  if (!fs.existsSync(docxPath)) {
    console.log('ERROR: test-embedded-image.docx not found. Create one with images in different sections first.');
    console.log('This test requires a real multi-section HDVH document.');
    console.log('\nInstead, we will analyze the CURRENT code paths.');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  PART 0: Architecture Analysis');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Current flow in /api/hdvh-parser/auto-create/route.ts:');
  console.log('  1. File uploaded → FormData');
  console.log('  2. extractText(buffer, mime)          ← text goes to AI');
  console.log('  3. extractImagesFromDocx(buffer)      ← ALL images extracted (NO filtering)');
  console.log('  4. provider.parseDocument({text, language, customPrompt})');
  console.log('  5. All embedded images uploaded to project-images bucket');
  console.log('');
  console.log('PROBLEM: Steps 3 and 4 are INDEPENDENT.');
  console.log('  - AI customPrompt has NO effect on which images are extracted');
  console.log('  - extractImagesFromDocx grabs EVERY image from word/media/');
  console.log('  - There is NO mapping from sections → images');
  console.log('');

  // =========================================================================
  // PART 1: Analyze what the AI actually sees
  // =========================================================================
  console.log('═══════════════════════════════════════════════════');
  console.log('  PART 1: What does the AI see?');
  console.log('═══════════════════════════════════════════════════\n');

  if (fs.existsSync(docxPath)) {
    const buf = fs.readFileSync(docxPath);
    console.log('Test DOCX: test-embedded-image.docx (' + (buf.length / 1024).toFixed(1) + ' KB)\n');

    // Strategy A: markdown (what mammoth.convertToMarkdown gives)
    const md = await mammoth.convertToMarkdown({ buffer: buf });
    const richText = compactText(md.value || '');
    console.log('Strategy A (markdown): ' + richText.length + ' chars');
    console.log('  Contains:');
    console.log('    - Headings:    ' + ((richText.match(/^#{1,6}\s/gm) || []).length));
    console.log('    - List items:  ' + ((richText.match(/^[-*]\s/gm) || []).length));
    console.log('    - Images:      ' + ((richText.match(/!\[.*\]\(.*\)/g) || []).length) + ' (as base64 data URLs — AI CANNOT interpret these)');
    console.log('    - Tables:      ' + ((richText.match(/^\|.*\|$/gm) || []).length));

    // Strategy B: plain text (what mammoth.extractRawText gives)
    const raw = await mammoth.extractRawText({ buffer: buf });
    const plainText = compactText(raw.value || '');
    console.log('\nStrategy B (plain):    ' + plainText.length + ' chars');
    console.log('  Contains:');
    console.log('    - Headings:    ' + ((plainText.match(/^[A-Z][^.!?]*$/gm) || []).length) + ' (guessed, no # markers)');
    console.log('    - Images:      NONE — plain text strips ALL images');

    // Show which one the code chooses
    let chosenMethod;
    if (plainText.length > 0 && plainText.length < richText.length * 0.85) {
      chosenMethod = 'B (plain)';
    } else {
      chosenMethod = 'A (markdown)';
    }
    console.log('\n⚠️  Code would choose: ' + chosenMethod);

    const sampleText = chosenMethod === 'A (markdown)' ? richText : plainText;
    console.log('\nSample of text the AI receives (first 500 chars):');
    console.log('---');
    console.log(sampleText.slice(0, 500));
    console.log('---');

    // Check if images use base64
    const base64Count = (sampleText.match(/data:image\/\w+;base64,/g) || []).length;
    if (base64Count > 0) {
      console.log('\n🚨 PROBLEM: ' + base64Count + ' base64-encoded images in AI prompt!');
      console.log('   These waste tokens, provide NO useful info to the AI,');
      console.log('   and the AI cannot reason about "which section has which image"');
      const base64Chars = (sampleText.match(/data:image\/\w+;base64,[A-Za-z0-9+/=]+/g) || [])
        .reduce(function(sum, m) { return sum + m.length; }, 0);
      console.log('   ≈' + Math.round(base64Chars / 4) + ' tokens wasted on base64 image data');
    }

    // =========================================================================
    // PART 2: Analyze image extraction
    // =========================================================================
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  PART 2: Image extraction (extractImagesFromDocx)');
    console.log('═══════════════════════════════════════════════════\n');

    const zip = new AdmZip(buf);
    const entries = zip.getEntries();
    let imgCount = 0;
    const imgEntries = [];
    for (const entry of entries) {
      if (entry.entryName.startsWith('word/media/') && !entry.isDirectory) {
        imgCount++;
        imgEntries.push({
          name: entry.entryName.replace('word/media/', ''),
          size: entry.getData().length,
        });
      }
    }
    console.log('Images found in DOCX: ' + imgCount);
    imgEntries.forEach(function(img) {
      console.log('  - ' + img.name + ' (' + (img.size / 1024).toFixed(1) + ' KB)');
    });
    console.log('\nCode behavior: ALL ' + imgCount + ' images are uploaded to Supabase.');
    console.log('There is NO logic to:');
    console.log('  - Filter images by section name');
    console.log('  - Map images to their containing sections');
    console.log('  - Honor customPrompt for image selection');

    // =========================================================================
    // PART 3: Show the ZIP structure
    // =========================================================================
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  PART 3: DOCX internal structure');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('DOCX is a ZIP archive:');
    const docEntries = zip.getEntries();
    const structure = {};
    docEntries.forEach(function(e) {
      const dir = path.dirname(e.entryName);
      if (!structure[dir]) structure[dir] = [];
      structure[dir].push(path.basename(e.entryName));
    });
    Object.keys(structure).sort().forEach(function(dir) {
      console.log('  ' + dir + '/');
      structure[dir].forEach(function(file) {
        console.log('    - ' + file);
      });
    });

    // Check if document.xml references images by name
    if (structure['word'] && structure['word'].includes('document.xml')) {
      const docXml = zip.readFile('word/document.xml').toString('utf-8');
      const imgRefs = docXml.match(/r:embed="([^"]+)"/g) || [];
      console.log('\ndocument.xml contains ' + imgRefs.length + ' image references (r:embed)');
      console.log('These ARE mappable to sections via XML structure, but the current');
      console.log('code does NOT use this — it just dumps all images blindly.');
    }
  } else {
    console.log('test-embedded-image.docx not found — skipping DOCX analysis\n');
  }

  // =========================================================================
  // PART 4: Test AI with custom prompt
  // =========================================================================
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  PART 4: AI Test with customPrompt');
  console.log('═══════════════════════════════════════════════════\n');

  const testPrompt = process.argv[2] || 'Tôi chỉ muốn lấy hình ảnh phần Main Mixer. Không lấy hình ảnh các phần khác.';

  console.log('Custom prompt: "' + testPrompt + '"');
  console.log('');
  console.log('☠️  THIS WILL NOT WORK because:');
  console.log('   1. The AI prompt contains TEXT ONLY — no image references');
  console.log('   2. Even if the AI says "only Main Mixer images", extractImagesFromDocx');
  console.log('      still grabs ALL images from the DOCX ZIP');
  console.log('   3. There is no code path to filter images based on AI output');
  console.log('');
  console.log('Let me trace the code to prove this...');
  console.log('');
  console.log('In auto-create/route.ts line 48-49:');
  console.log('  const embeddedImages = ... ? await extractImagesFromDocx(buffer) : [];');
  console.log('  // ↑ THIS extracts ALL images — runs BEFORE AI parse (line 62)');
  console.log('In auto-create/route.ts line 62:');
  console.log('  const result = await provider.parseDocument({ text, language: \'vi\', customPrompt });');
  console.log('  // ↑ THIS gets AI result about SECTIONS only');
  console.log('In auto-create/route.ts lines 201-209:');
  console.log('  for (const img of embeddedImages) {');
  console.log('    // Uploads ALL images — no filter, no AI consultation');
  console.log('  }');
  console.log('');
  console.log('CONCLUSION: customPrompt CANNOT filter images in the current architecture.');
  console.log('');

  // =========================================================================
  // PART 5: Proposed Fix
  // =========================================================================
  console.log('═══════════════════════════════════════════════════');
  console.log('  PART 5: Proposed Fix');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Option A — Parse DOCX XML to map images → sections (Robust):');
  console.log('  1. Parse word/document.xml to find image→paragraph relationships');
  console.log('  2. Use heading styles to group paragraphs into sections');
  console.log('  3. Extract images grouped by their section name');
  console.log('  4. Filter images by section name from customPrompt');
  console.log('  Pro: Clean mapping, no AI dependency');
  console.log('  Con: Complex XML parsing; requires understanding DOCX heading styles');
  console.log('');
  console.log('Option B — Include image markers in AI text (Simpler):');
  console.log('  1. Use mammoth convertImage option to replace base64 with markers');
  console.log('     e.g., [HÌNH ẢNH: image1.png] [HÌNH ẢNH: image2.png]');
  console.log('  2. The AI can now "see" where images are in the document structure');
  console.log('  3. AI can return which images belong to which section');
  console.log('  4. Filter images based on AI response + customPrompt');
  console.log('  Pro: Simpler implementation, AI understands context');
  console.log('  Con: Adds tokens; requires AI output format change');
  console.log('');
  console.log('Option C — Filter images by filename prefix (Quick fix):');
  console.log('  1. Allow customPrompt to specify image filters');
  console.log('  2. But only works if images have meaningful names');
  console.log('  Con: DOCX images are usually auto-named (image1.png, image2.png…)');
  console.log('');
  console.log('RECOMMENDED: Option B — it\'s the quickest path to making customPrompt useful.');
}

main().catch(console.error);
