# HDVH Parser: Chunking + AI Memory + AI Chat Page

## Context

3 vấn đề cần giải quyết:

1. **AI quá tải / chậm với tài liệu dài** — file Maxkleen 10T 7,319 chars nhưng DOCX dùng `__bold__` thay heading styles. qwen3.5 đọc cả document một lần gây chậm. Cần **chunk theo section** (dùng bold markers làm ranh giới).

2. **AI không nhớ context** — Mỗi lần parse là session mới. Cần **memory** lưu các chỉnh sửa của admin để qwen3.5 học và tái sử dụng.

3. **Không có giao diện chat với AI** — Admin muốn nói chuyện trực tiếp với qwen3.5 qua 1 trang riêng để test prompt, xem model hoạt động thế nào, và tinh chỉnh.

## Plan

### Phần A: Smart chunking — chia tài liệu theo section

**File:** `apps/web/src/server/modules/hdvh-parser/extract.ts`

Thêm `chunkByBoldMarkers()` — tách text thành các section dựa trên `__Bold Title__` markers.

DOCX này có pattern: `__Giao Diện Mặt Tủ__`, `__GIAO DIỆN HMI HỆ THỐNG__`, `__Main Mixer screen (F1)__`, ... Mỗi marker là 1 section.

**File:** `apps/web/src/server/modules/hdvh-parser/providers/ollama.ts`

Cập nhật `parseDocument`: nếu document có nhiều section → gửi từng section riêng lẻ cho AI, sau đó merge kết quả. Section đầu tiên chứa metadata (project title, client...), các section sau chỉ parse nội dung section đó.

### Phần B: AI Memory — lưu bài học qua các lần parse

**File mới:** `apps/web/src/server/modules/hdvh-parser/memory.ts`

```ts
export interface AiMemory {
  typeCorrections: Record<string, string>;  // title → correct type
  promptTips: string[];                      // effective prompts
  updatedAt: string;
}
```

- Lưu vào Supabase `settings` table, key `ai_memory`
- Khi parse: inject memory vào system prompt dạng `"Bài học trước: section X → type=Y"`
- Khi admin sửa section type → tự động cập nhật memory

### Phần C: AI Chat Page — nói chuyện trực tiếp với qwen3.5

**File mới:** `apps/web/src/app/[locale]/admin/ai-chat/page.tsx`
**File mới:** `apps/web/src/app/api/ai-chat/route.ts`

Trang chat đơn giản trong Admin:
- Ô input + send button
- Chat history hiển thị dạng bubble (user / AI)
- Gọi Ollama `/api/chat` qua API route
- Hỗ trợ **memory recall**: admin có thể lưu đoạn chat hữu ích vào memory

**API route flow:**
```
Client → POST /api/ai-chat { message, history[] }
       → Ollama /api/chat { model: qwen3.5, messages: [...history, userMsg] }
       → Response { reply, tokens }
```

**Admin sidebar:** Thêm link "AI Chat" trong admin layout.

### Tổng files

| File | Thay đổi |
|------|----------|
| `extract.ts` | + `chunkByBoldMarkers()` |
| `ollama.ts` | `parseDocument` dùng smart chunking |
| **`memory.ts`** (mới) | `AiMemory` + load/save/apply |
| `prompts.ts` | + `buildMemoryPrompt()` |
| **`ai-chat/page.tsx`** (mới) | Chat UI client component |
| **`api/ai-chat/route.ts`** (mới) | Proxy Ollama chat |
| `admin/layout.tsx` | Thêm link "AI Chat" vào sidebar |
| `vi.json` + `en.json` | Thêm translations |

## Verification

```bash
# Test chunking
node scripts/test-hdvh-real.cjs "Chỉ lấy ảnh Main Mixer"

# Test chat API
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Chào bạn, bạn hiểu tiếng Việt không?"}'
```
