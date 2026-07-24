# @tea/telegram-mcp — Telegram Permission Bridge

MCP Server kết nối Claude Code với Telegram. Khi Claude cần permission (Bash/Write/Edit), bot sẽ gửi tin nhắn Telegram kèm nút [Cho phép]/[Từ chối]. Bạn bấm nút → Claude tiếp tục.

## 🚀 Setup (5 phút)

### Bước 1: Tạo Telegram Bot

1. Mở Telegram → chat với [@BotFather](https://t.me/BotFather)
2. Gửi `/newbot` → đặt tên + username cho bot
3. Copy **token** nhận được

### Bước 2: Lấy User ID

1. Mở Telegram → chat với [@userinfobot](https://t.me/userinfobot)
2. Gửi bất kỳ message nào → copy **user ID** trả về

### Bước 3: Cấu hình

```bash
cd packages/telegram-mcp
cp .env.example .env
```

Sửa `.env`:
```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ALLOWED_USER_ID=123456789
```

### Bước 4: Cài dependencies

```bash
pnpm install
```

### Bước 5: Chạy

```bash
pnpm --filter @tea/telegram-mcp dev
```

⚠️ Telegram webhook cần public HTTPS URL. Có 2 cách:

#### Cách A: Ngrok (nhanh nhất)
```bash
# Terminal khác:
ngrok http 3199

# Lấy forwarding URL (https://xxx.ngrok-free.app)
# Set webhook:
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://xxx.ngrok-free.app/telegram-webhook"
```

#### Cách B: Không cần webhook (test/dev)
Bot vẫn gửi được message (tool `tg_request_approval` dùng sendMessage API). Chỉ callback từ button mới cần webhook. Nếu không có webhook, dùng bridge API trực tiếp:
```bash
# Gửi request → nhận requestId
curl -X POST http://127.0.0.1:3199/bridge/request-approval \
  -H 'Content-Type: application/json' \
  -d '{"toolName":"Bash","command":"pnpm install react"}'

# Poll response (nhận diện thông qua Telegram message text)
curl http://127.0.0.1:3199/bridge/check-response/<requestId>
```

### Bước 6: Cấu hình Claude Code

Thêm vào `.claude/settings.local.json` (hoặc `.claude/settings.json`):

```json
{
  "mcpServers": {
    "telegram-bridge": {
      "command": "node",
      "args": ["packages/telegram-mcp/dist/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "${TELEGRAM_BOT_TOKEN}",
        "TELEGRAM_ALLOWED_USER_ID": "${TELEGRAM_ALLOWED_USER_ID}",
        "BRIDGE_PORT": "3199"
      }
    }
  },
  "hooks": {
    "BeforeToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/permission-bridge.mjs"
      }
    ]
  }
}
```

## 🛠️ MCP Tools

| Tool | Mô tả |
|------|-------|
| `tg_request_approval` | Gửi Telegram message với nút ✅/❌. Trả về `requestId`. |
| `tg_check_response` | Poll kết quả approve/deny cho `requestId`. |
| `tg_send_notification` | Gửi thông báo một chiều (không cần nút). |

## 🔄 Flow

```
Claude Code cần chạy Bash
  → BeforeToolUse hook
    → .claude/hooks/permission-bridge.mjs
      → POST http://127.0.0.1:3199/bridge/request-approval
        → Telegram message: "🔔 Permission Required" + [✅ Cho phép] [❌ Từ chối]
      → Poll /bridge/check-response/<id> mỗi 3 giây
  → User bấm ✅ trên Telegram
    → Telegram webhook → update queue
    → hook poll nhận approved → exit 0
  → Claude Code chạy lệnh
```

## 📁 File Structure

```
packages/telegram-mcp/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── src/
    ├── index.ts              # MCP Server entrypoint (stdio + HTTP)
    ├── config.ts             # Env config + format helpers
    ├── telegram/
    │   ├── bot.ts            # Telegram Bot API (sendMessage, edit, delete)
    │   └── webhook.ts        # Telegram webhook handler (callback_query)
    └── queue/
        └── store.ts          # JSON-based pending request queue
```

## 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Bot không gửi được message | Chat với bot 1 lần trước (bot chỉ gửi được cho user đã từng chat) |
| Webhook không nhận callback | Kiểm tra `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"` |
| Permission bridge timeout | Tăng `BRIDGE_TIMEOUT_MS` (mặc định 5 phút) |
