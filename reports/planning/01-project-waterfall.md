# Kế hoạch triển khai — Website TEA Group (Tự động hoá & Điện tự động)

> Kế hoạch full-stack, xây từ số 0 (greenfield). Ngôn ngữ kế hoạch: Tiếng Việt.

---

## Bối cảnh (Context)

**Vì sao xây mới:** Cần một website doanh nghiệp cho **TEA Group** (tự động hoá công nghiệp & điện tự động, Q. Hồ Chí Minh) thể hiện sự chuyên nghiệp, "tương lai" (futuristic), có CMS nội bộ để đội ngũ tự cập nhật dự án, sơ đồ cây dự án trực quan, và **tự động phân tích tài liệu Hướng dẫn vận hành (HDVH) bằng AI miễn phí** để sinh cấu trúc sơ đồ con.

**Yêu cầu đặc biệt:**
- **Chỉ admin mới được chỉnh sửa**: tài khoản admin là người duy nhất có quyền CRUD projects, settings, users. Editor (nếu có) chỉ đọc, không ghi.
- **AI miễn phí**: không dùng Anthropic/OpenAI trả phí. Dùng Google Gemini (free tier: 60 req/min, API key miễn phí từ Google AI Studio), hoặc Ollama (chạy local, hoàn toàn miễn phí), hoặc OpenRouter (model free tier).
- **Kiến trúc AI provider abstraction**: code dùng chung interface, cho phép đổi provider qua Admin Settings mà không sửa code.
- **Project tree tự động cập nhật**: admin upload file HDVH → AI phân tích → preview → accept → cây dự án tự động có node mới.

**Trạng thái hiện tại (đã khảo sát):**
- Phase 1 + 2 đã hoàn thành. Monorepo pnpm/turbo, Next 15 App Router, i18n next-intl, theme động, Hero 3D R3F, layout 1-page, 3D model cards.
- Schema Supabase + RLS + storage + seed đã có.
- **3 Supabase migrations** sẵn sàng (init, RLS, storage).
- `@tea/shared` package chứa zod schemas và constants.
- 3 Supabase clients: server (SSR cookie), browser (anon), service (bypass RLS, server-only).
- `middleware.ts` hiện chỉ có locale negotiation — sẽ mở rộng để guard admin routes.

**Quyết định đã chốt với khách hàng:**
1. **Workspace = monorepo ở thư mục gốc** theo đúng cấu trúc prompt; gom nội dung best-practice hiện có vào `docs-reference/` để không xung đột; giữ `Logo.png`.
2. **Phạm vi = trọn gói**: public site + Admin Dashboard + Free AI parser HDVH + email + auth/RBAC (admin-only write) + i18n (VI/EN) + theme động theo giờ.
3. **Backend keys = chưa có**: dùng `.env.example` placeholder + viết sẵn SQL schema/migration để chạy ngay khi có Supabase project & AI key (Gemini free).
4. **3D = kết hợp**: model Controller chính dùng GLB thật (đã có placeholder), các thành phần phụ (tủ điện, bánh răng, particle mạch điện, robot arm) dựng procedural bằng R3F.

**Kết quả mong muốn:** Một kế hoạch chia giai đoạn, mỗi giai đoạn kết thúc có phần chạy/kiểm thử được; rủi ro kỹ thuật được đẩy lên sớm (3D/SSR, Free AI, schema, RLS, admin-only auth) để sai lầm phát hiện ở tuần đầu, không phải tuần cuối.

---

## 1. Công nghệ & phiên bản (đã xác minh qua context7)

| Mục đích | Thư viện (đã xác minh) | Pin |
|---|---|---|
| Sơ đồ cây dự án | Đổi tên thành **`@xyflow/react`** v12 (KHÔNG dùng `reactflow` cũ). Import `ReactFlow, MiniMap, Controls, Background, ReactFlowProvider, useReactFlow`. CSS: `@xyflow/react/dist/style.css`. | `@xyflow/react@^12.4` |
| 3D renderer | **R3F v9** hỗ trợ React 19; `Canvas` vốn là client component. drei v10 đi kèm. | `@react-three/fiber@^9.1`, `@react-three/drei@^10`, `three@^0.171`, `@types/three` |
| AI structured output | **Free AI Provider Abstraction** — interface chung `AiProvider` (strategy pattern) cho 3+ provider: • **Gemini** (`@google/generative-ai`) — free 60 req/phút, JSON mode qua `response_mime_type:"application/json"`, API key từ Google AI Studio • **Ollama** — REST API `http://localhost:11434/api/chat` (local, free, không cần key) • **OpenRouter** — REST API với model free tier • **Anthropic** (fallback trả phí) — `@anthropic-ai/sdk@^0.40` | `@google/generative-ai@^0.21` |
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

### 2.2 Free AI Provider — Provider Abstraction (Strategy Pattern)

**Không dùng Anthropic trả phí làm mặc định.** Thiết kế interface `AiProvider` chung cho mọi provider:

```
interface AiProvider {
  name: string;                     // 'gemini' | 'ollama' | 'openrouter' | 'anthropic'
  parseDocument(params: ParseParams): Promise<ProjectSectionsResult>;
  ping(): Promise<boolean>;         // health check
}
```

**Các provider kế thừa:**
- **GeminiProvider** (mặc định, free): dùng `@google/generative-ai`, JSON mode qua `response_mime_type: "application/json"`, prompt yêu cầu schema tương ứng `ProjectSectionsResult`.
- **OllamaProvider** (local free): gọi REST API `http://localhost:11434/api/chat` với model như `llama3.2`/`qwen2.5`, instruct bằng JSON format.
- **OpenRouterProvider** (free tier): REST API với model free (Gemma 2, Llama 3), free tier có rate limit thấp.
- **AnthropicProvider** (fallback trả phí): dùng `@anthropic-ai/sdk`, `messages.parse()` với `zodOutputFormat`.

**Cấu hình:** provider và model được lưu trong `settings.ai_config` (jsonb), admin có thể đổi qua trang Admin Settings mà không cần sửa code.

### 2.3 Runtime cho pipeline AI phân tích HDVH → Next.js Route Handler (Node runtime)
Vì `pdf-parse` và `mammoth` đều Node-only (không chạy được trên Deno Edge Function), chọn Route Handler `runtime = 'nodejs'`, `maxDuration = 300` để: download blob từ bucket `project-docs` → trích text → gọi provider interface → ghi `project_sections` + node con trong **một transaction** → cập nhật `parse_status` + ghi `audit_logs`.

**Bất đồng bộ:** set `parse_status='processing'`, `parse_version+=1` rồi trả **HTTP 202** ngay; client poll `GET /api/projects/[id]/parse-status` (hoặc subscribe Supabase Realtime). *Fallback (chỉ tài liệu hóa, chưa build):* Edge Function nhận webhook Storage rồi gọi Route Handler qua HTTPS để giữ phía Deno tối giản.

### 2.4 Admin-only write (RBAC)
Khác với plan gốc (admin + editor đều ghi được), **từ Phase 3 chỉ admin mới có quyền ghi**. Editor (nếu có) chỉ đọc. Điều này áp dụng ở:

1. **RLS**: sửa RLS — bỏ quyền `INSERT/UPDATE/DELETE` cho editor trên tất cả bảng (projects, project_sections, settings, profiles, contact_messages). Chỉ admin mới `all`.
2. **API**: mọi Route Handler mutation (projects CRUD, hdvh-parser, settings, users) kiểm tra `requireAdmin()` trước khi xử lý.
3. **UI**: Admin Dashboard không hiển thị nút ghi nếu role != admin (dù RLS đã chặn, UX vẫn cần).

### 2.5 Theme động theo thời gian thực
Hook `useTimeOfDay()` tính pha từ đồng hồ **Asia/Ho_Chi_Minh**: `dawn` 05–08, `day` 08–17, `dusk` 17–19, `night` 19–05. Framer Motion animate `<div>` nền + CSS variables giữa 4 palette. Manual override (`auto|light|dark`) lưu `localStorage['tea-theme']` được ưu tiên; Admin có thể chỉnh gradient từng pha qua `settings.theme_config`. Cảnh 3D đọc cùng token (React context) và lerp cường độ sáng/khói/màu particle đồng bộ. **Tránh hydration flash:** inline script ở root layout set CSS variable trước khi hydrate; phần tử quyết định theme render client-only (flag `mounted`).

### 2.6 i18n không reload
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

### Phase 3 — Auth/Admin/RBAC + Free AI HDVH Parser + Project Tree (gộp)
**Lý do gộp:** auth là tiên quyết cho admin, admin cần project manager + HDVH parser, parser sinh dữ liệu cho project tree. Gộp thành một phase để không phải build chờ đợi.

**Bước 1 — Auth + middleware + route guard**
- `POST /api/auth/login` → `@supabase/ssr` `signInWithPassword`; set session cookie HttpOnly.
- Refresh token ở middleware; middleware guard cho `(admin)/*`: nếu chưa có session → redirect `/login`.
- Thêm file `src/app/[locale]/(auth)/login/page.tsx`: form email + password, error state, loading.
- `(admin)/*` set `robots:noindex,nofollow` + `X-Robots-Tag` trong layout.
- Tạo `src/server/modules/auth/rbac.ts`: `requireAdmin()` throw 403 nếu `current_user_role() != 'admin'`.

**Bước 2 — Sửa RLS thành admin-only write (migration 0004)**
- Migration mới `0004_admin_only_write.sql`: thu hồi quyền ghi của editor.
  - `projects`/`project_sections`: editor bị mất `INSERT/UPDATE/DELETE` — chỉ admin mới `all`.
  - `settings`: xoá `settings_admin_insert` (giữ `settings_admin_update`), bỏ editor access.
  - `profiles`: editor chỉ tự update `full_name` (giữ), mọi thao tác user khác admin-only.
  - `contact_messages`: admin select/update, anon insert (giữ).
  - `audit_logs`: admin select, authenticated insert (giữ).
- **Xoá hoặc modify helper** `requireEditor()` — chỉ dùng `requireAdmin()` cho mọi mutation.

**Bước 3 — Free AI Provider abstraction**
- Tạo `src/server/modules/hdvh-parser/provider.ts` — interface `AiProvider`:
  ```typescript
  export interface AiProvider {
    name: string;
    parseDocument(params: { text: string; schema: ZodSchema }): Promise<ProjectSectionsResult>;
    ping(): Promise<boolean>;
  }
  ```
- Tạo `src/server/modules/hdvh-parser/providers/gemini.ts` — GeminiProvider:
  - Dùng `@google/generative-ai`, `GoogleGenerativeAI`.
  - Prompt instruct model trả JSON theo schema `ProjectSectionsResult`.
  - JSON mode: `generationConfig: { response_mime_type: "application/json" }`.
  - Free tier: Gemini 1.5 Flash (60 req/phút, đủ cho vài file HDVH/ngày).
- Tạo `src/server/modules/hdvh-parser/providers/ollama.ts` — OllamaProvider:
  - Gọi `POST http://localhost:11434/api/chat` với model `qwen2.5` / `llama3.2`.
  - Parse response JSON, map vào `ProjectSectionsResult`.
  - **Không cần key, không giới hạn** — chạy local.
- Tạo `src/server/modules/hdvh-parser/providers/openrouter.ts` — OpenRouterProvider:
  - Gọi OpenRouter REST API với model free (Gemma 2 9B, Llama 3 8B).
  - Free tier 20 req/phút (đủ cho HDVH).
- Tạo factory `src/server/modules/hdvh-parser/provider-factory.ts`:
  ```typescript
  export function createAiProvider(config: AiConfig): AiProvider { ... }
  ```
  Đọc config từ `settings.ai_config` (jsonb) — admin có thể đổi provider qua Settings UI.
- Thêm env vars vào `.env.example`:
  ```
  AI_PROVIDER=gemini                                  # gemini | ollama | openrouter | anthropic
  GEMINI_API_KEY=your-gemini-api-key                  # từ Google AI Studio (free)
  OLLAMA_BASE_URL=http://localhost:11434               # mặc định cho Ollama local
  OPENROUTER_API_KEY=                                  # optional
  OPENROUTER_MODEL=google/gemma-2-9b-it               # model free
  ANTHROPIC_API_KEY=                                   # fallback trả phí
  ```

**Bước 4 — HDVH Parser Route Handler (Node, 300s)**
- `POST /api/uploads` (admin-only): upload file → bucket `project-docs` + `projects.attachments[]`.
- `POST /api/hdvh-parser?projectId=&version=` (Node runtime, maxDuration 300):
  1. Auth check: `requireAdmin()`.
  2. Set `projects.parse_status='processing'`, trả HTTP 202 ngay.
  3. Download blob từ `project-docs` bucket.
  4. Trích text theo MIME: `pdf-parse` cho PDF, `mammoth` cho DOCX, `text/plain` cho TXT.
  5. Chunk nếu vượt budget (tối đa 30000 tokens).
  6. Gọi `createAiProvider(config).parseDocument({ text, schema: projectSectionsResultSchema })`.
  7. Parse response JSON → validate bằng `projectSectionsResultSchema.safeParse()`.
  8. Ghi draft vào `project_sections` (`status='draft'`, `parse_version=N`).
  9. Cập nhật `parse_status='done'` + ghi `audit_logs`.
- `GET /api/projects/[id]/parse-status`: poll status (trả `idle|pending|processing|done|failed`).

**Bước 5 — Admin Dashboard (chỉ admin mới truy cập được)**
- Route group `(admin)/`:
  - `dashboard/page.tsx` — thống kê: tổng projects, published, draft, contact messages chưa đọc, audit gần đây.
  - `projects-manager/page.tsx` — danh sách projects CRUD, filter theo category/status.
  - `projects-manager/[id]/page.tsx` — chi tiết project: sửa thông tin, upload ảnh `project-images`, upload HDVH (file → bucket `project-docs`), quản lý sections.
  - `projects-manager/[id]/preview/page.tsx` — preview HDVH parse result: side-by-side so sánh draft vs published, diff (dùng pkg `diff`), nút "Chấp nhận & Xuất bản".
  - `users-manager/page.tsx` — danh sách + tạo/khoá/reset pw user (admin-only).
  - `settings/page.tsx` — chỉnh thông tin công ty, logo, slogan, socials, home stats, theme gradient, **AI provider config** (chọn provider + nhập key/model).
- Mọi mutation gọi API → ghi `audit_logs`.

**Bước 6 — Project Tree (React Flow + dagre)**
- `components/tree/ProjectsTree.tsx` — wrapper `'use client'` quanh `<ReactFlowProvider>` + `<ReactFlow>`.
- Node types: `RootNode` (TEA Group), `CategoryNode` (danh mục từ `PROJECT_CATEGORIES`), `ProjectNode` (từ bảng `projects`), `SectionNode` (từ `project_sections` đã publish).
- Auto-layout bằng `dagre` từ flat edge list; `fitView()` sau layout.
- Edge "tín hiệu" animate (overlay dashed + CSS `stroke-dashoffset`).
- Click/hover node → panel chi tiết (gallery, khách hàng, địa điểm, ngày, mô tả, hạng mục). `MiniMap`, `Controls`, `Background`.
- Search + filter (category, năm) + `setCenter()` focus + highlight node.
- Mobile (`<768px`) → accordion thay vì canvas.
- Data: `server/modules/projects/queries.ts` → `getPublishedTree()` lấy projects published + sections published.
- **SectionNode xuất hiện tự động** sau khi admin accept HDVH parse → không cần thao tác thủ công.

**Bước 7 — Public Projects trang**
- `(public)/projects/page.tsx` — hiển thị project tree. Nếu không có section, hiển thị project như card list.
- SEO + metadata per-locale.
- **Kiểm thử tổng Phase 3:**
  1. Chưa login → `/admin` redirect `/login`.
  2. Login sai → error message.
  3. Login đúng (admin) → vào được dashboard.
  4. Admin tạo/khoá user.
  5. Admin upload file HDVH (PDF/DOCX) → poll tới `done` → preview có sections → Accept → tree public có section node mới.
  6. Query `project_sections` as `anon` → KHÔNG thấy draft trước accept.
  7. 50 node @ 60fps; keyboard accessible; minimap phản ánh filter.
  8. Mobile (<768px) → accordion thay canvas.
  9. Mọi mutation có `audit_logs` row.

- File đại diện: `src/app/api/hdvh-parser/route.ts`, `src/server/modules/hdvh-parser/provider.ts`, `src/server/modules/hdvh-parser/providers/gemini.ts`, `src/server/modules/hdvh-parser/providers/ollama.ts`, `src/server/modules/hdvh-parser/provider-factory.ts`, `src/server/modules/hdvh-parser/extract.ts`, `src/server/modules/auth/rbac.ts`, `supabase/migrations/0004_admin_only_write.sql`, `src/app/[locale]/(auth)/login/page.tsx`, `src/middleware.ts`, `src/app/[locale]/(admin)/{dashboard,projects-manager,users-manager,settings}/page.tsx`, `src/components/tree/ProjectsTree.tsx`, `src/components/tree/nodes/ProjectNode.tsx`, `src/lib/tree-layout.ts`, `src/server/modules/projects/queries.ts`, `packages/shared/src/schemas/project-sections.ts`.

---

## 5. File quan trọng cần tạo (tập đại diện)

**Free AI Provider abstraction (mới):**
- `apps/web/src/server/modules/hdvh-parser/provider.ts` — interface `AiProvider` + type `ParseParams`.
- `apps/web/src/server/modules/hdvh-parser/provider-factory.ts` — factory đọc `settings.ai_config` và khởi tạo provider tương ứng.
- `apps/web/src/server/modules/hdvh-parser/providers/gemini.ts` — Gemini free JSON mode.
- `apps/web/src/server/modules/hdvh-parser/providers/ollama.ts` — Ollama local REST API.
- `apps/web/src/server/modules/hdvh-parser/providers/openrouter.ts` — OpenRouter free tier.
- `apps/web/src/server/modules/hdvh-parser/providers/anthropic.ts` — Anthropic trả phí (fallback).

**HDVH Parser (đã sửa):**
- `apps/web/src/app/api/hdvh-parser/route.ts` — Route Handler Node điều phối extract → AI provider → ghi DB + audit.
- `apps/web/src/server/modules/hdvh-parser/extract.ts` — extract text từ PDF/DOCX/TXT.

**Auth + Admin (đã điều chỉnh admin-only):**
- `apps/web/src/middleware.ts` — locale + guard session `(admin)/*`.
- `apps/web/src/app/[locale]/(auth)/login/page.tsx` — form login.
- `apps/web/src/server/modules/auth/rbac.ts` — `requireAdmin()` (chỉ 1 helper).
- `apps/web/src/app/[locale]/(admin)/{dashboard,projects-manager,users-manager,settings}/page.tsx`.
- `apps/web/src/app/api/uploads/route.ts` — upload file (admin-only).

**Project Tree (giữ nguyên logic):**
- `apps/web/src/components/tree/ProjectsTree.tsx` — cây `@xyflow/react` v12 + dagre + edge animate + minimap + mobile accordion.
- `apps/web/src/server/modules/projects/queries.ts` — `getPublishedTree()`.

**Migration mới:**
- `supabase/migrations/0004_admin_only_write.sql` — thu hồi quyền ghi editor.

**Env (đã thêm AI provider vars):**
- `.env.example` — `AI_PROVIDER`, `GEMINI_API_KEY`, `OLLAMA_BASE_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SMTP_*`, `CONTACT_TO_EMAIL`, `NEXT_PUBLIC_SITE_URL`.

---

## 6. Schema Supabase + RLS

**Tables (trường chính):**
- `profiles(id PK refs auth.users, role enum('admin','editor'), full_name, is_locked bool default false, created_by, created_at)`
- `projects(id uuid PK, slug unique, category enum, title, client, location, date, status enum('draft','published','archived'), description_vi, description_en, images jsonb, attachments jsonb, parse_status enum('idle','pending','processing','done','failed') default 'idle', parse_version int default 0, position jsonb, created_by, created_at, updated_at)`
- `project_sections(id uuid PK, project_id FK, type enum(overview|equipment|specs|operating|maintenance|safety|other), title_vi/en, content_vi/en, sort_order, source_doc, status enum('draft','published'), parse_version, created_at)`
- `settings(key text PK, value jsonb, updated_by, updated_at)` — keys: `company`, `socials`, `home_stats`, `theme_config`, `contact_email`
- `contact_messages(id uuid PK, name, email, phone, subject, body, status enum('new','read','replied','archived') default 'new', created_at)`
- `audit_logs(id bigint PK, actor uuid, action, entity, entity_id, payload jsonb, created_at)`

**Ma trận RLS (đã sửa — admin-only write):**
- `projects`/`project_sections`: SELECT `status='published'` (anon/auth); INSERT/UPDATE/DELETE chỉ `role='admin'`. Editor mất quyền ghi.
- `settings`: SELECT all (site cần theme/company); UPDATE chỉ `role='admin'`. Bỏ insert (settings có sẵn key từ seed).
- `profiles`: SELECT (own row) OR `role='admin'`; writes admin-only (trừ user tự update `full_name`).
- `contact_messages`: INSERT cho anon (+rate-limit ở API); SELECT/UPDATE admin-only.
- `audit_logs`: INSERT authenticated; SELECT admin-only.
- Storage: `project-images` public-read, admin write; `project-docs` admin-only; `models-3d` public-read. Editor mất quyền ghi storage.
- Ghi privileged (parser/contact) qua **service-role client phía server** (không bao giờ expose browser) hoặc SECURITY DEFINER function (attribution actor chính xác hơn).

---

## 7. Rủi ro & giảm thiểu

1. **3D/Core Web Vitals** — GLB + particle làm hỏng LCP/TBT. Giảm: render 3D dưới fold/sau first paint qua `requestIdleCallback`+`Suspense`; `dpr={[1,1.5]}`; `frameloop="demand"`; `useGLTF.preload`; tôn trọng `prefers-reduced-motion` (poster tĩnh); `ssr:false`. Ship poster `<img>` cho no-WebGL/crawler.
2. **SSR incompatible (R3F + xyflow)** — cả hai chạm `window`/`document`. Giảm: KHÔNG import trong Server Component; wrapper `'use client'` + flag `mounted` + guard `typeof window`.
3. **Deno không chạy mammoth/pdf-parse** — đã chọn Node Route Handler; không thử `npm:mammoth` trong Deno.
4. **RLS sai** — rò rỉ draft/editor chạm user. Giảm: viết **RLS test** ở migration-time (`set role anon/authenticated`) assert allow/deny từng table+state; service-role chỉ phía server; eslint cấm `SUPABASE_SERVICE_ROLE_KEY` trong `NEXT_PUBLIC_*`.
5. **AI drift/schema violation — provider khác nhau trả format khác nhau.** Gemini JSON mode ổn định hơn Ollama (dễ bị lỗi format). Giảm: retry với prompt chặt hơn; mỗi provider có prompt template riêng; chunk tài liệu dài; lưu raw text + raw response vào `audit_logs`; KHÔNG publish chưa Accept.
6. **Auth/session Next 15 + Supabase** — cookie model đổi. Giảm: pin `@supabase/ssr@^0.5`, dùng helper chính thức, refresh ở middleware; verify ở Phase 3 trước khi build admin.
7. **Hydration mismatch theme** — render server UTC vs client VN. Giảm: theme client-only + inline script pre-hydration set CSS var theo Asia/Ho_Chi_Minh; server render neutral default.
8. **Gemini free tier rate limit** — 60 req/phút. Giảm: queue HDVH parse requests; không parse đồng thời >1 file.
9. **Ollama không có sẵn trên server production** — chỉ dùng local dev / VPS tự host. Production mặc định là Gemini.

---

## 8. Chiến lược kiểm thử (end-to-end)

**Điều kiện chạy local (document trong `.env.example` + `docs/runbook.md`):** `pnpm install`; `supabase start`; `supabase db reset` (apply migration + seed); lấy URL/anon key từ `supabase status`; set `ANTHROPIC_API_KEY` throwaway để chạy parser (nếu không có → mock trong test).

**Kiểm từng giai đoạn (dùng Playwright MCP `mcp__playwright__browser_*` + Chrome/Lighthouse):**
- **P1:** mở `/vi` → redirect đúng; đổi `/en` tức thì (Network tab không full reload); toggle theme. `psql`: `set role anon; select * from projects where status='published';` trả seed; `insert` bị deny.
- **P2:** Home có canvas WebGL; `prefers-reduced-motion:reduce` → poster tĩnh; LCP < 2.5s.
- **P3 (gộp auth+admin+parser+tree):**
  1. Chưa login → `/admin` redirect `/login`.
  2. Login editor → `/users-manager` 403 (vì RLS admin-only).
  3. Login admin → dashboard, tạo/khoá user; `audit_logs` có row.
  4. Admin upload PDF + DOCX → poll tới `done`.
  5. Preview có 6 loại section → diff khác rỗng → Accept → tree public có `SectionNode` mới.
  6. Query `project_sections` as `anon` KHÔNG thấy draft trước accept.
  7. `/vi/projects` render cây; click node → panel; zoom; minimap; resize 375px → accordion; search → `setCenter` focus.
- **P4 (cũ P6):** honeypot → drop; hợp lệ → có row + email (Resend dashboard); `X-Robots-Tag: noindex` trên `/admin/*`; `typecheck && lint && test` xanh; Lighthouse ≥ 90.

---

## 9. Ghi chú thực thi

- **Bước vật lý đầu tiên (Phase 1):** chuyển toàn bộ thư mục reference → `docs-reference/` (giữ nguyên), copy `Logo.png` → `apps/web/public/images/logo.png`, `git init`, rồi dựng monorepo pnpm sạch ở root.
- Tuân thủ quy tắc commit của repo: **mỗi file một commit** (xem `CLAUDE.md`).
- Mọi tài khoản/scheme/migration phải chạy được với placeholder env; khi khách hàng cấp Supabase thật + Anthropic key chỉ cần `supabase link && db push` và điền `.env`.
