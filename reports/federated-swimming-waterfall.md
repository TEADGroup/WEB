# Kế hoạch triển khai — Website TEA Group (Tự động hoá & Điện tự động)

> Kế hoạch full-stack, xây từ số 0 (greenfield). Ngôn ngữ kế hoạch: Tiếng Việt.

---

## Bối cảnh (Context)

**Vì sao xây mới:** Cần một website doanh nghiệp cho **TEA Group** (tự động hoá công nghiệp & điện tự động, Q. Hồ Chí Minh) thể hiện sự chuyên nghiệp, "tương lai" (futuristic), có CMS nội bộ để đội ngũ tự cập nhật dự án, sơ đồ cây dự án trực quan, và **tự động phân tích tài liệu Hướng dẫn vận hành (HDVH) bằng AI** để sinh cấu trúc sơ đồ con.

**Trạng thái hiện tại (đã khảo sát):**
- Thư mục `WEB_TEA` hiện là một bản clone của repo "Claude Code best-practices" (`best-practice/`, `implementation/`, `orchestration-workflow/`, `presentation/`, `agent-teams/`, `development-workflows/`, `reports/`, `CLAUDE.md`, `README.md`). **Không có mã nguồn web nào** (không `package.json`, không `apps/`, không `src/`).
- Tài nguyên thương hiệu duy nhất: **`Logo.png`** (PNG 910×894, ~329KB).
- Windows + bash, **chưa phải git repo**.

**Quyết định đã chốt với khách hàng:**
1. **Workspace = monorepo ở thư mục gốc** theo đúng cấu trúc prompt; gom nội dung best-practice hiện có vào `docs-reference/` để không xung đột; giữ `Logo.png`.
2. **Phạm vi = trọn gói**: public site + Admin Dashboard + AI parser HDVH + email + auth/RBAC + i18n (VI/EN) + theme động theo giờ.
3. **Backend keys = chưa có**: dùng `.env.example` placeholder + viết sẵn SQL schema/migration để chạy ngay khi có Supabase project & Anthropic key.
4. **3D = kết hợp**: model Controller chính dùng GLB thật (placeholder path, cấp sau), các thành phần phụ (tủ điện, bánh răng, particle mạch điện, robot arm) dựng procedural bằng R3F.

**Kết quả mong muốn:** Một kế hoạch chia giai đoạn, mỗi giai đoạn kết thúc có phần chạy/kiểm thử được; rủi ro kỹ thuật được đẩy lên sớm (3D/SSR, schema, RLS, AI) để sai lầm phát hiện ở tuần đầu, không phải tuần cuối.

---

## 1. Công nghệ & phiên bản (đã xác minh qua context7)

| Mục đích | Thư viện (đã xác minh) | Pin |
|---|---|---|
| Sơ đồ cây dự án | Đổi tên thành **`@xyflow/react`** v12 (KHÔNG dùng `reactflow` cũ). Import `ReactFlow, MiniMap, Controls, Background, ReactFlowProvider, useReactFlow`. CSS: `@xyflow/react/dist/style.css`. | `@xyflow/react@^12.4` |
| 3D renderer | **R3F v9** hỗ trợ React 19; `Canvas` vốn là client component. drei v10 đi kèm. | `@react-three/fiber@^9.1`, `@react-three/drei@^10`, `three@^0.171`, `@types/three` |
| AI structured output | API hiện hành: **`client.messages.parse({ model, max_tokens, messages, output_config:{format} })`** với `format = zodOutputFormat(zodSchema)` hoặc `jsonSchemaOutputFormat(schema)`; kết quả ở **`message.parsed_output`** (có kiểu). | `@anthropic-ai/sdk@^0.40` |
| Framework | Next.js 15 App Router + React 19. Trong Next 15, `dynamic({ssr:false})` chỉ gọi được **trong Client Component**. | `next@^15.1`, `react@^19.1` |
| i18n | `next-intl` (App Router native) — locale lưu trong cookie qua middleware → đổi ngôn ngữ không reload. | `next-intl@^3.25` |
| Backend/BaaS | Supabase CLI lifecycle: `init → start → link → db push`. Edge Functions chạy **Deno**. | `supabase CLI@^2`, `@supabase/supabase-js@^2.45`, `@supabase/ssr@^0.5` |
| Parse tài liệu | `pdf-parse`/`pdfjs-dist` (PDF) + `mammoth` (DOCX) — **cả hai đều Node-only**, không chạy trên Deno. | `pdf-parse@^1.1`, `mammoth@^1.8` |
| Email | Resend (ưu tiên); fallback Nodemailer+SMTP. | `resend@^4` |
| Animation/Style | Framer Motion; Tailwind v3. | `framer-motion@^11`, `tailwindcss@^3.4` |

---

## 2. Quyết định kiến trúc (chỉ phương án được chọn)

### 2.1 Monorepo: pnpm workspaces
`pnpm-workspace.yaml` khai báo `apps/*` + `packages/*`. Gói chia sẻ `packages/shared` chứa: zod schemas, TS types, factory Supabase client, i18n message keys, constants. **Gấp `apps/api` vào `apps/web` Route Handlers** (logic server nằm ở `apps/web/src/server/modules/*`, gọi qua `apps/web/src/app/api/*/route.ts`) — một Node service riêng chỉ tăng phí tổn triển khai mà không thêm lợi ích, vì Route Handler đã có Node runtime, env và RBAC dùng chung. Supabase Edge Functions chỉ giữ mỏng (webhook/trigger) nếu cần.

### 2.2 Runtime cho pipeline AI phân tích HDVH → **Next.js Route Handler (Node runtime)**
Vì `pdf-parse` và `mammoth` đều Node-only (không chạy được trên Deno Edge Function), chọn Route Handler `runtime = 'nodejs'`, `maxDuration = 300` để: download blob từ bucket `project-docs` → trích text → gọi `messages.parse` → ghi `project_sections` + node con trong **một transaction** → cập nhật `parse_status` + ghi `audit_logs`.

**Bất đồng bộ:** set `parse_status='processing'`, `parse_version+=1` rồi trả **HTTP 202** ngay; client poll `GET /api/projects/[id]/parse-status` (hoặc subscribe Supabase Realtime). *Fallback (chỉ tài liệu hóa, chưa build):* Edge Function nhận webhook Storage rồi gọi Route Handler qua HTTPS để giữ phía Deno tối giản.

### 2.3 Theme động theo thời gian thực
Hook `useTimeOfDay()` tính pha từ đồng hồ **Asia/Ho_Chi_Minh**: `dawn` 05–08, `day` 08–17, `dusk` 17–19, `night` 19–05. Framer Motion animate `<div>` nền + CSS variables giữa 4 palette. Manual override (`auto|light|dark`) lưu `localStorage['tea-theme']` được ưu tiên; Admin có thể chỉnh gradient từng pha qua `settings.theme_config`. Cảnh 3D đọc cùng token (React context) và lerp cường độ sáng/khói/màu particle đồng bộ. **Tránh hydration flash:** inline script ở root layout set CSS variable trước khi hydrate; phần tử quyết định theme render client-only (flag `mounted`).

### 2.4 i18n không reload
`next-intl` với segment `[locale]` + middleware cookie. VI mặc định. Đổi ngôn ngữ = đổi cookie + `useRouter().replace()` (không full reload vì message đã import tĩnh). Chuỗi tĩnh trong `src/locales/{en,vn}.json`; chuỗi Admin-chỉnh-sửa trong bảng `settings`.

---

## 3. Cấu trúc thư mục (xây đúng như sau)

```
WEB_TEA/
├─ pnpm-workspace.yaml, package.json (root: devDeps+scripts), .env.example, tsconfig.base.json, turbo.json
├─ docs-reference/            # ← toàn bộ nội dung best-practice hiện có chuyển vào đây
├─ docs/                      # tài liệu kỹ thuật mới (runbook, ADR)
├─ supabase/{config.toml, migrations/, functions/, seed.sql}
├─ packages/shared/           # zod schemas + types dùng chung
└─ apps/web/                  # ứng dụng Next.js duy nhất (api gộp vào đây)
   ├─ next.config.ts, tailwind.config.ts, package.json
   └─ src/
      ├─ app/[locale]/{(public),(auth),(admin)}/...
      ├─ app/api/{auth,users,projects,uploads,hdvh-parser,settings,contact}/route.ts
      ├─ components/{ui,3d,tree,layout}/
      ├─ server/modules/{auth,users,projects,uploads,hdvh-parser,settings,contact}/
      ├─ locales/{en,vn}.json
      ├─ hooks/, lib/{supabase/*,anthropic.ts,resend.ts}, styles/, types/
      └─ public/{models3d/controller.glb, images/logo.png, icons/}
```

---

## 4. Kế hoạch theo giai đoạn

### Phase 1 — Scaffold + schema + i18n + theme (vỏ chạy được)
- Chuyển nội dung reference → `docs-reference/`; `git init`; copy `Logo.png` → `apps/web/public/images/logo.png`.
- Root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.env.example`, `.gitignore`.
- `apps/web` Next 15 + TS + Tailwind + `next-intl`; segment `[locale]`; middleware cookie.
- **Toàn bộ migration** (xem §6): tables, enums, RLS, storage buckets, `audit_logs`, seed `settings`.
- `supabase/seed.sql`: 1 admin profile, 1 project mẫu, default `settings`.
- Theme: `useTimeOfDay()` + `<ThemeBackground/>` + inline no-flash script.
- `packages/shared`: zod schema `project_sections` + `settings`.
- **Kiểm thử:** `pnpm dev` mở `/vi` & `/en`; nút theme chạy; `supabase db reset` sạch; RLS smoke (`set role anon` đọc được published, không ghi được).
- File đại diện: `apps/web/src/app/[locale]/layout.tsx`, `src/hooks/useTimeOfDay.ts`, `src/components/layout/ThemeBackground.tsx`, `supabase/migrations/0001_init_schema.sql`, `0002_rls_policies.sql`, `0003_storage_buckets.sql`, `src/lib/supabase/{server,client}.ts`, `.env.example`.

### Phase 2 — Trang public + Hero 3D
- Route group `(public)`: Home, About, Solutions, News/Careers (scaffold), Contact (UI form, chưa backend).
- **Hero 3D** (`components/3d/`): wrapper `'use client'` `Hero3D.tsx` dynamic-import `<Scene/>` với `ssr:false`; Scene chứa procedural `<RobotArm/>`, `<ElectricCabinet/>`, `<Gears/>`, `<CircuitParticles/>` + `useGLTF('/models3d/controller.glb')` + `<Suspense>` fallback. Ánh sáng/khói gắn token theme.
- Home: thế mạnh, đối tác, số liệu (đọc `settings.home_stats`). SEO per-locale + `robots.txt` + OG.
- **Kiểm thử:** Lighthouse Home ≥ 90 (3D lazy dưới fold); tắt trên `prefers-reduced-motion`; mobile có ảnh tĩnh fallback.
- File đại diện: `src/components/3d/{Hero3D,Scene,CircuitParticles}.tsx`, `src/app/[locale]/(public)/home/page.tsx`, `src/components/layout/PublicHeader.tsx`.

### Phase 3 — Sơ đồ cây dự án (React Flow)
- `components/tree/ProjectsTree.tsx` — wrapper `'use client'` quanh `<ReactFlowProvider>` + `<ReactFlow>`. Node: `RootNode`, `CategoryNode`, `ProjectNode`, `SectionNode` (auto từ `project_sections`).
- Auto-layout bằng `dagre` từ flat edge list; `fitView()` sau layout.
- Edge "tín hiệu" animate (overlay dashed + CSS `stroke-dashoffset`).
- Click/hover node → panel chi tiết (gallery, khách hàng, địa điểm, ngày, mô tả, hạng mục). `MiniMap`, `Controls`, `Background`. Search + filter (category, năm) + `setCenter()` focus + highlight. Mobile (`<768px`) → accordion.
- Data: `server/modules/projects/queries.ts` → `getPublishedTree()`; client `useTreeData()`.
- **Kiểm thử:** 50 node @ 60fps; keyboard accessible; minimap phản ánh filter.
- File đại diện: `src/components/tree/ProjectsTree.tsx`, `src/components/tree/nodes/ProjectNode.tsx`, `src/lib/tree-layout.ts`, `src/server/modules/projects/queries.ts`, `src/app/[locale]/(public)/projects/page.tsx`.

### Phase 4 — Auth + Admin + Settings + RBAC
- Login qua `@supabase/ssr` (`signInWithPassword`); refresh token HttpOnly; `middleware.ts` giữ `(admin)/*`, chuyển hướng nếu chưa đăng nhập.
- RBAC: `profiles.role` (`admin|editor`); helper `requireAdmin()/requireEditor()`. Quản lý user admin-only.
- Admin: Dashboard (stats + audit gần đây), Projects Manager (CRUD + kéo-thả node → persist `position` JSONB; upload ảnh `project-images`), Users Manager (tạo/khoá/reset pw editor), Settings (thông tin công ty, logo, slogan, socials, home stats, theme gradient) gắn bảng `settings`.
- `(admin)/*` set `robots:noindex,nofollow` + `X-Robots-Tag`.
- **Kiểm thử:** editor không vào được `/users-manager` (403); admin khoá được user; mọi mutation ghi `audit_logs`.
- File đại diện: `src/app/[locale]/(auth)/login/page.tsx`, `src/middleware.ts`, `src/server/modules/auth/rbac.ts`, `src/app/[locale]/(admin)/{dashboard,settings}/page.tsx`, `src/app/api/uploads/route.ts`.

### Phase 5 — AI phân tích HDVH + diff (tính năng lõi)
- `POST /api/uploads` (admin/editor) → bucket `project-docs` + `projects.attachments[]`.
- `POST /api/hdvh-parser?projectId=&version=` (Node, 300s): set `processing` → download blob → extract (dispatch theo MIME) → chunk nếu vượt budget → `client.messages.parse` với `zodOutputFormat(ProjectSectionsSchema)` (Overview, Equipment, Specs, Operating, Maintenance, Safety — mỗi mục `title_vi/en`, `content_vi/en`).
- Ghi draft vào `project_sections` (`status='draft'`, `parse_version=N`); tạo candidate `SectionNode` (chưa public).
- UI Preview: so sánh side-by-side với bản đã publish + **diff** (pkg `diff`) trước khi "Chấp nhận & Xuất bản". Accept → `status='published'`, bump version, re-parent node public trong 1 transaction, log audit. Re-parse tăng version, giữ bản cũ để rollback.
- `GET /api/projects/[id]/parse-status` (poll) + Supabase Realtime (tuỳ chọn).
- **Kiểm thử:** upload PDF + DOCX thật; `safeParse` qua schema; draft KHÔNG hiện trên cây public trước khi accept; re-parse cho diff khác rỗng.
- File đại diện: `src/app/api/hdvh-parser/route.ts`, `src/server/modules/hdvh-parser/{extract,anthropic}.ts`, `packages/shared/src/schemas/project-sections.ts`, `src/app/[locale]/(admin)/projects-manager/[id]/preview/page.tsx`, `src/components/admin/SectionDiff.tsx`.

### Phase 6 — Email liên hệ + hoàn thiện + hiệu năng + docs
- `POST /api/contact`: honeypot + turnstile/rate-limit; lưu `contact_messages`; gửi qua Resend đến `settings.contact_email`; fallback SMTP nếu có `SMTP_*`.
- Trang Contact: Google Maps embed (iframe, không cần API key) cho "294/41/18 Đường số 8, P. Thông Tây Hội, HCM".
- Hiệu năng: 3D code-split + `frameloop="demand"`; `<Preload all>`; `Suspense`; `next/image`; `export const revalidate`. Audit LCP/CLS/TBT.
- Edge Function `contact-notify` (tuỳ chọn). Docs: `docs/runbook.md`, `docs/adr/`, cập nhật `README.md`.
- **Kiểm thử:** honeypot → drop; hợp lệ → có row + email; `X-Robots-Tag` trên `/admin/*`; `pnpm typecheck && lint && test` xanh; Lighthouse Home/Projects/Contact ≥ 90.

---

## 5. File quan trọng cần tạo (tập đại diện)

- `apps/web/src/app/api/hdvh-parser/route.ts` — Route Handler Node điều phối extract → Anthropic → ghi DB + audit (tính năng lõi).
- `apps/web/src/server/modules/hdvh-parser/anthropic.ts` — wrap `messages.parse` + `zodOutputFormat`; model/prompt/budget.
- `apps/web/src/components/tree/ProjectsTree.tsx` — cây `@xyflow/react` v12 + dagre + edge animate + minimap + mobile accordion.
- `supabase/migrations/0001_init_schema.sql` + `0002_rls_policies.sql` — tables/enums + RLS + SECURITY DEFINER.
- `apps/web/src/hooks/useTimeOfDay.ts` — phân giải pha theo giờ VN + override localStorage (theme + 3D).
- `apps/web/src/middleware.ts` — cookie locale next-intl + guard session `(admin)/*`.
- `apps/web/src/lib/supabase/{server,client,service}.ts` — 3 client (SSR cookie, browser anon, service-role).
- `packages/shared/src/schemas/project-sections.ts` — zod schema dùng chung cho parser + preview + Anthropic call.
- `.env.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SMTP_*`, `CONTACT_TO_EMAIL`, `NEXT_PUBLIC_SITE_URL`.

---

## 6. Schema Supabase + RLS

**Tables (trường chính):**
- `profiles(id PK refs auth.users, role enum('admin','editor'), full_name, is_locked bool default false, created_by, created_at)`
- `projects(id uuid PK, slug unique, category enum, title, client, location, date, status enum('draft','published','archived'), description_vi, description_en, images jsonb, attachments jsonb, parse_status enum('idle','pending','processing','done','failed') default 'idle', parse_version int default 0, position jsonb, created_by, created_at, updated_at)`
- `project_sections(id uuid PK, project_id FK, type enum(overview|equipment|specs|operating|maintenance|safety|other), title_vi/en, content_vi/en, sort_order, source_doc, status enum('draft','published'), parse_version, created_at)`
- `settings(key text PK, value jsonb, updated_by, updated_at)` — keys: `company`, `socials`, `home_stats`, `theme_config`, `contact_email`
- `contact_messages(id uuid PK, name, email, phone, subject, body, status enum('new','read','replied','archived') default 'new', created_at)`
- `audit_logs(id bigint PK, actor uuid, action, entity, entity_id, payload jsonb, created_at)`

**Ma trận RLS:**
- `projects`/`project_sections`: SELECT `status='published'` (anon/auth); INSERT/UPDATE/DELETE `role in ('admin','editor')`.
- `settings`: SELECT all (site cần theme/company); INSERT/UPDATE `role='admin'`.
- `profiles`: SELECT (own row) OR `role='admin'`; writes admin-only (trừ user tự update `full_name`).
- `contact_messages`: INSERT cho anon (+rate-limit ở API); SELECT/UPDATE admin-only.
- `audit_logs`: INSERT authenticated; SELECT admin-only.
- Storage: `project-images` public-read, admin/editor write; `project-docs` admin-only; `models-3d` public-read.
- Ghi privileged (parser/contact) qua **service-role client phía server** (không bao giờ expose browser) hoặc SECURITY DEFINER function (attribution actor chính xác hơn).

---

## 7. Rủi ro & giảm thiểu

1. **3D/Core Web Vitals** — GLB + particle làm hỏng LCP/TBT. Giảm: render 3D dưới fold/sau first paint qua `requestIdleCallback`+`Suspense`; `dpr={[1,1.5]}`; `frameloop="demand"`; `useGLTF.preload`; tôn trọng `prefers-reduced-motion` (poster tĩnh); `ssr:false`. Ship poster `<img>` cho no-WebGL/crawler.
2. **SSR incompatible (R3F + xyflow)** — cả hai chạm `window`/`document`. Giảm: KHÔNG import trong Server Component; wrapper `'use client'` + flag `mounted` + guard `typeof window`.
3. **Deno không chạy mammoth/pdf-parse** — đã chọn Node Route Handler (§2.2); không thử `npm:mammoth` trong Deno.
4. **RLS sai** — rò rỉ draft/editor chạm user. Giảm: viết **RLS test** ở migration-time (`set role anon/authenticated`) assert allow/deny từng table+state; service-role chỉ phía server; eslint cấm `SUPABASE_SERVICE_ROLE_KEY` trong `NEXT_PUBLIC_*`.
5. **AI drift/schema violation** — `messages.parse` trả `parsed_output: null` khi fail. Giảm: retry với prompt chặt hơn; chunk tài liệu dài; lưu raw text + raw response vào `audit_logs`; KHÔNG publish chưa Accept.
6. **Auth/session Next 15 + Supabase** — cookie model đổi. Giảm: pin `@supabase/ssr@^0.5`, dùng helper chính thức, refresh ở middleware; verify ở Phase 4 trước khi build admin.
7. **Hydration mismatch theme** — render server UTC vs client VN. Giảm: theme client-only + inline script pre-hydration set CSS var theo Asia/Ho_Chi_Minh; server render neutral default.

---

## 8. Chiến lược kiểm thử (end-to-end)

**Điều kiện chạy local (document trong `.env.example` + `docs/runbook.md`):** `pnpm install`; `supabase start`; `supabase db reset` (apply migration + seed); lấy URL/anon key từ `supabase status`; set `ANTHROPIC_API_KEY` throwaway để chạy parser (nếu không có → mock trong test).

**Kiểm từng giai đoạn (dùng Playwright MCP `mcp__playwright__browser_*` + Chrome/Lighthouse):**
- **P1:** mở `/vi` → redirect đúng; đổi `/en` tức thì (Network tab không full reload); toggle theme. `psql`: `set role anon; select * from projects where status='published';` trả seed; `insert` bị deny.
- **P2:** Home có canvas WebGL; `prefers-reduced-motion:reduce` → poster tĩnh; LCP < 2.5s.
- **P3:** `/vi/projects` render cây; click node → panel; zoom; minimap; resize 375px → accordion; search → `setCenter` focus.
- **P4:** chưa login → `/admin` redirect `/login`; login editor → `/users-manager` 403; login admin → tạo/khoá editor; `audit_logs` có row.
- **P5:** admin upload PDF + DOCX → poll tới `done` → Preview có 6 loại section → diff khác rỗng → Accept → cây public có `SectionNode` mới; query `project_sections` as `anon` KHÔNG thấy draft trước accept.
- **P6:** honeypot → drop; hợp lệ → có row + email (Resend dashboard); `X-Robots-Tag: noindex` trên `/admin/*`; `typecheck && lint && test` xanh; Lighthouse ≥ 90.

---

## 9. Ghi chú thực thi

- **Bước vật lý đầu tiên (Phase 1):** chuyển toàn bộ thư mục reference → `docs-reference/` (giữ nguyên), copy `Logo.png` → `apps/web/public/images/logo.png`, `git init`, rồi dựng monorepo pnpm sạch ở root.
- Tuân thủ quy tắc commit của repo: **mỗi file một commit** (xem `CLAUDE.md`).
- Mọi tài khoản/scheme/migration phải chạy được với placeholder env; khi khách hàng cấp Supabase thật + Anthropic key chỉ cần `supabase link && db push` và điền `.env`.
