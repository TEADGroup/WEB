# 🔧 Development Scripts & Tools

**Purpose:** Development utilities, testing scripts, và automation tools

---

## 📋 Mục đích

Thư mục này chứa **development tools**:
- Visual regression testing (screenshots)
- Feature testing scripts
- Utilities for development workflow

---

## 📂 Files

| File | Mô tả | Usage |
|------|-------|-------|
| [`phase1-screenshot.mjs`](phase1-screenshot.mjs) | 📸 Screenshot automation | `node phase1-screenshot.mjs` |
| [`screenshot-now.mjs`](screenshot-now.mjs) | 📸 Quick screenshot | `node screenshot-now.mjs` |
| [`screenshot-compare.mjs`](screenshot-compare.mjs) | 📊 Compare screenshots | Visual regression testing |
| [`check-solutions.mjs`](check-solutions.mjs) | ✅ Validate solution cards | Check 3D model URLs |
| [`test-ai-image-filter.cjs`](test-ai-image-filter.cjs) | 🔬 AI image filtering test | Test Anthropic image processing |
| [`test-ai-sections.cjs`](test-ai-sections.cjs) | 🔬 AI section parsing test | Test HDVH section extraction |
| [`test-docx-extract.{cjs,ts}`](test-docx-extract.cjs) | 🔬 DOCX extraction test | Test mammoth library |
| [`test-hdvh-real.cjs`](test-hdvh-real.cjs) | 🔬 Real HDVH parsing test | Full document parsing test |

---

## 🚀 Usage

### Screenshots (Visual Regression)

```bash
# Full visual regression (Phase 1 features)
node scripts/phase1-screenshot.mjs

# Quick screenshot now
node scripts/screenshot-now.mjs

# Compare screenshots
node scripts/screenshot-compare.mjs
```

### Validation

```bash
# Check solution card 3D models
node scripts/check-solutions.mjs
```

### Testing

```bash
# Test AI image filtering
node scripts/test-ai-image-filter.cjs

# Test AI section parsing
node scripts/test-ai-sections.cjs

# Test DOCX extraction
node scripts/test-docx-extract.cjs

# Test real HDVH parsing
node scripts/test-hdvh-real.cjs
```

---

## ⚠️ Notes cho AI

### Screenshot scripts
- Sử dụng **bundled chromium** (Playwright), không cần system Chrome
- Output: `.screenshots/` directory (not in git)
- Dùng cho visual regression testing, không phải cho production

### Test scripts
- Nhiều test scripts dùng để **experiment** với libraries
- Không phải unit tests - dùng để validate tính năng
- Một số scripts có cả `.cjs` và `.ts` versions (experimenting)

---

## 🔗 Liên kết

- **Parent:** [`../`](../) - Root
- **Web app:** [`../apps/web/`](../apps/web/) - Main application
- **Docs:** [`../docs/runbook.md`](../docs/runbook.md) - Setup guide

---

*Last updated: 2026-07-22*
