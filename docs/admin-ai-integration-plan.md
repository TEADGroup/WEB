# 🤖 Admin AI Integration - Revised Plan (2026-07-22)

## 🎯 Mục Tiêu

1. **Xoá trang AI Router riêng** → gộp vào Import HDVH
2. **Import HDVH = 1 trang duy nhất**: Upload file + AI command center + Provider selector
3. **Thêm Gemini** vào danh sách AI providers
4. **Settings** cho phép cấu hình API Key cho tất cả providers
5. **AI tự động phân tích** file HDVH và tạo project

---

## 📋 Step-by-Step

### Phase 1: Clean up ✂️
- [ ] Xoá file: `app/[locale]/admin/ai-router/page.tsx`
- [ ] Xoá file: `app/api/ai-router/route.ts`
- [ ] Update sidebar: bỏ AI Router, giữ HDVH & AI
- [ ] Update locale: bỏ aiRouter key

### Phase 2: Rewrite Import HDVH 🚀
- [ ] **Single unified page**: Upload Zone ở trên, AI chat box ở dưới
- [ ] **Provider selector**: Ollama (local) / Claude / Gemini
- [ ] **Upload file** → AI tự phân tích → tạo project
- [ ] **AI command** → phân tích dữ liệu, trả lời câu hỏi
- [ ] **Quick commands**: PLC, VFD, SCADA, HDVH analysis

### Phase 3: Add Gemini Support 🤖✨
- [ ] **Gemini API**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- [ ] **Model list**: gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-pro
- [ ] **Settings**: Thêm Gemini vào AI Provider config

### Phase 4: Update Settings ⚙️
- [ ] Thêm Gemini tab/option trong AI Provider settings
- [ ] Cho phép cấu hình: API Key, Model, Temperature
- [ ] Hiển thị trạng thái kết nối

### Phase 5: Update AI Router API 🔄
- [ ] Sửa `api/ai-router/route.ts` thành `api/hdvh-ai/route.ts`
- [ ] Thêm Gemini provider handler
- [ ] Smart routing: Ollama(local) → Gemini(fast) → Claude(best)

---

## 🏗️ Architecture

```
User Uploads File + Types Command
        ↓
  ┌─────────────────────┐
  │   Import HDVH Page  │  ← Single unified interface
  │  - Upload documents │
  │  - AI Command chat  │
  │  - Provider switch  │
  └─────────┬───────────┘
            ↓
  ┌─────────────────────┐
  │   /api/hdvh-ai      │  ← Unified AI API
  │  - Parse documents  │
  │  - Answer questions │
  │  - Extract specs    │
  └─────────┬───────────┘
            ↓
  ┌─────────────────────────────────┐
  │  AI Provider Router             │
  │  Ollama(dev) → Gemini(fast)     │
  │  → Claude/Anthropic(best)       │
  └─────────────────────────────────┘
```

## 🔧 API Keys in Settings

Settings page sẽ có **AI Provider** tab với:
- **Anthropic**: API Key, Model (Claude 3.5 Sonnet, Opus, Haiku)
- **Gemini**: API Key, Model (Gemini 1.5 Pro, Flash, 2.0 Pro) ← **NEW**
- **Ollama**: Model name (local, no API key needed)
- **OpenAI**: API Key, Model (GPT-4o, GPT-4 Turbo)

Mỗi provider có:
- Key show/hide toggle
- Model selector
- Connection test button
- Status indicator

## 📦 File Changes

| File | Action | Description |
|------|--------|-------------|
| `admin/ai-router/page.tsx` | 🗑️ DELETE | Xoá trang riêng |
| `api/ai-router/route.ts` | 🗑️ DELETE | Xoá API riêng |
| `admin/hdvh-upload/page.tsx` | ✏️ REWRITE | Single unified page |
| `components/admin/HDVHUpload.tsx` | ✏️ UPDATE | Add AI command + provider |
| `api/hdvh-ai/route.ts` | ✨ NEW | Unified AI API (Merge parse + router) |
| `api/hdvh-parser/parse/route.ts` | ✏️ UPDATE | Add Gemini support |
| `admin/settings/page.tsx` | ✏️ UPDATE | Add Gemini config |
| `PremiumAdminSidebar.tsx` | ✏️ UPDATE | Remove AI Router |
| `vi.json` / `en.json` | ✏️ UPDATE | Clean up locales |

---

## ⏱️ Timeline

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Clean up | Xoá AI Router files | 15 min |
| 2. Rewrite HDVH | Single unified page | 45 min |
| 3. Gemini Support | API integration | 30 min |
| 4. Update Settings | AI Provider config | 20 min |
| 5. Test | Full flow test | 20 min |
| **Total** | | **~2 hours** |

---

*Plan ready for review*
