import { config } from '../config.js';

const API_BASE = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

interface SendMessageParams {
  chatId: number | string;
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  replyMarkup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
}

/**
 * Gửi message Telegram. Hỗ trợ Markdown + inline keyboard.
 */
export async function sendMessage(params: SendMessageParams): Promise<{ messageId: number }> {
  const body: Record<string, unknown> = {
    chat_id: params.chatId,
    text: params.text,
    parse_mode: params.parseMode || 'Markdown',
  };

  if (params.replyMarkup) {
    body.reply_markup = JSON.stringify(params.replyMarkup);
  }

  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram sendMessage failed: ${err.slice(0, 300)}`);
  }

  const data = await res.json() as { result: { message_id: number } };
  return { messageId: data.result.message_id };
}

/**
 * Delete a message (dọn dẹp sau khi approved/denied).
 */
export async function deleteMessage(chatId: number | string, messageId: number): Promise<void> {
  await fetch(`${API_BASE}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  });
}

/**
 * Edit inline keyboard của message đã gửi (xóa nút sau khi user bấm).
 */
export async function editMessageReplyMarkup(
  chatId: number | string,
  messageId: number,
  text?: string,
): Promise<void> {
  await fetch(`${API_BASE}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  });
}

/**
 * Edit toàn bộ message text (sau khi user chọn approve/deny).
 */
export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
): Promise<void> {
  await fetch(`${API_BASE}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
    }),
  });
}
