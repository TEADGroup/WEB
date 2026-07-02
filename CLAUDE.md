# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Marketing/introduction site for **Công Ty TNHH Điện Và Tự Động TEA** — an electrical & industrial-automation company specializing in **PLC programming** and **industrial protocol integration** (Modbus, OPC UA, MQTT, Profinet, EtherCAT, …). The site is **bilingual (Vietnamese / English)** with a **dark/light theme toggle** and a **collapsible project tree view**.

## Quy tắc bắt buộc (Mandatory working rules)

These two rules are non-negotiable and override default behavior:

1. **Screenshot after every major change.** Sau mỗi thay đổi lớn, capture a screenshot of the rendered page and visually compare it against the design baseline **before** calling the task done. The baseline is the current approved live site (the last committed state of `index.html`) unless the user provides a design mockup. Note: `.reveal` elements start at `opacity:0` and only animate in on scroll, so a static full-page headless screenshot will show them hidden — either capture at a scrolled position or temporarily neutralize the `.reveal` start state when diffing.
2. **Mọi section cần phải có animation khi scroll.** Every `<section>` must animate in on scroll via the `.reveal` + `IntersectionObserver` mechanism. The Hero (`#home`) is above the fold, so it uses a load-in entrance animation (`@keyframes heroIn`) instead of a scroll trigger. When adding a new section, wrap its content in `.reveal`; if it's the first viewport, give it a load-in animation.

## Stack & constraints

- **Multi-file, zero-build static site.** Three HTML pages, each linking shared + page-specific CSS/JS from `assets/`. No framework, no build step, no package manager, no dependencies.
  - `index.html` — marketing site (main page)
  - `admin.html` — project editor (password-gated, client-side only)
  - `dashboard/index.html` — live factory-monitoring dashboard (simulated data)
- **Asset layout** (see `assets/`):
  - `assets/css/base.css` — **shared**: theme tokens (`:root`, `[data-theme="dark"]`, `[data-theme="light"]`), reset, and design primitives (`.glass`, `.btn`, `.icon-btn`, `.container`, `.grad-text`, `.reveal`). Loaded **first** by every page.
  - `assets/css/{main,admin,dashboard}.css` — page-specific; override tokens/primitives where needed (e.g. admin narrows `--maxw`, dashboard adds status colors).
  - `assets/js/theme.js` + `assets/js/i18n.js` — **shared**: `TEA.initTheme()` and `TEA.applyTranslations()` exposed on a `window.TEA` namespace.
  - `assets/js/{main,admin,dashboard}.js` — page-specific logic.
- **Vanilla JS only** (ES2015+). No TypeScript, no bundler. **Plain `<script src>` tags, NOT ES modules** — the site is also opened via `file://`, where ES module imports fail on CORS. Load order matters: shared (`theme.js`, `i18n.js`) → data (`data/projects-data.js`, where used) → page JS. Scripts sit at the end of `<body>` so the DOM is ready.
- Other tracked assets: `logo.png`, `data/projects-data.js` (project data source of truth), `data/images/` (uploaded project photos).

## Commands

There is no build/test/lint tooling. Workflow is manual:

```bash
# Preview locally (just open the file, or serve to avoid CORS quirks):
start index.html                       # Windows: open in default browser
python -m http.server 8000             # then visit http://localhost:8000

# Sanity-check JS syntax before committing (JS now lives in separate files):
node --check assets/js/main.js         # repeat for admin.js / dashboard.js / theme.js / i18n.js

# Git identity is set locally (generic noreply email by design):
git config user.name "TEA Automation"
git config user.email "tea-automation@users.noreply.github.com"
```

`_*.js` / `_c.js` are gitignored (used as scratch files when extracting the script for `node --check`).

## Deployment

Hosted via **GitHub Pages** (static, free). Push `main` to the GitHub remote and Pages serves it from the repo root — no CI config in the repo. Live URL: `https://duckute123.github.io/tea-website/`.

## Architecture (the non-obvious parts)

The codebase is now split across files (see Stack & constraints), but the architecture is still about **conventions layered on top of vanilla DOM**, not modules. Shared conventions live in `base.css` + `theme.js` + `i18n.js`; each page composes them.

### Theming — CSS variables + `data-theme`
- Theme is driven entirely by CSS custom properties. `base.css` `:root` holds constants (`--accent`, `--grad`, `--radius`…); `[data-theme="dark"]` and `[data-theme="light"]` on `<html>` override the surface/text/bg variables. **To restyle, change variables — not component CSS.** Pages may override a token in their own CSS (e.g. admin's `--maxw`).
- Light theme was deliberately softened (`--bg: #e6e8ee`, lower `--orb-op`) to reduce glare. Preserve that intent when tweaking.
- JS in `TEA.initTheme({ btn, onTheme })` (`assets/js/theme.js`) flips `data-theme` on `<html>`, persists it in `localStorage` key **`tea-theme`** (default `dark`), and calls `onTheme(theme)` so each page can render its own icon (index swaps an SVG's innerHTML; admin/dashboard swap an emoji).

### Bilingual — `data-vi` / `data-en` attributes
- Every translatable element carries both `data-vi="…"` and `data-en="…"`. The Vietnamese text is also written as the element's live `textContent` (the visible default).
- `TEA.applyTranslations(lang)` (`assets/js/i18n.js`) queries all `[data-vi][data-en]` elements and sets `textContent = el.getAttribute('data-' + lang)`. Form placeholders use the parallel `data-ph-vi` / `data-ph-en` pair. Language persists in `localStorage` key **`tea-lang`** (default `vi`).
- Each page owns a `setLang(lang)` that calls `TEA.applyTranslations(lang)` **then** does its page-specific re-render: index re-renders the project tree (last step of `setLang` in `main.js`); dashboard re-renders legend/devices/alerts/charts. So the tree follows the language.
- Consequence: when adding any translatable content, you must set **all three** (the live text + both `data-*` attrs), or it won't switch / will show stale text.

### Project tree view — data-driven, state-preserving
- Source of truth is `window.PROJECTS_DATA` in `data/projects-data.js`: nested `[{vi, en, ico, items:[{vi, en, year, plc, protocol, vi_desc, en_desc, image}]}]`. `main.js` reads it into `projects`. (Editing is done in `admin.html`, which writes the file back to `data/`.)
- `renderTree()` rebuilds `#projectTree`'s `innerHTML` from that array using the current language. Expand/collapse is CSS-driven (`max-height` transition + `.expanded` class).
- **Expansion state survives re-render** (e.g. on language switch) because open nodes are tracked in two `Set`s keyed by index: `expandedCats` (category index) and `expandedProjs` (`"ci-pi"`). `expandAll` / `collapseAll` mutate those sets then re-render. **To add a project, edit `data/projects-data.js` (or use `admin.html`) — do not touch the markup.**

### Animation system (mandatory rule: every section animates on scroll)
- Stats counters animate 0 → `data-target` via `requestAnimationFrame`, triggered once by an `IntersectionObserver` (`threshold: 0.5`).
- **Reveal** (`.reveal`, `IntersectionObserver` `threshold: 0.12`, one-shot): starts at `opacity:0` + a transform, settles to `.visible`. Direction variants `.reveal.from-left / .from-right / .from-up / .from-scale / .from-blur` set the initial transform/filter; section headings carry one for variety. **`.reveal.visible` must stay defined last** (same specificity) so it wins over the variant.
- **Stagger**: in `revealObs`, before adding `.visible`, a `transition-delay` is set from the element's index among its `.reveal` siblings (`:scope > .reveal`) — so grid children (`.grid-3`, `.gallery`, `.grid-2`, `.stats`, `.protocol-row`) cascade instead of appearing at once. Capped at ~540ms.
- **Hero (`#home`)** is above the fold, so it uses a load-in entrance (`@keyframes heroIn` with staggered `animation-delay`) instead of a scroll trigger.
- **Parallax orbs**: `onScroll` sets a `--py` CSS var on each `.orb`; the `@keyframes float1/2/3` incorporate `var(--py)` into their translate, so parallax composes with the ambient float (an inline `transform` would be overridden by the running animation — that's why it routes through the variable). Pointer devices only (`(hover: hover)`).
- `onScroll` now does four jobs: navbar `.scrolled`, active nav link, scroll-progress bar width, and the orb parallax above.
- `@media (prefers-reduced-motion: reduce)` neutralizes reveal/hero/orb/shimmer motion for accessibility — preserve this guard when editing motion.

### Gallery images
- Remote Unsplash URLs with `referrerpolicy="no-referrer"` and inline `onerror="this.style.display='none'"` so a broken/changed URL degrades to the gradient placeholder rather than a broken-image icon.
- 3D tilt effect is gated behind `window.matchMedia('(hover: hover)')` so it only binds on pointer devices (skips touch).

### Contact form
- **Client-side validation only** (`novalidate` + a regex email check). Submitting shows a toast and resets; nothing is sent anywhere. The toast text is also bilingual via `currentLang`.

### Responsive / mobile (`index.html`)
- The fixed navbar carries icon buttons (lang, theme, admin, dashboard, hamburger). On screens `≤ 560px` the **admin & dashboard** icon buttons are hidden and instead appear as `nav-mobile-only` links inside the hamburger dropdown, so the bar never overflows.
- Mobile menu (`main.js`) closes on: link click, click outside, and `Escape`; it toggles `aria-expanded` on the hamburger and locks body scroll while open.
- Form inputs use `font-size: 16px` to prevent iOS Safari's auto-zoom-on-focus. `.footer-links` uses `flex-wrap` so the links reflow on narrow screens instead of overflowing.

## Content to keep current

- **Contact details are placeholders**: phone `+84 387.981.930`, email `contact@teagroup.vn`, and the address (`294/41/18 Đường Số 8, Phường Thông Tây Hôi…`). Note "Thông Tây Hôi" matches the owner's spelling — likely a typo for "Thông Tây Hội"; confirm before treating either as canonical.
- The `projects` array and protocol/service lists are sample/representative content, not a verified project ledger.
