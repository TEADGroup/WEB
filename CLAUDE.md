# CLAUDE.md — TEA Group website

## Project
Corporate website for **TEA Group** (industrial automation & electrical control, Ho Chi Minh City, Vietnam). Bilingual VI/EN, dynamic time-of-day theme, project tree, internal Headless CMS, and AI parsing of HDVH (operation manuals) into a project structure tree.

## Status — 2026-07-16
- **Phase 1 DONE + verified**: monorepo, i18n (next-intl), dynamic theme (Context + @property), Supabase schema + RLS + storage + seed, brand design (real logo, brand-color gradient, Space Grotesk, uppercase labels).
- **Phase 2 IN PROGRESS**: Hero 3D (React Three Fiber) + public pages (About, Solutions, Projects, News, Careers, Contact).
- Phases 3–6 pending: project tree (React Flow), Auth+Admin+RBAC, AI HDVH parser, email+polish.
- Full plan: [`reports/federated-swimming-waterfall.md`](reports/federated-swimming-waterfall.md). Phase log + gotchas: [`docs/progress.md`](docs/progress.md).

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 3 · next-intl · React Three Fiber + drei (3D) · @xyflow/react v12 (tree) · dagre (layout) · Supabase (Postgres + Auth + Storage + Edge Fns) · Anthropic SDK (HDVH parse) · Resend (email). Monorepo: **pnpm workspaces** + turbo.

## Run
```bash
pnpm install
pnpm dev          # http://localhost:3000  → redirects to /vi
pnpm typecheck    # tsc across packages
pnpm --filter @tea/web dev          # web only
```
Env: copy `.env.example` → `.env`. Phase 1 runs WITHOUT real keys (Supabase/Anthropic are only needed from Phase 4/5).

## Structure (abbreviated)
```
apps/web/        # the Next.js app (api folded into Route Handlers)
  src/app/[locale]/{(public),(auth),(admin)}
  src/app/api/{auth,users,projects,uploads,hdvh-parser,settings,contact}
  src/components/{ui,3d,tree,layout,theme}
  src/server/modules/...   src/lib/{supabase,anthropic,resend}   src/hooks
packages/shared/ # zod schemas + types + theme config (single source of truth)
supabase/        # migrations (schema/RLS/storage), seed.sql, functions/
scripts/         # phase1-screenshot.mjs (Playwright chromium, no admin)
docs-reference/  # OLD best-practice repo content (gitignored, kept on disk)
```

## Key architecture
- **Theme** — single `<ThemeProvider>` (React Context) is the only source of truth; it sets CSS variables on `<html>`. `@property { syntax:'<color>' }` in `globals.css` makes the gradient transition smoothly. Phase computed from `Asia/Ho_Chi_Minh`; manual override (`auto|light|dark`) in `localStorage['tea-theme']`. No-flash inline script sets vars before hydration. Files: `lib/theme.ts`, `components/theme/ThemeProvider.tsx`, `components/layout/{NoFlashScript,ThemeBackground}.tsx`.
- **i18n** — next-intl, `[locale]` segment, `localePrefix:'always'`. **Async server components must use `getTranslations`** (not `useTranslations`); client components need `<NextIntlClientProvider messages={await getMessages()}>`. Locale-aware `Link/useRouter` from `src/i18n/navigation.ts`.
- **Supabase clients** — `lib/supabase/{server,client,service}.ts`: SSR cookie client, browser client, service-role (SERVER ONLY, bypasses RLS).
- **RLS** — enabled on every table; anon reads only `status='published'` rows + all `settings`; writes need `public.current_user_role()` in {admin,editor}; `project-docs` bucket admin-only. See `supabase/migrations/0002_rls_policies.sql`.
- **Data contract** — `@tea/shared` zod schemas are the single source of truth (used by Anthropic `messages.parse`, server validation, and the Admin UI).

## Gotchas (already paid for — don't repeat)
- `next-intl@3.26.5` does **not** export `hasLocale` → use local `isLocale()` in `src/i18n/routing.ts`.
- `useTranslations` **cannot run in async server components** → use `getTranslations`.
- Theme state **must be one Context provider**, never a hook called from multiple components (causes split state).
- React Flow package is **`@xyflow/react` v12** (renamed from `reactflow`); import its CSS.
- R3F + xyflow are client-only: wrap with a `'use client'` shell and `dynamic(..., { ssr:false })` **inside a client component** (Next 15 forbids `ssr:false` in a server component).
- HDVH parse libs (`mammoth`, `pdf-parse`) are **Node-only** → run in a Next Route Handler (`runtime:'nodejs'`), NOT a Deno Edge Function.
- Playwright MCP wants system Chrome (needs admin) → for screenshots use bundled chromium via `node scripts/phase1-screenshot.mjs`.

## Conventions
- Commits: logical + scoped (`feat(web):`, `feat(supabase):`, `docs:`).
- Brand colors from logo: blue `#0099FF`, green `#00A651`, red `#FF3333`. Backgrounds use **desaturated tints**; saturated brand colors only for small accents (logo, CTAs, stat numbers). Dark base `#0A1626` (not pure black).
- Keep CLAUDE.md under ~150 lines.
