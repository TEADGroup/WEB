/**
 * TEA Telegram MCP Server
 *
 * Architecture:
 *   - MCP stdio transport → Claude Code gọi tools
 *   - HTTP server (port BRIDGE_PORT) → internal bridge API
 *   - Polling Telegram API mỗi 2 giây → nhận callback + text commands
 *
 * Flow remote command:
 *   User gửi tin nhắn Telegram "/run pnpm build"
 *   → bot polling detect → lưu vào queue
 *   → Claude Code gọi tg_check_commands → nhận lệnh → thực thi
 *
 * Flow approval:
 *   Claude Code → tg_request_approval → Telegram nút [✅]/[❌]
 *   User bấm nút → polling detect → update queue → Claude Code poll tg_check_response
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import { z } from 'zod';

import { config, formatCommandPreview } from './config.js';
import {
  createRequest,
  getRequest,
  updateResponse,
  addCommand,
  getPendingCommands,
  markCommandExecuted,
} from './queue/store.js';
import { sendMessage } from './telegram/bot.js';

/* ─── Zod schemas ─── */

const RequestApprovalSchema = z.object({
  toolName: z.string().min(1).describe('Tên tool: Bash, Write, Edit'),
  command: z.string().min(1).describe('Nội dung cần xác nhận'),
});

const CheckResponseSchema = z.object({
  requestId: z.string().min(1).describe('ID từ tg_request_approval'),
});

const SendNotificationSchema = z.object({
  message: z.string().min(1).max(2000).describe('Nội dung Markdown'),
});

const CheckCommandsSchema = z.object({
  ack: z.string().optional().describe('ID command đã thực thi xong'),
});

/* ─── HTTP Server ─── */

const app = express();
app.use(express.json());

// Internal bridge
app.post('/bridge/request-approval', async (req, res) => {
  try {
    const { toolName, command } = z.object({ toolName: z.string(), command: z.string() }).parse(req.body);
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    createRequest(id, toolName, { command });

    const text = [
      '🔔 **Permission Required**',
      '',
      formatCommandPreview(toolName, { command }),
      '',
      '_Request: `' + id + '`_ · _Hết hạn 5 phút_',
    ].join('\n');

    await sendMessage({
      chatId: config.TELEGRAM_ALLOWED_USER_ID,
      text,
      parseMode: 'Markdown',
      replyMarkup: {
        inline_keyboard: [[
          { text: '✅ Cho phép', callback_data: `approve:${id}` },
          { text: '❌ Từ chối', callback_data: `deny:${id}` },
        ]],
      },
    });

    res.json({ requestId: id, status: 'pending' });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.get('/bridge/check-response/:requestId', (req, res) => {
  const pending = getRequest(req.params.requestId);
  if (!pending) return res.json({ status: 'not_found' });
  if (pending.status !== 'pending') return res.json({ status: pending.status, response: pending.response });
  if (Date.now() / 1000 - pending.createdAt > 300) return res.json({ status: 'timed_out' });
  res.json({ status: 'pending' });
});

app.get('/bridge/commands', (_req, res) => {
  res.json({ commands: getPendingCommands() });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/* ─── MCP Server ─── */

const server = new McpServer({ name: 'TEA Telegram Bridge', version: '0.1.0' });

// tg_send_notification — Gửi thông báo
server.tool(
  'tg_send_notification',
  'Gửi tin nhắn Telegram cho chủ project. Dùng để thông báo kết quả, progress, hoặc thông tin cần biết.',
  SendNotificationSchema.shape,
  async ({ message }) => {
    const { messageId } = await sendMessage({
      chatId: config.TELEGRAM_ALLOWED_USER_ID,
      text: message,
      parseMode: 'Markdown',
    });
    return { content: [{ type: 'text', text: JSON.stringify({ sent: true, messageId }) }] };
  },
);

// tg_request_approval — Gửi tin + nút Approve/Deny
server.tool(
  'tg_request_approval',
  'Gửi Telegram kèm nút [Cho phép]/[Từ chối]. Dùng trước khi làm việc quan trọng. ' +
  'Trả về requestId để poll tg_check_response.',
  RequestApprovalSchema.shape,
  async ({ toolName, command }) => {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    createRequest(id, toolName, { command });

    await sendMessage({
      chatId: config.TELEGRAM_ALLOWED_USER_ID,
      text: [
        '🔔 **Permission Required**',
        '',
        formatCommandPreview(toolName, { command }),
        '',
        '_Request: `' + id + '`_ · _Hết hạn 5 phút_',
      ].join('\n'),
      parseMode: 'Markdown',
      replyMarkup: {
        inline_keyboard: [[
          { text: '✅ Cho phép', callback_data: `approve:${id}` },
          { text: '❌ Từ chối', callback_data: `deny:${id}` },
        ]],
      },
    });

    return { content: [{ type: 'text', text: JSON.stringify({ requestId: id, status: 'pending' }) }] };
  },
);

// tg_check_response — Kiểm tra kết quả approve/deny
server.tool(
  'tg_check_response',
  'Kiểm tra người dùng đã bấm nút gì. Trả về pending | approved | denied | timed_out.',
  CheckResponseSchema.shape,
  async ({ requestId }) => {
    const pending = getRequest(requestId);
    if (!pending) return { content: [{ type: 'text', text: JSON.stringify({ status: 'not_found' }) }] };
    if (pending.status !== 'pending') {
      return { content: [{ type: 'text', text: JSON.stringify({ status: pending.status, response: pending.response }) }] };
    }
    if (Date.now() / 1000 - pending.createdAt > 300) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'timed_out' }) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'pending' }) }] };
  },
);

// tg_check_commands — Lấy lệnh từ Telegram
server.tool(
  'tg_check_commands',
  'Lấy danh sách lệnh bạn đã gửi từ Telegram (ví dụ: "/run pnpm build"). ' +
  'Dùng tool này mỗi khi bắt đầu task mới hoặc định kỳ. ' +
  'Gửi ack với ID của command sau khi thực thi xong để đánh dấu đã xử lý.',
  CheckCommandsSchema.shape,
  async ({ ack }) => {
    if (ack) markCommandExecuted(ack);
    const commands = getPendingCommands();
    return { content: [{ type: 'text', text: JSON.stringify({ commands }) }] };
  },
);

/* ─── Telegram Polling ─── */

let lastUpdateId = 0;

async function pollTelegram() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`,
    );
    const data = await res.json() as { ok: boolean; result: Array<Record<string, unknown>> };
    if (!data.ok || !data.result) return;

    for (const update of data.result) {
      lastUpdateId = Math.max(lastUpdateId, update.update_id as number);

      // ── Callback query (bấm nút approve/deny) ──
      const cq = update.callback_query as Record<string, unknown> | undefined;
      if (cq) {
        const fromId = (cq.from as Record<string, unknown>)?.id as number;
        if (fromId !== config.TELEGRAM_ALLOWED_USER_ID) continue;

        const cbData = cq.data as string;
        const [action, requestId] = (cbData || '').split(':');
        if (!requestId || !['approve', 'deny'].includes(action)) continue;

        const pending = getRequest(requestId);
        if (!pending || pending.status !== 'pending') continue;

        const newStatus = action === 'approve' ? 'approved' as const : 'denied' as const;
        updateResponse(requestId, newStatus, String((cq.from as Record<string, unknown>)?.first_name || ''));

        const emoji = newStatus === 'approved' ? '✅' : '❌';
        const label = newStatus === 'approved' ? 'ĐÃ CHO PHÉP' : 'ĐÃ TỪ CHỐI';
        try {
          await fetch(
            `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/editMessageText`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: ((cq.message as Record<string, unknown>)?.chat as Record<string, unknown>)?.id,
                message_id: (cq.message as Record<string, unknown>)?.message_id,
                text: `${emoji} **${label}**\n${pending.toolName}: \`${JSON.stringify(pending.toolInput).slice(0, 200)}\``,
                parse_mode: 'Markdown',
              }),
            },
          );
        } catch { /* ok */ }

        console.log(`[telegram-mcp] ${newStatus} request ${requestId}`);
        continue;
      }

      // ── Text message (remote command) ──
      const msg = update.message as Record<string, unknown> | undefined;
      if (msg?.text) {
        const fromId = (msg.from as Record<string, unknown>)?.id as number;
        if (fromId !== config.TELEGRAM_ALLOWED_USER_ID) continue;

        const text = msg.text as string;
        // Lưu vào queue
        addCommand(text);
        console.log(`[telegram-mcp] Remote command from Telegram: "${text}"`);

        // Reply
        await fetch(
          `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: ((msg.chat as Record<string, unknown>)?.id as number) || config.TELEGRAM_ALLOWED_USER_ID,
              text: `⏳ Đã nhận lệnh! Claude Code sẽ sớm xử lý.`,
            }),
          },
        );
      }
    }
  } catch { /* poll again */ }
}

/* ─── Main ─── */

async function main() {
  app.listen(config.BRIDGE_PORT, '127.0.0.1', () => {
    console.log(`[telegram-mcp] HTTP bridge: http://127.0.0.1:${config.BRIDGE_PORT}`);
    console.log(`[telegram-mcp] Polling mode — webhook not needed`);
  });

  setInterval(() => {
    try {
      const { cleanupOld } = require('./queue/store.js') as typeof import('./queue/store.js');
      cleanupOld(3600);
    } catch { /* ok */ }
  }, 300_000);

  setInterval(pollTelegram, 2000);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('[telegram-mcp] MCP server connected (stdio)');
}

main().catch((err) => {
  console.error('[telegram-mcp] Fatal:', err);
  process.exit(1);
});
