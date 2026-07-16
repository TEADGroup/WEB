# Progress Log — TEA Group website

Source of truth for *what's done* and *what's next*. Full design rationale in [`../reports/federated-swimming-waterfall.md`](../reports/federated-swimming-waterfall.md).

## Phase 1 — DONE ✅ (verified 2026-07-16)
**Deliverables**
- Monorepo: pnpm workspaces + turbo. Moved old best-practice content → `docs-reference/` (gitignored).
- `@tea/shared`: zod schemas (`project-sections`, `project`, `settings`) + types + brand `DEFAULT_THEME_CONFIG`. Single source of truth for the data contract.
- `apps/web`: Next.js 15 + React 19 + TS + Tailwind 3. next-intl with `[locale]` + middleware + cookie (instant locale switch). 3 Supabase clients (server/browser/service). Dynamic theme system (Context provider + `@property` CSS + no-flash script).
- Supabase: `config.toml`, migrations `0001_init_schema`, `0002_rls_policies`, `0003_storage_buckets`, `seed.sql`.
- Brand design: real logo (RGBA, transparent), brand-color gradients (logo palette), Space Grotesk display font, uppercase labels.

**Verified**
- `pnpm install` (386 pkgs), `pnpm typecheck` clean (exit 0).
- Dev server boots; `/` → 307 → `/vi`; `/vi` & `/en` return 200 with correct localized content.
- 4 screenshots (auto/day, dark, light, en) confirm theme + i18n + logo + typography.

**Bugs found & fixed during Phase 1** (so a future session doesn't repeat them):
1. `hasLocale` not exported by next-intl 3.26.5 → local `isLocale()`.
2. `useTranslations` not callable in async server components → `getTranslations`.
3. Theme had two `useTimeOfDay` instances fighting → single `<ThemeProvider>` Context.
4. Dark override kept the day gradient → added `resolvePhase()` (Dark→night, Light→day).

## Phase 2 — DONE ✅ (verified 2026-07-16)
- **Hero 3D** (React Three Fiber + drei): procedural **Gears** (brand blue/green/red), articulated **RobotArm**, **Controller** cabinet with blinking LEDs + glowing screen, and a drifting **CircuitParticles** field. Scene is theme-aware (ambient lowered + emissive glow boosted in dark mode). `Hero3D` lazy-mounts client-side (`dynamic`, `ssr:false`), with a poster fallback and `prefers-reduced-motion` support. Controller is procedural for now — a real GLB can drop in at `/models3d/controller.glb` later.
- **Public pages**: About, Solutions, Projects (Phase-3 placeholder), News, Careers, Contact (client `ContactForm` with honeypot → posts to `/api/contact`, wired in Phase 6; Google Maps embed). Shared `PageHeader`.
- Verified: `typecheck` clean; all 9 routes return 200 (`/vi`, `/en`, `/vi/{about,solutions,projects,news,careers,contact}`, `/en/contact`); 3D scene + contact form confirmed in screenshots.

## Phase 3 — PENDING
Project tree via `@xyflow/react` v12 + dagre auto-layout, animated "signal" edges, minimap, mobile accordion, search/filter with `setCenter` focus.

## Phase 4 — PENDING
Supabase Auth (JWT + HttpOnly refresh), `requireAdmin/requireEditor`, Admin Dashboard, Projects Manager (CRUD + drag positions + image uploads), Users Manager, Settings editor. `(admin)/*` noindex.

## Phase 5 — PENDING (core feature)
HDVH AI parser: upload PDF/DOCX → Route Handler (`runtime:'nodejs'`) extracts text (`pdf-parse`/`mammoth`) → Anthropic `messages.parse` with `zodOutputFormat(ProjectSectionsSchema)` → draft `project_sections` → Admin preview + diff → Accept & Publish. Async status + audit log.

## Phase 6 — PENDING
Contact form (Resend + honeypot + Google Maps), perf pass (3D lazy + Core Web Vitals), Edge Function `contact-notify` (optional), final docs.

## Key decisions
- Monorepo at root (pnpm); API folded into Next Route Handlers (no separate Node service).
- HDVH parse on **Node Route Handler** (libs are Node-only), not Deno Edge Function.
- `zod@3` (stable with Anthropic SDK); schemas shared across AI/server/UI.
- Brand gradient uses **desaturated tints** for backgrounds + saturated brand colors for small accents only (avoids eye strain).
