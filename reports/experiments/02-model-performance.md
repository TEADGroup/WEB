# Phase 3 — Implementation Plan

> TEA Group website — Auth/Admin/RBAC + Free AI HDVH Parser + Project Tree

## Context

Phase 3 is the largest phase — it builds the entire internal backend for TEA Group. Currently the site is a static public page (Phase 1+2). Phase 3 adds:

- **Auth** so admin can log in
- **Admin Dashboard** to manage projects, users, settings, and HDVH parsing
- **Free AI HDVH Parser** (via OpenCode + DeepSeek) that extracts structured sections from operation manuals
- **Project Tree** (React Flow) that visualizes projects and auto-updates from parsed HDVH sections
- **Admin-only write** — RLS and middleware ensure only admin can mutate data

**Connections:** OpenCode at `http://localhost:20128/v1` with `deepseek-v4-flash-free`. Supabase at `bsmxfrnpplkkuuapbguc.supabase.co` (URL + anon key verified OK, no migrations yet).

---

## Step 1 — Auth + Middleware Guard

### 1a. Auth API routes

Create `apps/web/src/app/api/auth/login/route.ts`:
```typescript
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });
  return NextResponse.json({ success: true });
}
```

Create `apps/web/src/app/api/auth/logout/route.ts`:
```typescript
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
```

### 1b. Update middleware.ts

Compose intl middleware with auth guard:

```typescript
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { createSupabaseServerClient } from './lib/supabase/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply intl middleware first for locale handling
  const intlResponse = await intlMiddleware(request);
  const response = intlResponse || NextResponse.next();

  // Guard admin routes — require valid session
  const adminPattern = /\/(vi|en)\/admin/;
  if (adminPattern.test(pathname)) {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const locale = pathname.match(/^\/(vi|en)/)?.[1] || 'vi';
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### 1c. Login page

Create `apps/web/src/app/[locale]/(auth)/login/page.tsx`:
- `'use client'` component
- Form: email + password + submit
- Calls `POST /api/auth/login`
- On success → redirect to `/{locale}/admin/dashboard`
- On error → show error message
- Uses `useTranslations('Login')` — add i18n keys

### 1d. Admin layout

Create `apps/web/src/app/[locale]/(admin)/layout.tsx`:
- Server component (locale layout)
- Wraps children with admin sidebar/menu
- Sets `robots: noindex, nofollow` via `<meta name="robots" content="noindex,nofollow" />`
- Admin nav: Dashboard, Projects, Users, Settings
- Logout button
- Reuse `<PublicHeader>` or create `<AdminHeader>`

---

## Step 2 — RLS Admin-Only Write (Migration 0004)

Create `supabase/migrations/0004_admin_only_write.sql`:

```sql
-- Remove editor write access on projects
drop policy if exists "projects_staff_all" on public.projects;
create policy "projects_admin_all"
  on public.projects for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Remove editor write access on project_sections
drop policy if exists "sections_staff_all" on public.project_sections;
create policy "sections_admin_all"
  on public.project_sections for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Remove editor insert on settings (update-only for admin)
drop policy if exists "settings_admin_insert" on public.settings;
-- settings_admin_update already only allows admin

-- Lock down profiles (admin all, except self-name-update)
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Storage: change project-images from editor to admin-only
drop policy if exists "project_images_staff_insert" on storage.objects;
drop policy if exists "project_images_staff_update" on storage.objects;
drop policy if exists "project_images_staff_delete" on storage.objects;
create policy "project_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and public.current_user_role() = 'admin');
create policy "project_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'project-images' and public.current_user_role() = 'admin')
  with check (bucket_id = 'project-images' and public.current_user_role() = 'admin');
create policy "project_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'project-images' and public.current_user_role() = 'admin');
```

---

## Step 3 — Free AI Provider Abstraction

### 3a. Interface

Create `apps/web/src/server/modules/hdvh-parser/provider.ts`:
```typescript
import type { ProjectSectionsResult } from '@tea/shared';
import type { z } from 'zod';

export interface ParseParams {
  text: string;
  language: 'vi' | 'en';
}

export interface AiProvider {
  readonly name: string;
  parseDocument(params: ParseParams): Promise<ProjectSectionsResult>;
  ping(): Promise<boolean>;
}
```

### 3b. OpenCodeProvider

Create `apps/web/src/server/modules/hdvh-parser/providers/opencode.ts`:
```typescript
import type { AiProvider, ParseParams } from '../provider';

export class OpenCodeProvider implements AiProvider {
  readonly name = 'opencode';
  
  constructor(private config: { baseUrl: string; model: string }) {}

  async parseDocument(params: ParseParams) {
    const prompt = buildPrompt(params);
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 4096,
      }),
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  async ping() {
    const res = await fetch(`${this.config.baseUrl}/models`);
    return res.ok;
  }
}

function buildPrompt(params: ParseParams): string {
  const lang = params.language === 'vi' ? 'Vietnamese' : 'English';
  return `You are an industrial automation engineer. Analyze this HDVH (operation manual) document.
Extract structured sections in ${lang}.

Return JSON with this exact schema:
{
  "project_title_vi": "string (optional)",
  "project_title_en": "string (optional)",
  "summary_vi": "string (optional, 1-2 sentences)",
  "summary_en": "string (optional, 1-2 sentences)",
  "sections": [
    {
      "type": "overview|equipment|specs|operating|maintenance|safety|other",
      "title_vi": "string",
      "title_en": "string",
      "content_vi": "string (full content, may be multi-line)",
      "content_en": "string (full content, may be multi-line)",
      "items": ["string"] (optional, bullet items)
    }
  ]
}

Document text:
${params.text}`;
}
```

### 3c. Factory

Create `apps/web/src/server/modules/hdvh-parser/provider-factory.ts`:
```typescript
import type { AiConfig } from '@tea/shared';
import type { AiProvider } from './provider';
import { OpenCodeProvider } from './providers/opencode';

export function createAiProvider(config: AiConfig): AiProvider {
  switch (config.provider) {
    case 'opencode':
      return new OpenCodeProvider({
        baseUrl: config.opencodeBaseUrl,
        model: config.opencodeModel,
      });
    // Future: gemini, ollama, openrouter, anthropic
    default:
      return new OpenCodeProvider({
        baseUrl: config.opencodeBaseUrl,
        model: config.opencodeModel,
      });
  }
}
```

### 3d. Text extraction utility

Create `apps/web/src/server/modules/hdvh-parser/extract.ts`:
```typescript
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }
  if (mimeType === 'application/pdf') {
    // Use pdf-parse
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    return data.text;
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // Use mammoth
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error(`Unsupported MIME type: ${mimeType}`);
}
```

---

## Step 4 — HDVH Parser Route Handler

### 4a. Upload route

Create `apps/web/src/app/api/uploads/route.ts`:
- `POST` (admin-only via middleware guard + RBAC check)
- Accept multipart form with file
- Upload to `project-docs` Supabase bucket
- Return file path + URL

### 4b. Parse route

Create `apps/web/src/app/api/hdvh-parser/route.ts` (Node runtime, maxDuration 300):
```typescript
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  // 1. Auth check: requireAdmin()
  // 2. Parse query params: projectId, filePath
  // 3. Download blob from project-docs bucket
  // 4. Extract text via extractTextFromFile()
  // 5. Read ai_config from settings table
  // 6. Call createAiProvider(config).parseDocument({ text })
  // 7. Validate result with projectSectionsResultSchema.safeParse()
  // 8. Write draft sections to project_sections (status='draft')
  // 9. Update projects.parse_status='done'
  // 10. Log to audit_logs
  // 11. Return result
}
```

### 4c. Parse status polling

Create `apps/web/src/app/api/projects/[id]/parse-status/route.ts`:
- `GET` — returns `{ status: 'idle'|'pending'|'processing'|'done'|'failed', error?: string }`

---

## Step 5 — RBAC Helper

Create `apps/web/src/server/modules/auth/rbac.ts`:
```typescript
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (profile?.role !== 'admin') {
    throw new Error('Forbidden — admin role required');
  }
  return session;
}
```

---

## Step 6 — Admin Dashboard Pages

### Route group structure
```
apps/web/src/app/[locale]/(admin)/
  layout.tsx              ← admin layout (sidebar, noindex, admin check)
  dashboard/page.tsx      ← stats overview
  projects-manager/
    page.tsx              ← project list, CRUD
    [id]/
      page.tsx            ← project edit form + file upload + HDVH upload
      preview/page.tsx    ← HDVH preview / diff / accept
  users-manager/page.tsx  ← user list, create, lock/unlock
  settings/page.tsx       ← company info, theme, AI provider config
```

### Admin layout pattern:
```typescript
// Server component layout
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <meta name="robots" content="noindex,nofollow" />
      {/* Admin sidebar + header */}
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </>
  );
}
```

### Key features per page:
- **Dashboard**: total projects, published/draft counts, recent audit logs, new contact messages
- **Projects Manager**: table with category/status filter, create/edit/delete, image upload to `project-images` bucket, HDVH file upload to `project-docs` bucket
- **Project Detail**: edit form (slug, category, title, client, location, date, description, images), upload HDVH file → trigger parse → show status link
- **HDVH Preview**: side-by-side draft vs published sections, text diff, "Chấp nhận & Xuất bản" button
- **Users Manager**: list profiles, create user (via admin API), lock/unlock, reset password
- **Settings**: company info (name, address, phone, email, logo), social links, home stats, theme gradient, AI provider config (provider selector + API key fields)

---

## Step 7 — Project Tree (React Flow)

### 7a. Install dependencies
```bash
pnpm add @xyflow/react dagre @types/dagre -D
```

### 7b. Tree layout utility

Create `apps/web/src/lib/tree-layout.ts`:
```typescript
import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return { ...node, position: { x: pos.x - 100, y: pos.y - 40 } };
  });

  return { nodes: layoutedNodes, edges };
}
```

### 7c. Queries

Create `apps/web/src/server/modules/projects/queries.ts`:
```typescript
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getPublishedTree() {
  const supabase = await createSupabaseServerClient();
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('date', { ascending: false });

  const { data: sections } = await supabase
    .from('project_sections')
    .select('*')
    .eq('status', 'published');

  return { projects, sections };
}
```

### 7d. Tree component

Create `apps/web/src/components/tree/ProjectsTree.tsx`:
- `'use client'` wrapper with `dynamic(..., { ssr: false })` approach
- `<ReactFlowProvider>` + `<ReactFlow>` with custom node types
- `MiniMap`, `Controls`, `Background`
- 4 node types: `RootNode` (TEA Group), `CategoryNode`, `ProjectNode`, `SectionNode`
- Edge animation (dashed + CSS animation)
- Search/filter → `setCenter()` focus
- Mobile (<768px): fallback to accordion

### 7e. Node components

Create `apps/web/src/components/tree/nodes/ProjectNode.tsx`:
```typescript
import { Handle, Position, type NodeProps } from '@xyflow/react';

export function ProjectNode({ data }: NodeProps) {
  return (
    <div className="rounded-xl bg-white/80 shadow-card p-4 border border-brand-blue/20">
      <Handle type="target" position={Position.Top} />
      <p className="font-display text-sm font-semibold">{data.label}</p>
      <p className="text-xs text-slate-500">{data.client}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

---

## Step 8 — Public Projects Section

Update `apps/web/src/components/home/HomeClient.tsx`:
- Replace the "coming soon" placeholder in section `#projects`
- Add dynamic import for `ProjectsTree` with `ssr: false` and `Suspense`
- Keep fallback card while component loads

---

## Step 9 — i18n Keys

Add to `apps/web/src/locales/en.json` and `vi.json`:

```json
{
  "Login": {
    "title": "Admin Login",
    "email": "Email",
    "password": "Password",
    "submit": "Sign in",
    "error": "Invalid credentials",
    "loggingIn": "Signing in…"
  },
  "Admin": {
    "dashboard": "Dashboard",
    "projects": "Projects",
    "users": "Users",
    "settings": "Settings",
    "logout": "Sign out",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm",
    "create": "Create",
    "edit": "Edit",
    "preview": "Preview",
    "accept": "Accept & Publish",
    "upload": "Upload",
    "parseStatus": "Parse status",
    "noData": "No data"
  }
}
```

---

## Step 10 — Install Dependencies

```bash
cd c:/Users/MinhHY/Desktop/WEB_TEA
pnpm add pdf-parse mammoth
pnpm add @xyflow/react dagre
pnpm add -D @types/dagre @types/pdf-parse @types/mammoth
```

---

## Verification

1. **Auth**: visit `/vi/admin` → redirect to `/vi/login`; login with admin credentials → redirect to dashboard
2. **RLS**: run `supabase db push` with migration 0004; `set role editor; insert into projects...` fails
3. **HDVH Parser**: upload PDF → poll status → preview shows sections → Accept → tree updates
4. **Admin Dashboard**: CRUD project, create user, edit settings, change AI provider
5. **Project Tree**: `/vi#projects` shows interactive tree; click node → panel; filter → focus
6. **Typecheck**: `pnpm typecheck` clean
7. **Admin-only**: editor user cannot access `/users-manager` or perform any mutation

---

## File Increment Order

1. `supabase/migrations/0004_admin_only_write.sql`
2. `apps/web/src/server/modules/auth/rbac.ts`
3. `apps/web/src/middleware.ts` (modify)
4. `apps/web/src/app/api/auth/login/route.ts`
5. `apps/web/src/app/api/auth/logout/route.ts`
6. `apps/web/src/app/[locale]/(auth)/login/page.tsx`
7. `apps/web/src/app/[locale]/(admin)/layout.tsx`
8. `apps/web/src/app/[locale]/(admin)/dashboard/page.tsx`
9. `apps/web/src/app/[locale]/(admin)/projects-manager/page.tsx`
10. `apps/web/src/app/[locale]/(admin)/projects-manager/[id]/page.tsx`
11. `apps/web/src/app/[locale]/(admin)/projects-manager/[id]/preview/page.tsx`
12. `apps/web/src/app/[locale]/(admin)/users-manager/page.tsx`
13. `apps/web/src/app/[locale]/(admin)/settings/page.tsx`
14. `apps/web/src/server/modules/hdvh-parser/provider.ts`
15. `apps/web/src/server/modules/hdvh-parser/providers/opencode.ts`
16. `apps/web/src/server/modules/hdvh-parser/provider-factory.ts`
17. `apps/web/src/server/modules/hdvh-parser/extract.ts`
18. `apps/web/src/app/api/hdvh-parser/route.ts`
19. `apps/web/src/app/api/projects/[id]/parse-status/route.ts`
20. `apps/web/src/server/modules/projects/queries.ts`
21. `apps/web/src/lib/tree-layout.ts`
22. `apps/web/src/components/tree/nodes/ProjectNode.tsx` (+ RootNode, CategoryNode, SectionNode)
23. `apps/web/src/components/tree/ProjectsTree.tsx`
24. `apps/web/src/components/home/HomeClient.tsx` (modify — replace projects placeholder)
25. `apps/web/src/locales/en.json` + `vi.json` (modify — add admin + login keys)
