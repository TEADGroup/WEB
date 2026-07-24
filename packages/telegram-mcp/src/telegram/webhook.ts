import type { Request, Response } from 'express';
import { config } from '../config.js';
import { updateResponse, getRequest, type PendingRequest } from '../queue/store.js';
import { sendMessage, deleteMessage, editMessageText } from './bot.js';

/**
 * Handle incoming Telegram webhook events.
 * Chỉ xử lý callback_query (bấm nút) từ allowed user.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const body = req.body;

  // ── Callback Query (inline button pressed) ──
  if (body.callback_query) {
    const cq = body.callback_query;
    const fromId = cq.from?.id;
    const data = cq.data as string;       // "approve:<id>" | "deny:<id>"
    const messageId = cq.message?.message_id as number;
    const chatId = cq.message?.chat?.id as number;

    if (fromId !== config.TELEGRAM_ALLOWED_USER_ID) {
      await sendMessage({
        chatId,
        text: '⛔ Bạn không có quyền.',
      });
      res.sendStatus(403);
      return;
    }

    if (!data || !messageId) {
      res.sendStatus(400);
      return;
    }

    const [action, requestId] = data.split(':');
    if (!requestId || !['approve', 'deny'].includes(action)) {
      res.sendStatus(400);
      return;
    }

    const pending = getRequest(requestId);
    if (!pending || pending.status !== 'pending') {
      await editMessageText(chatId, messageId, '⏳ Request này đã được xử lý trước đó.');
      res.sendStatus(200);
      return;
    }

    const newStatus = action === 'approve' ? 'approved' as const : 'denied' as const;
    updateResponse(requestId, newStatus, cq.from?.username || cq.from?.first_name || 'user');

    // Update message
    const emoji = newStatus === 'approved' ? '✅' : '❌';
    const label = newStatus === 'approved' ? 'ĐÃ CHO PHÉP' : 'ĐÃ TỪ CHỐI';
    await editMessageText(
      chatId,
      messageId,
      `${emoji} **${label}**\n${pending.toolName}: \`${JSON.stringify(pending.toolInput)}\``,
    );

    console.log(`[telegram-mcp] ${newStatus.toUpperCase()} request ${requestId}`);
    res.sendStatus(200);
    return;
  }

  // ── Text message (direct command) ──
  if (body.message?.text) {
    const msg = body.message;
    const fromId = msg.from?.id;

    if (fromId !== config.TELEGRAM_ALLOWED_USER_ID) {
      await sendMessage({ chatId: msg.chat.id, text: '⛔ Không có quyền.' });
      res.sendStatus(200);
      return;
    }

    // TODO: xử lý remote commands (/run, /status, etc.)
    await sendMessage({
      chatId: msg.chat.id,
      text: '👋 TEA Bot sẵn sàng. Dùng inline buttons để approve/deny khi Claude cần permission.',
    });
    res.sendStatus(200);
    return;
  }

  res.sendStatus(200);
}
