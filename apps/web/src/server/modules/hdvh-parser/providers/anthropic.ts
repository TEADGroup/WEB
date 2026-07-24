import type { AiProvider, ParseParams } from '../provider';
import { buildSystemPrompt, buildUserPrompt } from '../prompts';
import { projectSectionsResultSchema } from '@tea/shared';
import { Anthropic } from '@anthropic-ai/sdk';

/**
 * Anthropic Provider — direct Claude API access.
 *
 * Uses the official Anthropic SDK for parsing HDVH documents.
 */
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';

  private client: Anthropic;

  constructor(config: { apiKey: string }) {
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async parseDocument({ text, language, customPrompt }: ParseParams) {
    const systemPrompt = buildSystemPrompt(language);
    const userPrompt = buildUserPrompt(text, language, 800000, customPrompt);

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 800000,
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : null;
      if (!content) {
        throw new Error('Anthropic returned empty response');
      }

      const cleaned = this.extractJson(content);
      if (!cleaned) {
        console.warn('[AnthropicProvider] Response is not JSON — raw content:', content.slice(0, 300));
        throw new Error('Anthropic returned non-JSON response');
      }

      const raw = JSON.parse(cleaned);
      const parsed = JSON.parse(JSON.stringify(raw, (_k, v) => v ?? undefined));
      const validation = projectSectionsResultSchema.safeParse(parsed);
      if (validation.success) return validation.data;

      console.warn('[AnthropicProvider] Validation failed, returning raw data for fallback handling');
      return parsed;
    } catch (e) {
      if (e instanceof Error && e.message.includes('validation')) {
        throw e;
      }
      console.error('[AnthropicProvider] Error:', e);
      throw new Error(`Anthropic API error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
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
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.client.apiKey || '',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 10,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}