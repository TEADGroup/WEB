import { z } from 'zod';

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  TELEGRAM_ALLOWED_USER_ID: z.string().transform(Number),
  BRIDGE_PORT: z.string().default('3199').transform(Number),
});

export const config = envSchema.parse(process.env);

/**
 * Format a tool input for display in a Telegram message.
 * Hạn chế 256 ký tự để tránh quá nội dung.
 */
export function formatCommandPreview(toolName: string, toolInput: Record<string, unknown>): string {
  let preview = JSON.stringify(toolInput, null, 2);
  if (preview.length > 256) {
    preview = preview.slice(0, 253) + '...';
  }
  return `**Tool:** \`${toolName}\`\n\`\`\`json\n${preview}\n\`\`\``;
}
