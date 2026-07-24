import type { AiProvider, ParseParams } from '../provider';
import { buildSystemPrompt, buildUserPrompt } from '../prompts';
import { projectSectionsResultSchema } from '@tea/shared';

/**
 * OpenRouter Provider — free tier API access to multiple AI models.
 *
 * Uses OpenRouter's REST API at /v1/chat/completions (OpenAI-compatible).
 * Models available: claude, gemini, llama, etc.
 */
export class OpenRouterProvider implements AiProvider {
  readonly name = 'openrouter';

  constructor(
    private config: { apiKey: string; model: string; baseUrl?: string },
  ) {}

  async parseDocument({ text, language, customPrompt }: ParseParams) {
    const response = await this.callOpenRouter(
      buildSystemPrompt(language),
      buildUserPrompt(text, language, 800000, customPrompt),
    );

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenRouter returned empty response');

    const cleaned = this.extractJson(content);
    if (!cleaned) {
      console.warn('[OpenRouterProvider] Response is not JSON — raw content:', content.slice(0, 300));
      throw new Error('OpenRouter returned non-JSON response');
    }

    const raw = JSON.parse(cleaned);
    const parsed = JSON.parse(JSON.stringify(raw, (_k, v) => v ?? undefined));
    const validation = projectSectionsResultSchema.safeParse(parsed);
    if (validation.success) return validation.data;

    console.warn('[OpenRouterProvider] Validation failed, returning raw data for fallback handling');
    return parsed;
  }

  /** Call OpenRouter chat API (OpenAI-compatible format). */
  private async callOpenRouter(system: string, user: string) {
    const response = await fetch(this.config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://teagroup.vn',
        'X-Title': 'TEA Group HDVH Parser',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.1,
        max_tokens: 800000,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${body.slice(0, 200)}`);
    }

    return response.json();
  }

  /** Extract JSON object from response, handling markdown fences. */
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
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}