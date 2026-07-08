---
paths:
  - "index.html"
  - "admin.html"
  - "dashboard/index.html"
  - "assets/js/i18n.js"
---
# Bilingual — `data-vi` / `data-en` attributes

- Every translatable element carries both `data-vi="…"` and `data-en="…"`. The Vietnamese text is also written as the element's live `textContent` (the visible default).
- `TEA.applyTranslations(lang)` (`assets/js/i18n.js`) queries all `[data-vi][data-en]` elements and sets `textContent = el.getAttribute('data-' + lang)`. Form placeholders use the parallel `data-ph-vi` / `data-ph-en` pair. Language persists in `localStorage` key **`tea-lang`** (default `vi`).
- Each page owns a `setLang(lang)` that calls `TEA.applyTranslations(lang)` **then** does its page-specific re-render: index re-renders the project tree (last step of `setLang` in `main.js`); dashboard re-renders legend/devices/alerts/charts. So the tree follows the language.
- Consequence: when adding any translatable content, you must set **all three** (the live text + both `data-*` attrs), or it won't switch / will show stale text.
