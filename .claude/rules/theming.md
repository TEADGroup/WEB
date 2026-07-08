---
paths:
  - "assets/css/base.css"
  - "assets/js/theme.js"
---
# Theming — CSS variables + `data-theme`

- Theme is driven entirely by CSS custom properties. `base.css` `:root` holds constants (`--accent`, `--grad`, `--radius`…); `[data-theme="dark"]` and `[data-theme="light"]` on `<html>` override the surface/text/bg variables. **To restyle, change variables — not component CSS.** Pages may override a token in their own CSS (e.g. admin's `--maxw`).
- Light theme was deliberately softened (`--bg: #e6e8ee`, lower `--orb-op`) to reduce glare. Preserve that intent when tweaking.
- JS in `TEA.initTheme({ btn, onTheme })` (`assets/js/theme.js`) flips `data-theme` on `<html>`, persists it in `localStorage` key **`tea-theme`** (default `dark`), and calls `onTheme(theme)` so each page can render its own icon (index swaps an SVG's innerHTML; admin/dashboard swap an emoji).
