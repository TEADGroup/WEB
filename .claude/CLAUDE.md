# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

It holds **project reference** (overview, stack, commands, deployment) and an index of the behavioral rules under [`.claude/rules/`](.claude/rules/). Those rules load **on-demand** based on the file you're editing (each carries a `paths` glob), so only the relevant convention enters context — except [`.claude/rules/mandatory-workflow.md`](.claude/rules/mandatory-workflow.md), which has no `paths` gate and is always loaded. See the [Project rules](#project-rules) table below.

## Project overview

Marketing/introduction site for **Công Ty TNHH Điện Và Tự Động TEA** — an electrical & industrial-automation company specializing in **PLC programming** and **industrial protocol integration** (Modbus, OPC UA, MQTT, Profinet, EtherCAT, …). The site is **bilingual (Vietnamese / English)** with a **dark/light theme toggle** and a **collapsible project tree view**.

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
- **Vanilla JS only** (ES2015+). Plain `<script src>` tags (not ES modules — the site also opens via `file://`). Shared conventions live in `base.css` + `theme.js` + `i18n.js`; each page composes them — the architecture is **conventions layered on top of vanilla DOM**, not modules. Detailed per-subsystem conventions live in the rules below.
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

## Content to keep current

- **Contact details are placeholders**: phone `+84 387.981.930`, email `contact@teagroup.vn`, and the address (`294/41/18 Đường Số 8, Phường Thông Tây Hôi…`). Note "Thông Tây Hôi" matches the owner's spelling — likely a typo for "Thông Tây Hội"; confirm before treating either as canonical.
- The `projects` array and protocol/service lists are sample/representative content, not a verified project ledger.

## Project rules

Detailed conventions live in `.claude/rules/`. Path-scoped rules load only when you read/edit a matching file; `mandatory-workflow` is always loaded.

| Rule | Loads when editing | Covers |
|------|--------------------|--------|
| [`mandatory-workflow.md`](.claude/rules/mandatory-workflow.md) | *(always)* | Screenshot-after-change QA; every `<section>` animates on scroll |
| [`js-conventions.md`](.claude/rules/js-conventions.md) | `assets/js/**/*.js` | Vanilla JS, plain `<script src>` (no ES modules), load order, scratch files |
| [`theming.md`](.claude/rules/theming.md) | `base.css`, `theme.js` | CSS-variable theming, `data-theme`, `tea-theme` storage, soft light theme |
| [`i18n-bilingual.md`](.claude/rules/i18n-bilingual.md) | HTML pages, `i18n.js` | `data-vi`/`data-en`, `tea-lang` storage, `setLang` re-render |
| [`project-tree.md`](.claude/rules/project-tree.md) | `projects-data.js`, `main.js`, `admin.html` | `PROJECTS_DATA`, `renderTree()`, expansion-state Sets, edit data not markup |
| [`animation-system.md`](.claude/rules/animation-system.md) | `base.css`, `main.css`, `main.js` | Reveal/stagger/parallax observer mechanics, reduced-motion guard |
| [`gallery-images.md`](.claude/rules/gallery-images.md) | `index.html`, `main.css` | Unsplash URLs, `onerror` fallback, hover-gated tilt |
| [`contact-form.md`](.claude/rules/contact-form.md) | `index.html`, `main.js` | Client-side-only validation, bilingual toast |
| [`responsive-mobile.md`](.claude/rules/responsive-mobile.md) | HTML pages, `main/dashboard.css`, `main.js` | Navbar ≤560px, mobile menu, iOS font-size, dashboard header overflow gotcha |
