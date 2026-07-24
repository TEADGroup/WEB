# Plan: Simplify AI HDVH Parser — One-Click, Local AI

## Context

The existing HDVH Parser page (`admin/hdvh-upload/page.tsx`) wraps a powerful backend (`/api/hdvh-parser/auto-create`) in an **overly complex chat interface**: 4 AI provider buttons, quick-command chips, chat bubbles, thinking dots, and a free-text command input that confuses the two-step workflow (upload → chat). The user wants a **clean, one-click experience**: drop a file, optionally give the AI a hint, press "Start AI", and get a project back.

The backend already does everything needed — the `auto-create` API is a single POST that uploads → extracts text + images → calls local Ollama → creates project + sections + images in Supabase. The gap is the front-end UX and a missing `.xlsx` extraction path.

## What We're Building

A simplified, single-purpose admin page at `/admin/hdvh-upload`:

```
┌─────────────────────────────────────────────────┐
│  AI HDVH Parser                                  │
│  Upload → AI phân tích → Tự động tạo dự án       │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐ │
│  │  📤 Drop file here or click to browse       │ │
│  │  Supported: PDF · DOCX · XLSX · PNG · JPG  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  📋 Custom instruction (optional):                │
│  ┌─────────────────────────────────────────────┐ │
│  │ VD: "Tập trung vào thông số kỹ thuật PLC"  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  [ 🚀 Start AI Analysis ]                         │
│                                                   │
│  Progress: ████████░░ 80%                         │
│   ✅ File uploaded                                │
│   🔄 AI đang phân tích...                         │
│   ⏳ Đang tạo dự án...                            │
│                                                   │
│  ✅ Dự án "[project name]" đã tạo thành công!     │
│  [📂 Open Project]                                │
└─────────────────────────────────────────────────┘
```

## Files to Modify / Create (5 files)

### 1. [REPLACE] `apps/web/src/app/[locale]/admin/hdvh-upload/page.tsx`
**Action**: Replace the entire file with a clean single-purpose page.

New page structure:
- **Upload zone**: drag & drop or click, accepts `.pdf .docx .xlsx .png .jpg .jpeg`
- **Custom prompt textarea**: optional text field where the user tells the AI what to focus on (e.g. "Chỉ lấy thông số kỹ thuật PLC và danh mục thiết bị")
- **Start AI button**: single CTA button, disabled until a file is uploaded
- **Progress stepper**: step-by-step status updates (uploaded → extracting → AI parsing → creating project → done)
- **Result card**: success (project name + link to editor) or error (retry button)

Remove everything chat-related: AI_PROVIDERS selector, QUICK_CMDS, ChatBubble, messages state, ai-chat API calls.

Reuse existing patterns from the admin:
- `motion.div` with framer-motion for animations
- `rounded-2xl bg-white/40 backdrop-blur-xl border border-white/20 shadow-premium` card styling
- Gradient buttons with `from-brand-cyan to-brand-blue`

**API call flow**:
1. User submits → call `POST /api/hdvh-parser/auto-create` with `FormData` containing `file` + optional `customPrompt`
2. The API is **synchronous** — it blocks until done (up to 5 min for large docs, `maxDuration: 300`). No polling needed.
3. On success → show result card with link to `./projects-manager/${projectId}`
4. On failure → show error + retry

### 2. [NO CHANGE] `apps/web/src/components/admin/HDVHUpload.tsx`
**Action**: No change needed. This component is only imported by the old `hdvh-upload/page.tsx`. When we replace that page, this component becomes unused (tree-shaken at build). Leave it on disk as reference material.**



### 3. [MODIFY] `apps/web/src/server/modules/hdvh-parser/extract.ts`
**Action**: Add XLSX extraction support.

- Add `extractTextFromXlsx(buffer: Buffer): Promise<string>` function using a library like `xlsx` (SheetJS) or `read-excel-file`
- Converts spreadsheet rows to text with table markers (for AI to parse technical specs)
- Register in the `extractText()` switch for MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

The extraction should preserve:
- Sheet names as section headers
- Column headers
- Row data as structured text with table markers the AI already understands

```typescript
export async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  // Use 'xlsx' to read workbook
  // For each sheet:
  //   Emit === TABLE === ... === END TABLE === markers (already understood by AI)
  // Return combined text
}
```

### 4. [MODIFY] `apps/web/src/app/api/hdvh-parser/auto-create/route.ts`
**Action**: Accept XLSX files (already handled generically if we add extraction).

The route already uses `extractText()` from the switch statement. Once we add XLSX to the switch, it works automatically. Verify the `customPrompt` is passed through (it already is — `formData.get('customPrompt')`).

Also verify that the `requireAdmin()` + `createSupabaseServiceClient()` patterns work for the simplified flow — they do.

### 5. [MODIFY] `apps/web/package.json`
**Action**: Add `xlsx` dependency (or `read-excel-file`).

```json
"dependencies": {
  "xlsx": "^0.18.5"
}
```

Then run `pnpm install`.

### Translation Keys

No new i18n keys needed — `Admin.customPrompt` ("Hướng dẫn AI (tuỳ chọn)") and `Admin.customPromptHint` ("VD: Tài liệu này về hệ thống băng tải...") already exist in both `vi.json` and `en.json`. The page title is already served by `Admin.hdvhUpload` ("HDVH + AI").

## What We DON'T Change

| Area | Why |
|------|-----|
| Shared zod schemas (`@tea/shared`) | Already correct — `project-sections.ts` has the full AI output schema |
| DB migrations | Schema already has `projects`, `project_sections`, `project_documents`, parse_status |
| Sidebar navigation | `/admin/hdvh-upload` stays as-is in the sidebar |
| `auto-create` route logic | It already works — only needs XLSX support |
| `extract` module's existing functions | Add, don't rewrite |
| PDF/DOCX/TXT extraction | Already solid |

## What Happens to the Old Chat Page

The `hdvh-upload/page.tsx` is **replaced** entirely. If the user ever wants the old chat-style interaction, it's still available at `/admin/ai-chat` (the general AI chat page). The old HDVH page's AI provider selection and custom mode settings are redundant with the Settings page (`/admin/settings` → AI Provider tab).

Alternatively, **keep the old page at a different route** (e.g. `hdvh-chat`) if there's concern about losing functionality. But given the user's explicit request for a single-button interface, replacing is cleaner.

## Verification

1. `pnpm dev` — app starts without errors
2. Navigate to `/vi/admin/hdvh-upload` — new page renders
3. Upload a `.docx` file → click "Start AI" → verify:
   - Progress steps appear
   - Text is extracted (check console logs)
   - Ollama parses it (check server logs)
   - Project is created in Supabase
   - Images from DOCX are uploaded to storage
   - Redirect to project editor works
4. Repeat with `.pdf` and `.xlsx` files
5. Test with a custom instruction → verify the instruction appears in the Ollama prompt
6. Test error case: upload unsupported file type → error message shown
7. Old `/admin/ai-chat` page still works independently
