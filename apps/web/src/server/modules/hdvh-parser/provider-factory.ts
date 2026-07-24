import type { AiConfig } from '@tea/shared';
import type { AiProvider } from './provider';
import { OllamaProvider } from './providers/ollama';
import { OpenRouterProvider } from './providers/openrouter';
import { AnthropicProvider } from './providers/anthropic';

/**
 * Factory: creates the appropriate AI provider based on config.
 *
 * Supported providers:
 * - openrouter: OpenRouter API (multiple models via single endpoint)
 * - anthropic: Anthropic Claude API (direct)
 * - ollama: Local Ollama instance (free, offline)
 */

export function createAiProvider(config: AiConfig): AiProvider {
  // Check for provider override via environment variable
  const provider = process.env.AI_PROVIDER || config.provider || 'ollama';

  // === OpenRouter Provider ===
  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY || config.openrouterApiKey;
    const model = process.env.OPENROUTER_MODEL || config.openrouterModel || 'anthropic/claude-3.5-sonnet';
    const baseUrl = process.env.OPENROUTER_BASE_URL || config.openrouterBaseUrl || 'https://openrouter.ai';

    if (!apiKey) {
      throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY in environment or config.');
    }

    console.log(`[ProviderFactory] Creating OpenRouter provider with model: ${model}`);
    return new OpenRouterProvider({ apiKey, model, baseUrl });
  }

  // === Anthropic Provider ===
  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY || config.anthropicApiKey;

    if (!apiKey) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY in environment or config.');
    }

    console.log('[ProviderFactory] Creating Anthropic provider');
    return new AnthropicProvider({ apiKey });
  }

  // === Default: Ollama Provider ===
  const model = process.env.OLLAMA_MODEL || config.ollamaModel || 'qwen2.5vl:7b';
  const baseUrl = process.env.OLLAMA_BASE_URL || config.ollamaBaseUrl || 'http://localhost:11434';
  return new OllamaProvider({ baseUrl, model });
}
