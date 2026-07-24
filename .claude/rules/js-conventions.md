---
paths:
  - "assets/js/**/*.js"
---
# JavaScript conventions

- **Vanilla JS only** (ES2015+). No TypeScript, no bundler.
- **Plain `<script src>` tags, NOT ES modules** — the site is also opened via `file://`, where ES module imports fail on CORS.
- **Load order matters**: shared (`theme.js`, `i18n.js`) → data (`data/projects-data.js`, where used) → page JS. Scripts sit at the end of `<body>` so the DOM is ready.
- Sanity-check syntax before committing: `node --check assets/js/main.js` (repeat for `admin.js` / `dashboard.js` / `theme.js` / `i18n.js`).
- `_*.js` / `_c.js` are gitignored — scratch files used when extracting a script for `node --check`. Don't commit them.
