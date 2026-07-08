---
paths:
  - "data/projects-data.js"
  - "assets/js/main.js"
  - "admin.html"
---
# Project tree view — data-driven, state-preserving

- Source of truth is `window.PROJECTS_DATA` in `data/projects-data.js`: nested `[{vi, en, ico, items:[{vi, en, year, plc, protocol, vi_desc, en_desc, image}]}]`. `main.js` reads it into `projects`. (Editing is done in `admin.html`, which writes the file back to `data/`.)
- `renderTree()` rebuilds `#projectTree`'s `innerHTML` from that array using the current language. Expand/collapse is CSS-driven (`max-height` transition + `.expanded` class).
- **Expansion state survives re-render** (e.g. on language switch) because open nodes are tracked in two `Set`s keyed by index: `expandedCats` (category index) and `expandedProjs` (`"ci-pi"`). `expandAll` / `collapseAll` mutate those sets then re-render.
- **To add a project, edit `data/projects-data.js` (or use `admin.html`) — do not touch the markup.**
