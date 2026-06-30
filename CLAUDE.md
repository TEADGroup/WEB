# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Marketing/introduction site for **Công Ty TNHH Điện Và Tự Động TEA** — an electrical & industrial-automation company specializing in **PLC programming** and **industrial protocol integration** (Modbus, OPC UA, MQTT, Profinet, EtherCAT, …). The site is **bilingual (Vietnamese / English)** with a **dark/light theme toggle** and a **collapsible project tree view**.

## Quy tắc bắt buộc (Mandatory working rules)

These two rules are non-negotiable and override default behavior:

1. **Screenshot after every major change.** Sau mỗi thay đổi lớn, capture a screenshot of the rendered page and visually compare it against the design baseline **before** calling the task done. The baseline is the current approved live site (the last committed state of `index.html`) unless the user provides a design mockup. Note: `.reveal` elements start at `opacity:0` and only animate in on scroll, so a static full-page headless screenshot will show them hidden — either capture at a scrolled position or temporarily neutralize the `.reveal` start state when diffing.
2. **Mọi section cần phải có animation khi scroll.** Every `<section>` must animate in on scroll via the `.reveal` + `IntersectionObserver` mechanism. The Hero (`#home`) is above the fold, so it uses a load-in entrance animation (`@keyframes heroIn`) instead of a scroll trigger. When adding a new section, wrap its content in `.reveal`; if it's the first viewport, give it a load-in animation.

## Stack & constraints

- **Single self-contained file**: `index.html` — all HTML, CSS (`<style>`), and JS (`<script>`) inline. No framework, no build step, no package manager, no dependencies.
- **Vanilla JS only** (ES2015+). No TypeScript, no bundler.
- The only other tracked assets are `logo.png` (referenced as `<img src="logo.png">` in navbar + footer) and `.gitignore`.
- Keep it a single file. If you split assets out, update `logo.png` references and the deploy path.

## Commands

There is no build/test/lint tooling. Workflow is manual:

```bash
# Preview locally (just open the file, or serve to avoid CORS quirks):
start index.html                       # Windows: open in default browser
python -m http.server 8000             # then visit http://localhost:8000

# Sanity-check the embedded JS syntax before committing. The script lives inline
# in index.html, so extract it first, then:
node --check index.js                  # extract the <script>…</script> block to index.js

# Git identity is set locally (generic noreply email by design):
git config user.name "TEA Automation"
git config user.email "tea-automation@users.noreply.github.com"
```

`_*.js` / `_c.js` are gitignored (used as scratch files when extracting the script for `node --check`).

## Deployment

Hosted via **GitHub Pages** (static, free). Push `main` to the GitHub remote and Pages serves it from the repo root — no CI config in the repo. Live URL: `https://duckute123.github.io/tea-website/`.

## Architecture (the non-obvious parts)

Everything lives in one file, so the architecture is about **conventions layered on top of vanilla DOM**, not separate modules.

### Theming — CSS variables + `data-theme`
- Theme is driven entirely by CSS custom properties. `:root` holds constants (`--accent`, `--grad`, `--radius`…); `[data-theme="dark"]` and `[data-theme="light"]` on `<html>` override the surface/text/bg variables. **To restyle, change variables — not component CSS.**
- Light theme was deliberately softened (`--bg: #e6e8ee`, lower `--orb-op`) to reduce glare. Preserve that intent when tweaking.
- JS in `applyTheme()` flips `data-theme` on `<html>` and swaps the SVG icon. Persisted in `localStorage` key **`tea-theme`** (default `dark`).

### Bilingual — `data-vi` / `data-en` attributes
- Every translatable element carries both `data-vi="…"` and `data-en="…"`. The Vietnamese text is also written as the element's live `textContent` (the visible default).
- `setLang(lang)` queries all `[data-vi][data-en]` elements and sets `textContent = el.getAttribute('data-' + lang)`. Form placeholders use the parallel `data-ph-vi` / `data-ph-en` pair.
- **Calling `setLang` re-renders the tree** (it's the last thing `setLang` does), so the project tree follows the language. Language persists in `localStorage` key **`tea-lang`** (default `vi`).
- Consequence: when adding any translatable content, you must set **all three** (the live text + both `data-*` attrs), or it won't switch / will show stale text.

### Project tree view — data-driven, state-preserving
- Source of truth is the `projects` array in the script: nested `[{vi, en, ico, items:[{vi, en, year, plc, protocol, vi_desc, en_desc}]}]`.
- `renderTree()` rebuilds `#projectTree`'s `innerHTML` from that array using the current language. Expand/collapse is CSS-driven (`max-height` transition + `.expanded` class).
- **Expansion state survives re-render** (e.g. on language switch) because open nodes are tracked in two `Set`s keyed by index: `expandedCats` (category index) and `expandedProjs` (`"ci-pi"`). `expandAll` / `collapseAll` mutate those sets then re-render. **To add a project, edit the `projects` array — do not touch the markup.**

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

## Content to keep current

- **Contact details are placeholders**: phone `+84 387.981.930`, email `contact@teagroup.vn`, and the address (`294/41/18 Đường Số 8, Phường Thông Tây Hôi…`). Note "Thông Tây Hôi" matches the owner's spelling — likely a typo for "Thông Tây Hội"; confirm before treating either as canonical.
- The `projects` array and protocol/service lists are sample/representative content, not a verified project ledger.
