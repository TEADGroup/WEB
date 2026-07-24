# TEA Group Website — Phase 1 Plan: Foundation + Public Site

## Context
TEA Group (industrial & electrical automation, HCMC) needs a futuristic, bilingual (VI/EN)
corporate website with: an internal CMS, a **project tree** (node-graph), **AI-based parsing of
HDVH (operation-manual) docs into child nodes**, role-based auth, a **dynamic time-of-day
light/dark theme**, and rich 3D. The current `WEB_TEA` folder holds an *unrelated* Claude Code
demo repo; we build in a new `tea-group/` subfolder and leave all existing files untouched.

The full spec is very large. Per the user's decisions, **Phase 1 ships a runnable foundation +
public-facing site running on mock data**, with the Supabase schema + migrations authored but
*not yet connected*. External services are wired through `.env.example` placeholders + safe
runtime fallbacks, so the site runs immediately with **no keys required**. Phase 2+ will connect
real Supabase/Claude, build Admin CRUD, the HDVH parser Edge Function, and auth.

### Decisions locked (from user)
- **Location** → new `tea-group/` subfolder; existing demo repo untouched.
- **Scope** → Foundation + public site on mock data; Supabase schema included.
- **Credentials** → `.env.example` + fallbacks now; keys plugged in later.

## Tech choices (with rationale)
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TS** | Spec-required; App Router for layouts/route groups |
| Styling | **TailwindCSS v3.4** (`tailwind.config.ts`) | Stable, broad compat, low risk for "runs immediately". v4 noted as future option |
| 3D | **@react-three/fiber v9 + @react-three/drei** | React-19 compatible (must verify peer on install — known gotcha) |
| Animation | **framer-motion** | UI motion + smooth animated gradient transitions for the theme |
| Project tree | **@xyflow/react (React Flow) + dagre** | Auto-layout, minimap, animated signal-like edges |
| i18n | **Custom Context + `src/locales/{vi,en}.json`** | Instant client-side toggle (no reload), matches spec's `src/locales/` |
| Monorepo | **pnpm workspaces** | Honors spec's `apps/` shape without heavy tooling |
| Data seam | **`lib/api/*` returning mock** → swap to Supabase later | Zero UI rewrite in Phase 2 |

Fonts via `next/font`: **Space Grotesk** (display/headings) + **Inter** (body).

## Monorepo structure (Phase-1 scope annotated)
```
tea-group/
├── package.json · pnpm-workspace.yaml · .gitignore · .env.example · README.md
├── apps/
│   ├── web/                         # ★ fully built in Phase 1
│   │   ├── package.json · next.config.mjs · tsconfig.json · postcss/tailwind config
│   │   ├── public/{models3d,images}/  (placeholder + fallback images)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx              # root: ThemeProvider + I18nProvider + fonts + Header/Footer
│   │       │   ├── globals.css             # CSS vars (theme bands), tailwind layers, transitions
│   │       │   ├── page.tsx                # Home
│   │       │   ├── (public)/{about,solutions,projects,news,careers,contact}/page.tsx
│   │       │   ├── (auth)/login/page.tsx   # UI only (Phase 2 wires Supabase Auth)
│   │       │   └── (admin)/dashboard/page.tsx  # protected shell skeleton
│   │       ├── components/{ui,3d,tree,layout}/
│   │       ├── locales/{vi,en}.json
│   │       ├── hooks/  · lib/  · styles/  · types/
│   ├── api/                         # stub: README explaining role; real work lives in supabase/functions
│ └── packages/                      # stub: shared types placeholder
├── supabase/
│   ├── migrations/  (0001_init, 0002_rls, 0003_storage_buckets)  # ★ authored, not applied
│   ├── functions/{parse-hdvh,send-email}/  # README stubs (Phase 2)
│   └── seed.sql                     # mock projects mirroring web mock data
└── docs/{architecture,supabase-setup}.md
```

## Build workstreams (execution order)

**WS-0 — Scaffolding & config.** Root `package.json` + `pnpm-workspace.yaml`; `apps/web` Next 15
scaffold; tsconfig paths (`@/*`); Tailwind v3 config with the futuristic palette; `next.config`
(image domains, `transpilePackages` for R3F if needed); `.env.example`; root README.

**WS-1 — Design system.** Tailwind theme tokens (charcoal base, cyan/neon accent, metallic
gradients, glow shadows). `components/ui/`: `Button`, `Card`, `Badge`, `Modal`, `Input`,
`Skeleton`, `SectionHeading` (each a focused file). Typography + spacing scale.

**WS-2 — Layout shell.** `components/layout/`: `Header` (logo, nav, `LangSwitch`, `ThemeToggle`),
`Footer` (company info from `settings`), `Navbar` (mobile drawer). Page transitions via
framer-motion `AnimatePresence` in layout.

**WS-3 — i18n.** `locales/vi.json` + `en.json` (every static string keyed); `I18nProvider`
(Context with `lang`, `setLang`, `t(key)`); persist to `localStorage`; default VI. Dynamic
content (projects) carries `_vi`/`_en` fields and renders by active lang.

**WS-4 — Dynamic time-of-day theme (signature).**
- `lib/theme/time-bands.ts`: maps hour → band (`dawn` 05–08, `day` 08–17, `dusk` 17–19,
  `night` 19–05), each band exposing a set of CSS custom properties (gradient stops, accent,
  text, surface) and a `light`/`dark` flag.
- `ThemeProvider`: computes band from local time; modes `auto | light | dark` (persisted);
  re-evaluates every 60s; writes CSS vars to `:root` + a `data-theme` attr. SSR-safe
  (default `day`, rehydrates after mount to avoid mismatch).
- `globals.css`: `transition: background … 1200ms, color … 800ms` on body + surfaces for the
  smooth MSN-weather-style morph; animated layered gradient via framer-motion.
- 3D scene + particle background **read the active CSS vars / theme context** so lighting &
  particle hue shift with the band (not just flat background).

**WS-5 — 3D scenes (signature).**
- `components/3d/HeroScene.tsx`: procedural industrial object (gear/robot-arm hint) built from
  R3F primitives — no external GLB needed. Floating + slow rotation, reacts to pointer.
- `components/3d/ControllerModel.tsx`: procedural **PLC/controller** unit — body, I/O ports,
  screen, blinking status LEDs (animated material emissive), buttons. Hover a part → drei `<Html>`
  tooltip describing its function. OrbitControls (rotate/zoom), auto-rotate idle.
- `components/3d/CircuitBackground.tsx`: animated particle/circuit-trace field behind hero.
- All wrapped in `next/dynamic({ ssr: false })` + `React.lazy`, with `<Suspense>` skeleton and a
  static-image fallback for low-power devices (gated by a `useLowPerf` check / `prefers-reduced-motion`).

**WS-6 — Types + mock data + data-access seam.**
- `types/`: `Project`, `ProjectNode`, `ProjectSection`, `Settings`, `ContactMessage`, `User`,
  `TimeBand`, `Lang`.
- `lib/mock/`: `projects.ts`, `settings.ts` (company info from spec §1), etc.
- `lib/api/{projects,settings,contact}.ts`: return mock now; **same signatures** Supabase will
  implement in Phase 2 → UI never changes.

**WS-7 — Public pages** (Home, About, Solutions, Projects, News placeholder, Careers placeholder,
Contact). Home = hero 3D + strengths + featured projects + stats + clients. Solutions lists
service categories with 3D-tilt cards. About = history/vision/team/capabilities.

**WS-8 — Project tree (signature).** `components/tree/`:
- `ProjectTree.tsx`: React Flow canvas; custom nodes (`ProjectNode`, `CategoryNode`,
  `SectionNode`) with category icon + status badge; animated "signal" edges; MiniMap, Controls,
  "Fit to screen".
- `useAutoLayout.ts`: dagre positions the tree from nested mock data (root TEA → category →
  project → sections).
- `SearchFilter.tsx`: search by name/client, filter by category & year; highlights + focuses
  (canvas `fitView` to matched node).
- `ProjectDetailPanel.tsx`: gallery, client, location, dates, description (lang-aware), scope.
- Mobile (`<768px`): render `AccordionTree.tsx` (hierarchical accordion) instead of canvas.

**WS-9 — Contact form.** Validated fields (name, email, phone, subject, body), honeypot, success/
error toast. Posts through `lib/api/contact` (mock now → Edge Function + Resend in Phase 2).

**WS-10 — Supabase schema (authored, not applied).**
- `migrations/0001_init.sql`: `profiles(id PK refs auth.users, role, full_name, is_locked)`,
  `projects(id, slug, parent_id, category, title_vi, title_en, description_vi, description_en,
  images jsonb, attachments jsonb, extracted_sections jsonb, parse_status, parse_version,
  position, created_at)`, `project_sections(...)`, `settings(key PK, value jsonb)`,
  `contact_messages(...)`, `parse_logs(...)`.
- `migrations/0002_rls.sql`: enable RLS; public read for published projects/settings; write
  restricted to `admin` (and `editor` for projects); contact insert public.
- `migrations/0003_storage_buckets.sql`: `project-images`, `project-docs`, `models-3d` with policies.
- `seed.sql`: inserts mock projects mirroring `apps/web/lib/mock`.
- `functions/{parse-hdvh,send-email}/README.md`: document the Phase-2 contract (Claude structured
  output → `extracted_sections`; Resend/SMTP contact mail).

**WS-11 — Docs.** `README.md` (install, env vars incl. Supabase URL/anon/service-role + Anthropic
key, dev/build), `docs/architecture.md` (module map, data-flow, theme system, 3D perf strategy),
`docs/supabase-setup.md` (apply migrations, RLS, buckets).

## Representative key files
- `apps/web/src/app/layout.tsx` — providers, fonts, Header/Footer
- `apps/web/src/components/theme/ThemeProvider.tsx` + `lib/theme/time-bands.ts`
- `apps/web/src/components/3d/{HeroScene,ControllerModel,CircuitBackground}.tsx`
- `apps/web/src/components/tree/ProjectTree.tsx` + `hooks/useAutoLayout.ts`
- `apps/web/src/lib/api/projects.ts` (mock seam) + `lib/mock/projects.ts`
- `apps/web/src/locales/{vi,en}.json` + `components/i18n/I18nProvider.tsx`
- `supabase/migrations/0001_init.sql`, `0002_rls.sql`, `0003_storage_buckets.sql`, `seed.sql`

## Verification
1. `cd tea-group && pnpm install` (resolve R3F/drei React-19 peers; fix if flagged).
2. `pnpm --filter web dev` → site at `localhost:3000`.
3. Click each nav page; confirm no console errors, responsive at mobile/tablet/desktop widths.
4. Toggle **language** (VI/EN) → all static text + project content swaps instantly, no reload.
5. Toggle **theme** (Auto/Light/Dark); in Auto, force system clock or temp-edit the band hours to
   confirm gradient morphs smoothly and 3D/particle hues shift with it.
6. **Projects tree**: zoom/pan/fit, search highlights + focuses a node, detail panel opens,
   mobile shows accordion.
7. **Contact form**: validation + honeypot + success toast on submit (mock).
8. `pnpm --filter web build` passes (typecheck + prod build); check Core Web Vitals aren't
   tanked by 3D (lazy-loaded, `ssr:false`).
9. Confirm zero changes outside `tea-group/` (existing demo repo untouched).

## Out of scope (explicitly Phase 2+)
Live Supabase connection, Supabase Auth login, Admin CRUD UI, HDVH upload + parse Edge Function
(Claude), real email send, re-parse/diff UX, blog/careers content, audit logs, deploy/CI, deep
performance tuning & Lighthouse pass, real GLB 3D assets (procedural primitives used now).
