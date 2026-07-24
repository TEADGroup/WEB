# Runbook — TEA Group website

Operating instructions for local dev, Supabase setup, and first-run admin.

## 1. Prerequisites
- **Node.js ≥ 20** (`node --version`).
- **pnpm 9+** — enable via corepack (no admin needed):
  ```bash
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
  ```
- **Supabase CLI** (only needed from Phase 4) — https://supabase.com/docs/guides/local-development
- A terminal with bash (Git Bash on Windows works).

## 2. Install & run the web app
```bash
pnpm install
cp .env.example .env
pnpm dev          # http://localhost:3000 → redirects to /vi
```
Phase 1 (i18n + theme + branding) runs **without** any real keys. The Supabase/Anthropic variables are only required from Phase 4/5.

## 3. Environment variables (`.env`)
| Var | When needed | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | always | used for metadata/OG |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 4+ | public, safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 4+ | **server-only**, bypasses RLS |
| `ANTHROPIC_API_KEY` | Phase 5 | server-only, HDVH parser |
| `RESEND_API_KEY` / `CONTACT_TO_EMAIL` / `MAIL_FROM` | Phase 6 | contact email |

Never put a secret under `NEXT_PUBLIC_*`.

## 4. Supabase setup (Phase 4+)
### Local
```bash
supabase start                 # boot local stack (DB, auth, storage, studio)
supabase db reset              # apply migrations/ + seed.sql
supabase status                # prints URL, anon key, service key for .env
```
Studio UI: http://localhost:54323

### Cloud
```bash
supabase link --project-ref <ref>
supabase db push               # apply migrations
```

### Create the first admin
1. Sign up a user via the Auth page in Supabase Studio (or `/login` once Phase 4 ships).
2. Promote to admin (the auto-trigger creates a profile with role `editor` by default):
   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

### Regenerate TypeScript types
```bash
pnpm db:types      # writes apps/web/src/types/supabase.ts from the live schema
```
(Until run, `src/types/supabase.ts` is an empty placeholder — clients stay generic.)

## 5. RLS quick smoke test (psql / Studio SQL)
```sql
set role anon;
select * from public.projects where status = 'published';   -- OK (returns seed rows)
insert into public.projects (slug, category, title) values ('x','other','x');  -- BLOCKED
reset role;
```

## 6. Visual check without a browser
```bash
node scripts/phase1-screenshot.mjs
# writes .playwright-mcp/{vi-auto,dark,light,en}-check.png
```
Uses bundled Chromium (no admin). Requires `pnpm dev` running on :3000.

## 7. Troubleshooting
- **Port 3000 busy** → `pnpm --filter @tea/web dev -- -p 3001` (or let Next auto-fallback).
- **Hash anchors (#) not scrolling** → ensure `<section id="...">` is rendered server-side (curl confirms) and `scroll-behavior: smooth` is in `globals.css`.
- **next/font fails to fetch** → needs internet at first dev boot (downloads Google fonts).
- **`hasLocale` not found** → expected; we use a local `isLocale()` (see CLAUDE.md gotchas).
- **Theme buttons don't respond** → ensure components read from `<ThemeProvider>`, not a standalone hook.
