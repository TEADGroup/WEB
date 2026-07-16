# TEA Group — Corporate Website

Corporate website for **TEA Group** (industrial automation & electrical control, Ho Chi Minh City). Bilingual VI/EN, dynamic time-of-day theme, a project tree, an internal Headless CMS, and AI-assisted parsing of HDVH (operation manuals) into a project structure tree.

> Status: **Phase 1 complete & verified.** See [`docs/progress.md`](docs/progress.md) and the full plan [`reports/federated-swimming-waterfall.md`](reports/federated-swimming-waterfall.md).

## Features
- **Bilingual VI/EN** with instant switching (no page reload) via `next-intl`.
- **Dynamic time-of-day theme** — the background gradient follows the Vietnam clock (dawn / day / dusk / night), with a manual Auto/Light/Dark override. Brand colors derived from the TEA Group logo.
- **3D hero** (Phase 2, in progress) — React Three Fiber scene (robot arm, control cabinet, gears, circuit particles + controller model).
- **Project tree** (Phase 3) — projects as an interactive node graph (React Flow), auto-laid-out with dagre, mobile accordion fallback.
- **Admin CMS** (Phase 4) — Supabase Auth + RBAC, manage projects/tree/users/system settings.
- **AI HDVH parser** (Phase 5) — upload a PDF/DOCX operation manual; Anthropic Claude extracts a structured project tree (preview + diff before publishing).
- **Contact form** (Phase 6) — email via Resend + Google Maps.

## Tech stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 3 · next-intl · React Three Fiber + drei · @xyflow/react v12 · dagre · Supabase (Postgres + Auth + Storage) · Anthropic SDK · Resend. Monorepo via **pnpm workspaces** + turbo.

## Getting started

### Prerequisites
- Node ≥ 20, pnpm 9+ (`corepack enable`), Supabase CLI (for local DB, Phase 4+).

### Install & run
```bash
pnpm install
cp .env.example .env      # fill in later (Phase 4/5); Phase 1 runs without keys
pnpm dev                  # http://localhost:3000 → /vi
```

### Other commands
```bash
pnpm typecheck            # tsc across all packages
pnpm build                # production build
pnpm --filter @tea/web dev
node scripts/phase1-screenshot.mjs   # visual check via bundled chromium
```

### Supabase (Phase 4+)
```bash
supabase link --project-ref <your-ref>
supabase db push           # apply migrations (schema + RLS + storage)
supabase db reset          # local: re-apply migrations + seed.sql
pnpm db:types              # regenerate src/types/supabase.ts
```
See [`docs/runbook.md`](docs/runbook.md) for creating the first admin user and full setup.

## Project structure
```
apps/web/        Next.js app (API folded into Route Handlers)
packages/shared/ zod schemas + types + theme config (single source of truth)
supabase/        migrations, seed.sql, edge functions
scripts/         dev helpers (screenshots)
docs/            runbook, progress, architecture notes
docs-reference/  archived best-practice material (not part of the project)
```

## License
Proprietary — © TEA Group. All rights reserved.
