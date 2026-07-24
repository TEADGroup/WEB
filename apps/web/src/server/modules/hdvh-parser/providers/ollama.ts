import type { AiProvider, ParseParams } from '../provider';
import { buildSystemPrompt, buildUserPrompt } from '../prompts';
import { chunkByBoldMarkers } from '../extract';
import { projectSectionsResultSchema } from '@tea/shared';

/**
 * Ollama Provider — local, free, no API key needed.
 *
 * Uses Ollama's REST API at /api/chat.
 * Some local models don't support `response_format`, so we rely on
 * a strict system prompt and post-process markdown fences.
 */
export class OllamaProvider implements AiProvider {
  readonly name = 'ollama';

  constructor(
    private config: { baseUrl: string; model: string },
  ) {}

  async parseDocument({ text, language, customPrompt }: ParseParams) {
    // === Smart chunking by section boundaries (bold markers) ===
    const sections = chunkByBoldMarkers(text);

    if (sections.length <= 1) {
      // Single section or no bold markers found — parse normally
      return this.parseSingle(text, language, customPrompt);
    }

    console.log(`[Ollama] Smart chunked into ${sections.length} sections: ${sections.map(s => s.title).join(', ')}`);

    // Parse first section for metadata (project title, client, location)
    const firstPrompt = buildUserPrompt(sections[0].content, language, 800000, customPrompt);
    const merged = await this.parseSingleRaw(firstPrompt, language, 1, sections.length);

    // Parse remaining sections — each as its own section
    for (let i = 1; i < sections.length; i++) {
      const sectionPrompt = `## ${sections[i].title} ##\n\n${sections[i].content}`;
      const chunkResult = await this.parseSingleRaw(sectionPrompt, language, i + 1, sections.length, customPrompt);
      if (chunkResult.sections && chunkResult.sections.length > 0) {
        merged.sections = [...(merged.sections || []), ...chunkResult.sections];
      }
    }

    console.log(`[Ollama] Merged: ${merged.sections?.length || 0} total sections from ${sections.length} chunks`);
    return merged;
  }

  /** Parse a single prompt (not chunked) — full metadata extraction. */
  private async parseSingle(text: string, language: 'vi' | 'en', customPrompt?: string) {
    const system = buildSystemPrompt(language);
    const user = buildUserPrompt(text, language, 800000, customPrompt);
    const response = await this.callOllama(system, user);

    const content = response.message?.content;
    if (!content) throw new Error('Ollama returned empty response');

    let cleaned = this.extractJson(content);
    // ── Retry once on non-JSON: reduce temperature to 0, append stricter JSON hint ──
    if (!cleaned) {
      console.warn('[OllamaProvider] First attempt non-JSON, retrying with stricter prompt');
      const retrySystem = system + '\n' + (language === 'vi'
        ? 'TUYỆT ĐỐI chỉ xuất JSON, KHÔNG gì khác.'
        : 'ABSOLUTELY output ONLY JSON, NOTHING else.');
      const retryUser = user + '\n' + (language === 'vi'
        ? '\n⚠️ Lần trước bạn KHÔNG xuất JSON. Lần này CHỈ xuất JSON, không thêm từ nào.'
        : '\n⚠️ Previous response was NOT JSON. This time output ONLY valid JSON, no other text.');
      const retryResponse = await this.callOllama(retrySystem, retryUser);
      if (retryResponse.message?.content) {
        cleaned = this.extractJson(retryResponse.message.content);
      }
    }

    if (!cleaned) {
      console.warn('[OllamaProvider] Response is not JSON — raw content:', content.slice(0, 300));
      throw new Error('Ollama returned non-JSON response');
    }

    const raw = JSON.parse(cleaned);
    const parsed = JSON.parse(JSON.stringify(raw, (_k, v) => v ?? undefined));
    const validation = projectSectionsResultSchema.safeParse(parsed);
    if (validation.success) return validation.data;

    console.warn('[OllamaProvider] Validation failed, returning raw data for fallback handling');
    return parsed;
  }

  /** Parse a raw chunk (used by smart chunking & large-doc fallback). */
  private async parseSingleRaw(
    prompt: string,
    language: 'vi' | 'en',
    chunkNum = 1,
    totalChunks = 1,
    customPrompt?: string,
  ) {
    const enrichedPrompt = customPrompt
      ? prompt + '\n\n' + (language === 'vi'
          ? `HƯỚNG DẪN BỔ SUNG (áp dụng cho chunk này):\n${customPrompt}`
          : `ADDITIONAL INSTRUCTION (apply to this chunk):\n${customPrompt}`)
      : prompt;
    const response = await this.callOllama(buildSystemPrompt(language), enrichedPrompt);

    const content = response.message?.content;
    if (!content) return { sections: [] };

    const cleaned = this.extractJson(content);
    if (!cleaned) {
      console.warn(`[Ollama] Chunk ${chunkNum}/${totalChunks} — no JSON found, skipping`);
      return { sections: [] };
    }

    try {
      const raw = JSON.parse(cleaned);
      const parsed = JSON.parse(JSON.stringify(raw, (_k, v) => v ?? undefined));
      const validation = projectSectionsResultSchema.safeParse(parsed);
      if (validation.success) return validation.data;
      return parsed;
    } catch {
      console.warn(`[Ollama] Chunk ${chunkNum}/${totalChunks} parse failed, skipping`);
      return { sections: [] };
    }
  }

  /** Call Ollama chat API. */
  private async callOllama(system: string, user: string) {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: false,
        options: {
          temperature: 0.0,
          num_ctx: 16384,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${body.slice(0, 200)}`);
    }

    return response.json();
  }

  /** Extract JSON object from Ollama response, handling markdown fences. */
  private extractJson(content: string): string | null {
    let cleaned = content.trim();

    // Try markdown fences first
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    // Find outermost { ... }
    if (!cleaned.startsWith('{')) {
      const braceStart = cleaned.indexOf('{');
      const braceEnd = cleaned.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd > braceStart) {
        cleaned = cleaned.slice(braceStart, braceEnd + 1);
      }
    }

    cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

    return cleaned.startsWith('{') ? cleaned : null;
  }

  async ping() {
    try {
      const res = await fetch(`${this.config.baseUrl}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
