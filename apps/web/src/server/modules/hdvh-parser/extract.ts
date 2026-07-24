/**
 * Extract text from uploaded document files.
 *
 * Preserves as much structural information as possible (headings, lists,
 * tables) so the AI can accurately identify sections, equipment lists, and
 * technical specifications from HDVH (operation/maintenance manuals).
 */

// ---------------------------------------------------------------------------
// Markers injected into extracted text to delineate structure.
// These are recognised by the AI prompts in prompts.ts.
// ---------------------------------------------------------------------------
export const MARKERS = {
  PAGE:     '\n### [PAGE {n}] ###\n',
  HEADING:  (s: string) => `\n## ${s.trim()} ##\n`,
  TABLE:    (s: string) => `\n=== TABLE ===\n${s}\n=== END TABLE ===\n`,
  LIST:     (s: string) => `\n--- ${s}`,
  /** Image marker — e.g. [HÌNH: img_1.png].  The digit+extension matches the
   *  sequential names assigned during extraction; the same name is used as a
   *  key when filtering which embedded images to upload. */
  IMG_RE:   /\[HÌNH:\s*img_(\d+\.\w+)]/g,
} as const;

/**
 * Combined result: extracted text + captured embedded images with matching
 * sequential names so that `[HÌNH: img_0.png]` in the text refers to the
 * first element in `embeddedImages`.
 */
export interface PdfExtractResult {
  text: string;
  embeddedImages: Array<{ name: string; buffer: Buffer; mime: string }>;
}

/**
 * Extract text AND embedded images from a PDF buffer.
 *
 * Uses pdf-parse v2's getText() for page-wise text and getImage() for
 * embedded images.  Image markers (`[HÌNH: img_N.png]`) are injected at
 * the end of each page's text, matching the format used by DOCX extraction.
 */
export async function extractPdfTextAndImages(buffer: Buffer): Promise<PdfExtractResult> {
  const { PDFParse } = await import('pdf-parse');
  const instance = new PDFParse({ data: buffer });

  // 1. Extract text page by page
  const textResult = await instance.getText();
  const textPages: string[] = [];

  if (textResult.pages?.length) {
    for (const page of textResult.pages) {
      const n = (page as any).num || (textPages.length + 1);
      textPages.push(`${MARKERS.PAGE.replace('{n}', String(n))}\n${((page as any).text ?? '').trim()}`);
    }
  } else if (textResult.text) {
    textPages.push(textResult.text);
  }

  // 2. Extract page screenshots as images (fast: first 5 pages only, 45s timeout).
  const embeddedImages: Array<{ name: string; buffer: Buffer; mime: string }> = [];
  let seq = 0;

  try {
    // getScreenshot renders each page to a PNG buffer — much faster than
    // getImage which scans every embedded object individually.
    const ssResult = await Promise.race([
      instance.getScreenshot({
        first: 5,
        desiredWidth: 600,
        imageBuffer: true,
        imageDataUrl: false,
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('PDF screenshot extraction timed out (>45s)')), 45_000),
      ),
    ]);

    if (ssResult?.pages?.length) {
      for (const page of ssResult.pages) {
        seq++;
        const name = `img_${seq}.png`;
        const data = page.data;
        if (data && data.length > 0) {
          embeddedImages.push({ name, buffer: Buffer.from(data), mime: 'image/png' });
          // Inject marker at the corresponding page's text
          const idx = page.pageNumber - 1;
          if (idx >= 0 && idx < textPages.length) {
            textPages[idx] += `\n[HÌNH: ${name}]`;
          }
        }
      }
    }
  } catch (e) {
    console.warn('[extract] PDF image extraction error (non-fatal):', (e as Error).message);
  }

  await instance.destroy().catch(() => {});

  return { text: compactText(textPages.join('\n\n')), embeddedImages };
}

/**
 * Extract text from a PDF buffer, preserving per-page boundaries.
 *
 * pdf-parse v2.x uses a class-based API (PDFParse).  Create an instance with
 * the buffer, load the document, then get text per page and concatenate with
 * page markers so the AI can reason about document flow.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const instance = new PDFParse({ data: buffer });
    const textResult = await instance.getText();

    // textResult.pages[] gives us per-page content
    if (textResult.pages?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return textResult.pages
        .map((page: any, i: number) => {
          const pageText = page.text ?? '';
          // Inject page marker so the AI knows where page boundaries are
          return `${MARKERS.PAGE.replace('{n}', String(i + 1))}\n${pageText.trim()}`;
        })
        .join('\n\n');
    }

    // Fallback: full-document text if pages[] is unavailable
    return textResult.text || '';
  } catch (e) {
    throw new Error(`PDF extraction failed: ${(e as Error).message}`);
  }
}

/**
 * Post-process extracted text to reduce token count.
 *
 * Strips repeated blank lines, page-number references, and common
 * Vietnamese / English boilerplate that wastes tokens.
 */
function compactText(raw: string): string {
  let s = raw
    // Collapse 3+ consecutive newlines into 2
    .replace(/\n{3,}/g, '\n\n')
    // Strip lines that are only page numbers (e.g. "Trang 1 / 50", "Page 1 of 50")
    .replace(/^[ \t]*(?:Trang|Page|Tr.)?\s*\d+\s*(?:\/|of|trang)?\s*\d*[ \t]*$/gmi, '')
    // Strip repeated separator lines
    .replace(/^[-—=_*]{4,}$/gm, '')
    // Strip leading/trailing whitespace per line
    .split('\n').map((l: string) => l.trim()).join('\n');
  // Final pass — collapse again after trimming
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/**
 * Combined result: extracted text + captured embedded images with matching
 * sequential names so that `[HÌNH: img_0.png]` in the text refers to the
 * first element in `embeddedImages`.
 */
export interface DocxExtractResult {
  text: string;
  embeddedImages: Array<{ name: string; buffer: Buffer; mime: string }>;
}

/**
 * Extract text AND images from a DOCX buffer in a single pass.
 *
 * Uses mammoth's `convertImage` callback to simultaneously:
 *   1. Replace images with compact `[HÌNH: img_N.ext]` markers in the text
 *   2. Capture the image buffer with the SAME sequential name
 *
 * This guarantees that image markers in the text map 1:1 to captured
 * buffers — no fragile ZIP-entry-ordering needed.
 */
export async function extractDocxTextAndImages(buffer: Buffer): Promise<DocxExtractResult> {
  const capturedImages: Array<{ name: string; buffer: Buffer; mime: string }> = [];
  let imageCounter = 0;

  function mimeToExt(mime: string): string {
    const map: Record<string, string> = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
      'image/bmp': 'bmp', 'image/svg+xml': 'svg', 'image/webp': 'webp',
      'image/tiff': 'tif',
    };
    return map[mime] || 'png';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth: any = await import('mammoth');

  const md: { value: string } = await mammoth.convertToMarkdown({ buffer }, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    convertImage: mammoth.images.imgElement(function (image: any) {
      imageCounter++;
      const ext = mimeToExt(image.contentType || 'image/png');
      const name = `img_${imageCounter}.${ext}`;

      // Try to read the image; capture buffer for later filtering/upload.
      // Use `src` so mammoth renders `![]([HÌNH: img_1.png])` — AI can parse this.
      return image.read().then(function (imageBuffer: Buffer) {
        capturedImages.push({ name, buffer: Buffer.from(imageBuffer), mime: image.contentType || 'image/png' });
        return { src: `[HÌNH: ${name}]` };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).catch(function (_err: any) {
        // Image unreadable — still emit a marker so section boundaries are preserved.
        capturedImages.push({ name, buffer: Buffer.alloc(0), mime: 'image/png' });
        return { src: `[HÌNH: ${name} (không đọc được)]` };
      });
    }),
  });

  return { text: compactText(md.value || ''), embeddedImages: capturedImages };
}

/**
 * Extract text from a DOCX buffer.
 *
 * Images are replaced with compact markers (e.g. `[HÌNH: img_1.png]`) instead
 * of base64 data URLs so the AI can reason about which images belong to which
 * sections.  For combined text+image extraction use `extractDocxTextAndImages`.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await extractDocxTextAndImages(buffer);
    return result.text;
  } catch (e) {
    throw new Error(`DOCX extraction failed: ${(e as Error).message}`);
  }
}

/**
 * Extract text from an XLSX buffer.
 *
 * Uses SheetJS (xlsx) to read the workbook, emitting each sheet with table
 * markers that the AI already understands for structured data.
 */
export async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  try {
    // Static require — same reasoning as pdf-parse: webpack ESM wrapping
    // can break CJS module internals.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const parts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      parts.push(`\n## ${sheetName} ##\n`);
      const sheet = workbook.Sheets[sheetName];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const tableLines: string[] = [];
      for (const row of data) {
        if (!row || row.length === 0) continue;
        tableLines.push('| ' + row.map((cell: any) => String(cell ?? '')).join(' | ') + ' |');
      }

      if (tableLines.length > 0) {
        parts.push(MARKERS.TABLE(tableLines.join('\n')));
      }
    }

    return compactText(parts.join('\n\n'));
  } catch (e) {
    throw new Error(`XLSX extraction failed: ${(e as Error).message}`);
  }
}

/**
 * Extract text from a buffer based on MIME type.
 */
export async function extractText(buffer: Buffer, mime: string): Promise<string> {
  switch (mime) {
    case 'application/pdf':
      return extractTextFromPdf(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractTextFromDocx(buffer);
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return extractTextFromXlsx(buffer);
    case 'text/plain':
    case '':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported document type: ${mime}. Use PDF, DOCX, XLSX, or TXT.`);
  }
}

/**
 * Extract embedded images from a DOCX buffer.
 *
 * DOCX is a ZIP archive; images live under word/media/.
 * Returns an array of { name, buffer, mime } objects.
 */
export async function extractImagesFromDocx(buffer: Buffer): Promise<Array<{ name: string; buffer: Buffer; mime: string }>> {
  const images: Array<{ name: string; buffer: Buffer; mime: string }> = [];

  try {
    // Use Node's built-in zlib-based unzip via a simple approach
    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      // Images are in word/media/
      if (!entry.entryName.startsWith('word/media/')) continue;
      if (entry.isDirectory) continue;

      const name = entry.entryName.replace('word/media/', '');
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const mimeMap: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml',
        tiff: 'image/tiff', tif: 'image/tiff', webp: 'image/webp',
      };
      const mime = mimeMap[ext] || 'image/png';
      images.push({ name, buffer: entry.getData(), mime });
    }
  } catch {
    // Fail silently — image extraction is best-effort
    console.warn('[extract] Failed to extract images from DOCX');
  }

  return images;
}

/**
 * Get image filenames in document-xml order from a DOCX buffer.
 *
 * Mammoth processes images in the order they appear in document.xml,
 * assigning indices `img_0`, `img_1`, etc.  This function reads the same
 * document.xml + rels to produce a matching ordered list of real filenames
 * so that `markers[0]` → `orderedNames[0]`.
 *
 * Falls back to alphabetic sort of ZIP entries (best-effort match).
 */
export function getImageNamesInDocumentOrder(buffer: Buffer): string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AdmZip = require('adm-zip') as typeof import('adm-zip');
    const zip = new AdmZip(buffer as unknown as Buffer);

    // Read relationships to map rId → filename
    const relsXml = zip.readAsText('word/_rels/document.xml.rels');
    const rIdToTarget = new Map<string, string>();
    const relRegex = /<Relationship[^>]*\sId="(rId\d+)"[^>]*\sTarget="([^"]+)"/g;
    let relMatch: RegExpExecArray | null;
    while ((relMatch = relRegex.exec(relsXml)) !== null) {
      const target = relMatch[2];
      // Only care about image relationships
      if (target.startsWith('media/')) {
        rIdToTarget.set(relMatch[1], target.replace('media/', ''));
      }
    }

    // Read document.xml to get image references in order
    const docXml = zip.readAsText('word/document.xml');
    const orderedNames: string[] = [];
    // Match <wp:docPr …> or <a:blip r:embed="rIdX" …>
    const embedRegex = /r:embed="(rId\d+)"/g;
    let embedMatch: RegExpExecArray | null;
    while ((embedMatch = embedRegex.exec(docXml)) !== null) {
      const rId = embedMatch[1];
      const name = rIdToTarget.get(rId);
      if (name) orderedNames.push(name);
    }

    return orderedNames;
  } catch {
    // Fallback: return empty — caller will fall through to zip-order names
    return [];
  }
}

/**
 * Split extracted text into sections using bold markers (`__Title__`) as
 * boundaries.  Many Vietnamese HDVH DOCX files use bold text for section
 * headings instead of proper Word heading styles.
 */
export function chunkByBoldMarkers(text: string): Array<{ title: string; content: string }> {
  const chunks: Array<{ title: string; content: string }> = [];
  const lines = text.split('\n');
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    // Match lines that are entirely bold: __Some Title__
    const boldMatch = line.match(/^__\s*([^_].*?[^_])\s*__$/);
    if (boldMatch) {
      const title = boldMatch[1].trim();
      // Filter out short / obviously-not-heading bold lines
      if (title.length >= 4 && title.length <= 80 && !title.startsWith('![')) {
        // Save previous chunk
        if (currentLines.length > 0 || currentTitle) {
          chunks.push({ title: currentTitle || 'Mở đầu', content: currentLines.join('\n') });
        }
        currentTitle = title;
        currentLines = [];
        continue;
      }
    }
    currentLines.push(line);
  }

  // Last chunk
  if (currentLines.length > 0 || currentTitle) {
    chunks.push({ title: currentTitle || 'Mở đầu', content: currentLines.join('\n') });
  }

  return chunks;
}

/**
 * Simple token count approximation (for chunking decisions).
 */
export function estimateTokens(text: string): number {
  // Rough: 4 chars per token for Vietnamese/English mixed text
  return Math.ceil(text.length / 4);
}
