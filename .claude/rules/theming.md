---
paths:
  - "assets/css/base.css"
  - "assets/js/theme.js"
---
# Theming — CSS variables + `data-theme`

- Theme is driven entirely by CSS custom properties. `base.css` `:root` holds constants (`--accent`, `--grad`, `--radius`…); `[data-theme="dark"]` and `[data-theme="light"]` on `<html>` override the surface/text/bg variables. **To restyle, change variables — not component CSS.** Pages may override a token in their own CSS (e.g. admin's `--maxw`).
- Light theme was deliberately softened (`--bg: #e6e8ee`, lower `--orb-op`) to reduce glare. Preserve that intent when tweaking.
- JS in `TEA.initTheme({ btn, onTheme })` (`assets/js/theme.js`) sets `data-theme` on `<html>` and calls `onTheme(theme)` so each page can render its own icon (index swaps an SVG's innerHTML; admin/dashboard swap an emoji). **Theme is auto by time**: `light` from `DAY_START` (06:00) to `< DAY_END` (18:00), else `dark`; re-checked every 60s so it switches at the boundary on its own. The toggle button (when `btn` is passed) is a **manual override for the current day/night period**, stored in `localStorage` key **`tea-override`** (`{t, p}`); it auto-clears when the period changes, after which time-based auto resumes. (The legacy `tea-theme` key is no longer written/read.) Change `DAY_START`/`DAY_END` at the top of `theme.js` to adjust the hours.
