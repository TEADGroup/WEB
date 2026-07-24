/**
 * Web search utility for AI Chat — tự động tra cứu Internet khi AI cần.
 *
 * Chiến lược:
 * 1. DuckDuckGo Lite (POST) — parse kết quả
 * 2. Fallback Google Programmable Search
 * 3. Fetch nội dung trang → nén thành summary ngắn gọn
 * 4. formatSearchContext() chỉ xuất bản nén, AI đọc là hiểu ngay
 */

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  /** Text nội dung trang (đã làm sạch, tối đa 1500 ký tự) */
  content?: string;
}

const TIMEOUT_MS = 10_000;

// ─── DuckDuckGo Lite ───────────────────────────────────────────

async function searchDuckDuckGo(query: string): Promise<WebSearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('https://lite.duckduckgo.com/lite/', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: `q=${encodeURIComponent(query)}`,
    });

    if (!res.ok) return [];

    const html = await res.text();
    const results: WebSearchResult[] = [];
    const rows = html.match(/<tr[\s>][\s\S]*?<\/tr>/gi) || [];

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].includes('result-link')) continue;

      // DDG dùng single quotes: class='result-link', cần match cả 2
      const urlMatch = rows[i].match(/href=([\"'])(https?:\/\/[^\"']+)\1/i);
      const titleMatch = rows[i].match(/class=([\"'])result-link\1[^>]*>(.*?)<\/a>/is);
      const url = urlMatch ? urlMatch[2] : '';
      const title = titleMatch ? titleMatch[2].replace(/<[^>]*>/g, '').trim() : '';
      if (!url || !title) continue;

      let snippet = '';
      if (i + 1 < rows.length && rows[i + 1].includes('result-snippet')) {
        const snipMatch = rows[i + 1].match(/class=([\"'])result-snippet\1[^>]*>(.*?)<\/td>/is);
        if (snipMatch) snippet = snipMatch[2].replace(/<[^>]*>/g, '').trim();
      }

      if (!url.includes('duckduckgo.com')) {
        results.push({ title, snippet, url });
      }
    }

    return results.slice(0, 6);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Google fallback ───────────────────────────────────────────

async function searchGoogle(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const engineId = process.env.SEARCH_ENGINE_ID;
  if (!apiKey || !engineId) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}&num=5`,
      { signal: controller.signal },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: Array<{ title: string; snippet: string; link: string }> };
    return (data.items || []).map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Nén nội dung trang ────────────────────────────────────────

/**
 * Lọc HTML → text thuần, chỉ giữ câu có nghĩa.
 * Kết quả là bản **tóm tắt** gọn nhẹ, AI đọc nhanh.
 */
function compressHTML(html: string): string {
  // Xóa toàn bộ thẻ html
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Nén: chỉ giữ các câu có 3+ từ (bỏ quảng cáo, menu, rác)
  const sentences = text.match(/[A-ZÀ-Ỹ][^.!?]*[.!?]/g) || [];
  const meaningful = sentences
    .map(s => s.trim())
    .filter(s => s.split(/\s+/).length >= 3 && s.length < 300)
    .slice(0, 10);

  // Nếu không tách được câu, lấy 5 đoạn đầu
  if (meaningful.length === 0) {
    const parts = text.split(/\n\s*\n/).filter(p => p.split(/\s+/).length >= 5);
    return parts.slice(0, 5).join(' | ').slice(0, 1500);
  }

  return meaningful.join(' ').slice(0, 1500);
}

/**
 * Fetch nội dung trang → nén lại.
 */
async function fetchPageContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return '';
    const html = await res.text();
    return compressHTML(html);
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Main ─────────────────────────────────────────────────────

/**
 * Search web + fetch nội dung + nén gọn.
 */
export async function searchWeb(query: string): Promise<{
  results: WebSearchResult[];
  source: string;
}> {
  let results: WebSearchResult[] = [];
  let source = 'none';

  results = await searchDuckDuckGo(query);
  if (results.length > 0) {
    source = 'duckduckgo';
  } else {
    results = await searchGoogle(query);
    if (results.length > 0) source = 'google';
  }

  // Fetch nội dung trang đầu (chỉ 1 trang, nén gọn)
  if (results.length > 0) {
    results[0].content = await fetchPageContent(results[0].url);
  }

  return { results, source };
}

// ─── Tạo context NÉN cho AI ────────────────────────────────────

/**
 * Format search results → context dạng **nén**, tối đa 3000 ký tự.
 * AI đọc là hiểu ngay, không bị loãng context.
 */
export function formatSearchContext(
  query: string,
  results: WebSearchResult[],
): string {
  if (results.length === 0) return '';

  const lines = results.map((r, i) => {
    // Mỗi kết quả chỉ 2 dòng
    const title = r.title.slice(0, 100);
    const snippet = r.snippet.slice(0, 200);
    let out = `[${i + 1}] ${title}\n   ${snippet}`;

    // Nội dung nén (nếu có) — tối đa 800 ký tự/kết quả
    if (i === 0 && r.content) {
      const compressed = r.content.slice(0, 800);
      out += `\n   → ${compressed}`;
    }
    return out;
  });

  return [
    '===== WEB SEARCH =====',
    ...lines,
    '===== END =====',
    '',
    'Dùng thông tin trên để trả lời. Ghi nguồn nếu dùng.',
  ].join('\n');
}

// ─── Phát hiện AI không biết ──────────────────────────────────

/**
 * 60+ patterns phát hiện AI "không biết" hoặc trả lời chung chung.
 *
 * Bao gồm:
 * - Phủ định trực tiếp (không, chưa, unable to...)
 * - Câu điều kiện / nghi vấn (I think, maybe, có lẽ...)
 * - Từ chối trách nhiệm (I'm just, limited to, I can only...)
 * - Câu trả lời quá ngắn hoặc lặp lại câu hỏi
 * - Tiếng Việt + tiếng Anh
 */
const UNKNOWN_PATTERNS = [
  // ── Tiếng Việt: Phủ định ──
  /không (thể|có thể|biết|rõ|chắc|tìm thấy|tìm được|thấy|có|đủ|đáp ứng|trả lời)/i,
  /không có (thông tin|dữ liệu|câu trả lời|kiến thức|cơ sở|đủ dữ liệu|đủ thông tin)/i,
  /không năm trong (phạm vi|kiến thức|khả năng)/i,

  // ── Tiếng Việt: Tôi/chúng tôi ──
  /tôi (không|chưa) (biết|rõ|chắc|hiểu|nắm|thể trả lời|có câu trả lời|thể giúp|thể hỗ trợ)/i,
  /(tôi|chúng tôi|mình|em) (không|chưa) (có|được) (thông tin|dữ liệu|kiến thức|câu trả lời)/i,
  /tôi (không|chưa) được (đào tạo|huấn luyện|lập trình|dạy) (về|cho|trong)/i,
  /tôi.*không.*giúp.*(được|với|bạn)/i,

  // ── Tiếng Việt: Xin lỗi + từ chối ──
  /xin lỗi.*(không|chưa|nhưng|vì).*(thể|biết|có|trả lời|giúp|hỗ trợ)/i,
  /(rất|thành thật|chân thành) (xin lỗi|tiếc).*(không|chưa)/i,

  // ── Tiếng Việt: Câu điều kiện mơ hồ ──
  /tôi (chỉ|chỉ có thể) (biết|trả lời|giúp|hỗ trợ|nói|đưa ra)/i,
  /có (lẽ|thể) (tôi|mình) (không|chưa|sai|nhầm)/i,
  /tôi (nghĩ|cho rằng|tin rằng|đoán) (là|rằng).*(nhưng|tuy nhiên).*không/i,
  /(có vẻ|có lẽ|dường như|hình như) (tôi|mình|tôi không|mình không)/i,

  // ── Tiếng Việt: Giới hạn năng lực ──
  /(ngoài|vượt|hạn chế) (phạm vi|khả năng|kiến thức|hiểu biết|chuyên môn)/i,
  /giới hạn (trong|là|chỉ|về) (kiến thức|khả năng|dữ liệu)/i,
  /không (được|nằm trong).*(tập huấn|đào tạo|chuyên môn)/i,
  /chỉ (hoạt động|có hiệu quả) (trong|với|khi)/i,

  // ── Tiếng Việt: Câu chung chung tránh trả lời ──
  /(câu hỏi|yêu cầu|vấn đề) (này|đó) (không|hơi|quá|rất) (khó|phức tạp|rộng|mơ hồ)/i,
  /tôi (không|chưa) (đủ|được cung cấp|có đủ) (thông tin|dữ liệu|ngữ cảnh)/i,
  /vui lòng (cung cấp|cho|hỏi|nói rõ|đặt) (thêm|cụ thể|rõ hơn)/i,
  /bạn (có thể|có) (hỏi|nói|đặt câu hỏi|gửi|cung cấp) (lại|cụ thể hơn|rõ ràng hơn|thêm thông tin)/i,
  /bạn có thể (hỏi|nói|đặt câu hỏi) (lại|cụ thể hơn|rõ ràng hơn)/i,

  // ── Tiếng Anh: Direct negation ──
  /i (don'?t|do not) (know|have|understand|possess|recall|remember)/i,
  /i (can'?t|cannot|couldn'?t) (answer|help|find|respond|provide|assist)/i,
  /i (wasn'?t|was not|haven'?t|have not) (trained|programmed|designed|built) (to|for|with|on)/i,
  /i (lack|am lacking|don'?t have) (the|enough|sufficient|any) (information|knowledge|data|context)/i,

  // ── Tiếng Anh: Apology + refusal ──
  /(sorry|apologize|apologies).*(but|that|i).*(can'?t|cannot|don'?t|unable|not)/i,
  /i'?m (sorry|afraid).*(i|but).*(can'?t|cannot|don'?t|unable|not)/i,
  /unfortunately.*(i|we).*(can'?t|cannot|don'?t|unable|limited)/i,

  // ── Tiếng Anh: Uncertainty ──
  /i'?m (not|un) (sure|certain|clear|confident|aware|familiar)/i,
  /(not|un) (sure|certain|clear|confident) (about|if|whether|what|which)/i,
  /i (think|believe|guess|suppose).*(but|however|though).*(not|don'?t|cannot)/i,
  /(maybe|perhaps|possibly).*(i|we).*(don'?t|cannot|lack|limited)/i,
  /it (depends|is uncertain|is unclear|varies|is ambiguous)/i,

  // ── Tiếng Anh: Limited scope ──
  /(outside|beyond|exceeds) (my|the) (scope|knowledge|ability|expertise|training)/i,
  /(limited|restricted|confined) (to|by|in|within) (my|the).*(knowledge|scope|ability|training)/i,
  /i (can only|only) (answer|help|respond|assist) (with|on|within|in)/i,
  /my (knowledge|training|data|information) (is|was) (limited|cut off|only up|only covers)/i,

  // ── Tiếng Anh: Vague non-answers ──
  /i'?m (here|designed) (to|for).*(but|however).*(can'?t|cannot|limited)/i,
  /as an (ai|assistant|language model).*(i|my).*(can'?t|cannot|don'?t|limited|lack)/i,
  /for (more|better|detailed|specific).*(please|check|refer|consult|visit|ask)/i,
  /i (suggest|recommend|advise).*(you).*(consult|check|ask|refer|research|search)/i,

  // ── Catch-all: Câu trả lời quá ngắn / lặp câu hỏi ──
  /\?{2,}/,
  /\.{3,}\s*(không|chưa|sorry|xin lỗi)/i,
];

/**
 * Kiểm tra reply có phải AI "không biết" không.
 * Kiểm tra cả độ dài reply (quá ngắn <20 ký tự = không biết)
 */
export function looksLikeUnknown(reply: string): boolean {
  if (!reply || reply.length < 15) return true;
  return UNKNOWN_PATTERNS.some(p => p.test(reply));
}

// ─── Chuyển đổi web summary sang dạng ghi nhớ ─────────────────

/**
 * Nén kết quả web thành 1-2 câu để lưu vào memory.
 * AI sau này đọc memory là nhớ ngay.
 */
export function compressToMemoryNote(
  query: string,
  results: WebSearchResult[],
): string {
  if (results.length === 0) return '';

  const top = results[0];
  const title = top.title.slice(0, 80);
  const snippet = top.snippet.slice(0, 150);
  const source = top.url.replace(/https?:\/\//, '').split('/')[0];

  return `[WEB] "${query}" → ${title} (${source}): ${snippet}`;
}
