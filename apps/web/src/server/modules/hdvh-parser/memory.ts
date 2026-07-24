/**
 * AI Memory — persistent learning across parse + chat sessions.
 *
 * Lưu:
 * - Type corrections (HDVH parser)
 * - Prompt tips (từ web search)
 * - Chat notes (lưu thủ công)
 * - **User facts** (tên, sở thích, thông tin cá nhân — tự động học)
 *
 * Saved to Supabase settings table under key `ai_memory`.
 */

export interface UserFact {
  key: string;      // 'user_name', 'user_company', 'user_role', etc.
  value: string;
  learnedAt: string; // ISO timestamp
}

export interface AiMemory {
  /** Learned section type corrections: section title → correct type */
  typeCorrections: Record<string, string>;
  /** Prompts that produced good results */
  promptTips: string[];
  /** Chat snippets saved from AI Chat page */
  chatNotes: string[];
  /** User profile facts (tên, sở thích, v.v.) — tự động học từ chat */
  userFacts: UserFact[];
  /** Last updated ISO timestamp */
  updatedAt: string;
}

/** Empty memory factory. */
export function createEmptyMemory(): AiMemory {
  return {
    typeCorrections: {},
    promptTips: [],
    chatNotes: [],
    userFacts: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Build a prompt snippet that teaches the AI from previous corrections +
 * user profile facts. Returns empty string if memory has no useful data.
 */
export function buildMemoryPrompt(memory: AiMemory | null): string {
  if (!memory) return '';

  const lines: string[] = [];

  // User facts first (quan trọng nhất)
  const facts = memory.userFacts || [];
  if (facts.length > 0) {
    // Format tự nhiên: "Người dùng tên là Minh, làm việc tại XYZ..."
    const factParts = facts.map(f => {
      const labelMap: Record<string, string> = {
        user_name: 'tên',
        user_company: 'làm việc tại',
        user_role: 'vai trò',
        user_phone: 'số điện thoại',
      };
      const label = labelMap[f.key] || f.key.replace('user_', '');
      return `${label}: ${f.value}`;
    });
    lines.push(`\nNgười dùng: ${factParts.join(', ')}. Hãy nhớ thông tin này và xưng hô phù hợp.`);
  }

  // Type corrections (HDVH parser)
  const corrections = Object.entries(memory.typeCorrections || {});
  if (corrections.length > 0) {
    lines.push('\nBÀI HỌC TỪ CÁC LẦN PARSE TRƯỚC:');
    for (const [title, type] of corrections.slice(0, 10)) {
      lines.push(`- Section "${title}" → type="${type}"`);
    }
  }

  // Prompt tips (từ web search)
  const tips = memory.promptTips || [];
  if (tips.length > 0) {
    lines.push('\nKIẾN THỨC ĐÃ HỌC TỪ WEB:');
    for (const tip of tips.slice(0, 5)) {
      lines.push(`- ${tip}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : '';
}

/**
 * Record a type correction to memory (merges with existing).
 */
export function recordTypeCorrection(memory: AiMemory, title: string, type: string): AiMemory {
  return {
    ...memory,
    typeCorrections: { ...memory.typeCorrections, [title]: type },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add a prompt tip to memory (keeps max 20).
 */
export function recordPromptTip(memory: AiMemory, tip: string): AiMemory {
  const tips = [tip, ...(memory.promptTips || [])].slice(0, 20);
  return { ...memory, promptTips: tips, updatedAt: new Date().toISOString() };
}

/**
 * Add a chat note (keeps max 50).
 */
export function recordChatNote(memory: AiMemory, note: string): AiMemory {
  const notes = [note, ...(memory.chatNotes || [])].slice(0, 50);
  return { ...memory, chatNotes: notes, updatedAt: new Date().toISOString() };
}

// ─── User Facts ────────────────────────────────────────────────

/**
 * Thêm hoặc cập nhật một user fact.
 * Nếu key đã tồn tại, cập nhật value + thời gian.
 */
export function recordUserFact(memory: AiMemory, key: string, value: string): AiMemory {
  const facts = (memory.userFacts || []).filter(f => f.key !== key);
  facts.push({ key, value, learnedAt: new Date().toISOString() });
  return { ...memory, userFacts: facts, updatedAt: new Date().toISOString() };
}

/**
 * Xoá một user fact theo key.
 */
export function removeUserFact(memory: AiMemory, key: string): AiMemory {
  return {
    ...memory,
    userFacts: (memory.userFacts || []).filter(f => f.key !== key),
    updatedAt: new Date().toISOString(),
  };
}

	// ─── Pattern phát hiện user giới thiệu ────────────────────────

	// Danh sách từ khoá vai trò để tránh nhầm với tên
	const ROLE_WORDS = ['kỹ sư','sinh viên','nhân viên','giám đốc','trưởng phòng',
		'chuyên viên','lập trình viên','học sinh','quản lý','kỹ thuật viên','kế toán',
		'thực tập sinh','trợ lý','bảo vệ','tạp vụ','điều dưỡng','bác sĩ','luật sư'];

	const ROLE_PATTERN = ROLE_WORDS.join('|');

	const INTRO_PATTERNS: Array<{ regex: RegExp; factKey: string; extract: (match: string[]) => string }> = [
	  // Tiếng Việt: "tôi là kỹ sư", "em là sinh viên" (ưu tiên trước name)
	  { regex: new RegExp(`(?:tôi|mình|em|anh|chị)\\s+là\\s+(?:một\\s+)?(?:${ROLE_PATTERN})`, 'i'), factKey: 'user_role', extract: m => (m[0] || '').replace(/tôi|mình|em|anh|chị|là|một/gi, '').trim() },
	  // Tiếng Anh: "I'm a engineer"
	  { regex: /(?:i'?m a|i am a)\s+(?:engineer|student|employee|manager|director|developer|designer|technician|operator|consultant)\s*(?:[A-Za-z\s]+?)?(?:\s*[,.]|\s*and|\s*at|\s*$)/i, factKey: 'user_role', extract: m => (m[0] || '').replace(/i'?m a|i am a/gi, '').trim() },
	  // Tên: "tôi tên là Minh", "my name is John" (sau role để tránh nhầm)
	  { regex: /(?:tôi|mình|em|anh|chị)\s+(?:tên\s+(?:là\s+)?|gọi\s+(?:là\s+)?)\s*((?:[A-ZÀ-ỸẠ-Ỵ][a-zà-ỹạ-ỵ]+(?:\s+[A-ZÀ-ỸẠ-Ỵ][a-zà-ỹạ-ỵ]+)?))/i, factKey: 'user_name', extract: m => m[1] || '' },
	  { regex: /(?:my name is|i'?m |i am |call me )\s*((?:Mr\.?|Ms\.?|Mrs\.?)?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i, factKey: 'user_name', extract: m => (m[1] || '').trim() },
	  // Nơi làm việc
	  { regex: /(?:tôi|mình|em)\s+(?:làm việc|đang làm|làm)\s+(?:tại|ở|cho)\s+([A-ZÀ-ỸẠ-Ỵ][A-Za-zÀ-ỹẠ-ỵ\s]+?)(?:\s*[,.]|\s*và|\s*$)/i, factKey: 'user_company', extract: m => (m[1] || '').trim() },
	  { regex: /(?:i work at|i work for|i'?m working at|i'?m working for)\s+([A-Z][A-Za-z\s.]+?)(?:\s*[,.]|\s*and|\s*$)/i, factKey: 'user_company', extract: m => (m[1] || '').trim() },
	  // Số điện thoại
	  { regex: /(?:sđt|số điện thoại|điện thoại|phone|dtdd)\s+(?:của\s+(?:tôi|mình))?\s*(?:là\s+)?(\+?\d[\d\s\-.]{7,15})/i, factKey: 'user_phone', extract: m => (m[1] || '').trim() },
	  // Email
	  { regex: /(?:email|e-mail|mail|hòm thư)\s+(?:của\s+(?:tôi|mình))?\s*(?:là\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i, factKey: 'user_email', extract: m => (m[1] || '').trim() },
	];

/**
 * Phát hiện user giới thiệu thông tin cá nhân trong câu hỏi.
 * Trả về mảng {key, value} nếu tìm thấy.
 */
export function detectUserFacts(message: string): Array<{ key: string; value: string }> {
  const facts: Array<{ key: string; value: string }> = [];
  const seen = new Set<string>();
  for (const pattern of INTRO_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      const value = pattern.extract(match);
      if (value && value.length < 100 && !seen.has(pattern.factKey)) {
        seen.add(pattern.factKey);
        facts.push({ key: pattern.factKey, value });
      }
    }
  }
  return facts;
}
