# 🌐 TEA Group - Web Application

**Package:** `@tea/web`  
**Framework:** Next.js 15 (App Router) + React 19  
**Purpose:** Corporate website for TEA Group (industrial automation & electrical control, Ho Chi Minh City, Vietnam)

---

## 🎯 Mục đích

Đây là **Next.js app chính** của project, bao gồm:
- **Public website** (bilingual VI/EN) với dynamic time-of-day theme
- **3D hero scene** (React Three Fiber) - gears, robot arm, controller
- **Solution cards** với 3D models (BrainStem, CesiumMilkTruck, ChronographWatch)
- **Admin dashboard** (Phase 4) - Supabase Auth + RBAC
- **API routes** - RESTful endpoints cho frontend
- **Project tree** (Phase 3) - React Flow interactive node graph

---

## 📂 Cấu trúc thư mục

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                # 🌐 Bilingual routes (vi/en)
│   │   ├── (public)/            # Public pages (no auth required)
│   │   │   ├── page.tsx         # Homepage (single-page scroll)
│   │   │   ├── solutions/       # Solutions pages
│   │   │   └── layout.tsx       # Public layout
│   │   ├── (auth)/              # 🔒 Protected pages (auth required)
│   │   │   └── admin/           # Admin dashboard (Phase 4)
│   │   └── layout.tsx           # Root layout (i18n + theme)
│   │
│   └── api/                      # 🔌 API Routes (backend logic)
│       ├── auth/                # Authentication endpoints
│       ├── users/               # User management (admin only)
│       ├── projects/            # Project CRUD + tree data
│       ├── uploads/              # File upload (images, docs)
│       ├── hdvh-parser/         # AI HDVH document parsing (Phase 5)
│       ├── settings/            # System settings (admin only)
│       └── contact/             # Contact form submission (Phase 6)
│
├── components/                   # 🎨 React components
│   ├── ui/                      # shadcn/ui base components
│   ├── 3d/                      # 🎮 R3F 3D scenes (Hero + solution cards)
│   ├── tree/                    # 🌳 React Flow tree (Phase 3)
│   ├── theme/                   # 🌓 Theme provider + background
│   ├── layout/                  # Layout components (header, footer, nav)
│   ├── admin/                   # Admin UI components (Phase 4)
│   ├── home/                    # Homepage sections
│   ├── video/                   # Video components
│   └── server-components/       # Server-only components
│
├── lib/                          # 🔧 Client utilities
│   ├── supabase/               # Supabase clients (server, client, service)
│   ├── anthropic/              # Anthropic AI SDK (HDVH parsing)
│   ├── resend/                 # Email sending (Phase 6)
│   ├── theme.ts                # Theme utilities
│   └── search/                 # Search utilities
│
├── server/                       # 🖥️ Server-side logic
│   └── modules/                # Business logic modules
│       ├── auth/               # Authentication utilities
│       ├── hdvh-parser/        # HDVH document parsing logic
│       └── projects/           # Project business logic
│
├── hooks/                        # 🪝 React hooks
│   ├── use-theme.ts            # Theme hook (WARNING: use sparingly)
│   └── use-supabase.ts         # Supabase auth hook
│
├── i18n/                         # 🌐 Internationalization
│   ├── routing.ts              # Locale detection & routing
│   └── navigation.ts           # Locale-aware Link & useRouter
│
├── locales/                      # 📝 Translation files (vi/en)
│   ├── vi/
│   └── en/
│
├── types/                        # 📘 TypeScript types
│   └── supabase.ts             # Auto-generated from Supabase
│
└── styles/                       # 🎨 Global styles
    └── globals.css              # CSS variables + Tailwind
```

---

## 🔑 Files quan trọng

| File | Mô tả | Notes cho AI |
|------|-------|--------------|
| [`src/lib/theme.ts`](src/lib/theme.ts) | Theme utilities | ⚠️ SINGLE source of truth for theme logic |
| [`src/components/theme/ThemeProvider.tsx`](src/components/theme/ThemeProvider.tsx) | Theme Context provider | ⚠️ ONLY provider - never create additional ones |
| [`src/i18n/routing.ts`](src/i18n/routing.ts) | Locale routing | ⚠️ Uses local `isLocale()` due to next-intl bug |
| [`src/i18n/navigation.ts`](src/i18n/navigation.ts) | Locale-aware Link/router | ✅ Use this instead of Next.js default |
| [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts) | Supabase SSR client | ✅ For server components |
| [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts) | Supabase browser client | ✅ For client components |
| [`src/lib/supabase/service.ts`](src/lib/supabase/service.ts) | Supabase service-role | 🔐 SERVER ONLY, bypasses RLS |

---

## ⚡ Gotchas quan trọng

### 1. **Theme System**
```typescript
// ❌ WRONG: Calling from multiple components
const theme = useTheme(); // In multiple places

// ✅ RIGHT: Single provider, consume via Context
<ThemeProvider>
  <App />
</ThemeProvider>
```

### 2. **i18n in Server Components**
```typescript
// ❌ WRONG: useTranslations in async server component
export default async function Page() {
  const t = useTranslations(); // 💥 CRASH
}

// ✅ RIGHT: getTranslations
export default async function Page() {
  const t = await getTranslations();
}
```

### 3. **3D Components (R3F)**
```typescript
// ❌ WRONG: In server component
export default function Page() {
  return <Scene3D />; // 💥 CRASH
}

// ✅ RIGHT: Client component wrapper
'use client';
export default function Scene3DWrapper() {
  const Scene3D = dynamic(() => import('./Scene3D'), { ssr: false });
  return <Scene3D />;
}
```

### 4. **React Flow Tree**
```typescript
// Package name changed in v12:
import '@xyflow/react/dist/style.css'; // ✅ RIGHT
// NOT: import 'reactflow/dist/style.css'; // ❌ WRONG
```

### 5. **Node-only Libraries**
```typescript
// hdvh-parser/route.ts
export const runtime = 'nodejs'; // ✅ REQUIRED for mammoth, pdf-parse

// ❌ WRONG: In Edge function
export const runtime = 'edge'; // 💥 CRASH
```

---

## 🚀 Commands

```bash
# Development
pnpm --filter @tea/web dev         # Start dev server (localhost:3000)
pnpm --filter @tea/web build       # Production build
pnpm --filter @tea/web start       # Start production server

# Type checking
pnpm --filter @tea/web typecheck   # TypeScript check

# Database (from root)
pnpm db:types                      # Regenerate Supabase types
```

---

## 🌐 Routes Structure

### Public Routes (no auth)
- `/` or `/vi` → Homepage (Vietnamese, default)
- `/en` → Homepage (English)
- `/vi/solutions/*` → Solution pages
- `/vi/blog/*` → Blog posts (if any)

### Protected Routes (auth required, Phase 4)
- `/vi/admin` → Admin dashboard
- `/vi/admin/projects` → Project management
- `/vi/admin/users` → User management
- `/vi/admin/settings` → System settings

### API Routes
- `/api/auth/*` → Authentication (login, logout, refresh)
- `/api/users/*` → User CRUD (admin only)
- `/api/projects/*` → Project CRUD + tree structure
- `/api/uploads` → File upload (images, PDF, DOCX)
- `/api/hdvh-parser` → AI HDVH document parsing (Phase 5)
- `/api/settings` → System settings (admin only)
- `/api/contact` → Contact form submission (Phase 6)

---

## 🎨 Styling Conventions

```css
/* Brand colors (from logo) */
--brand-blue: #0099FF;    /* Saturated - small accents only */
--brand-green: #00A651;   /* Saturated - small accents only */
--brand-red: #FF3333;     /* Saturated - small accents only */

/* Desaturated tints for backgrounds */
--bg-tint-blue: #E6F3FF;
--bg-tint-green: #E6FFE9;

/* Dark mode base */
--dark-base: #0A1626;     /* Not pure black */
```

> 💡 **Rule:** Use saturated brand colors ONLY for logo, CTAs, stat numbers. Backgrounds use desaturated tints.

---

## 📦 Dependencies

### Core Framework
- `next@15` - Next.js App Router
- `react@19` - React
- `typescript@5` - TypeScript

### UI & Styling
- `tailwindcss@3` - Utility-first CSS
- `@xyflow/react@12` - React Flow (project tree)
- `gsap@3` - Animations
- `@gsap/react@2` - GSAP React integration

### 3D
- `@react-three/fiber@9` - R3F renderer
- `@react-three/drei@10` - R3F helpers
- `three@0.185` - 3D library

### Backend
- `@supabase/supabase-js@2` - Supabase client
- `@supabase/ssr@0.5` - Supabase SSR helpers
- `@anthropic-ai/sdk@0.27` - Anthropic AI (HDVH parsing)

### Internationalization
- `next-intl@3.26` - i18n for Next.js

### Utilities
- `dagre@0.8` - Graph layout algorithm (for React Flow)
- `zod@3` - Schema validation (via @tea/shared)

---

## 🔗 Liên kết

- **Parent:** [`../../`](../../) - Root monorepo
- **Related:** [`packages/shared/`](../../packages/shared/) - Shared schemas & types
- **Docs:** [`docs/runbook.md`](../../docs/runbook.md) - Setup guide
- **Architecture:** [`../../CLAUDE.md`](../../CLAUDE.md) - Full architecture docs

---

## 🤖 Notes cho AI

### Khi làm việc ở đây:

1. **I18n first:** Luôn suy nghĩ về VI/EN translations khi thêm text
2. **Theme aware:** Theme có 4 phases (dawn/day/dusk/night), không chỉ light/dark
3. **Supabase RLS:** Mọi table đều có RLS enabled - anon users chỉ đọc `status='published'`
4. **3D performance:** R3F components phải được lazy-loaded với `ssr: false`
5. **Type safety:** Use `@tea/shared` zod schemas cho data validation

### Files nên đọc trước khi làm việc:

1. [`src/lib/theme.ts`](src/lib/theme.ts) - Theme system logic
2. [`src/i18n/routing.ts`](src/i18n/routing.ts) - Locale routing
3. [`src/lib/supabase/`](src/lib/supabase/) - Supabase client patterns
4. [`src/app/[locale]/layout.tsx`](src/app/[locale]/layout.tsx) - Root layout pattern

---

**📦 Package:** `@tea/web`  
**🎯 Framework:** Next.js 15 + React 19  
**🌐 Locales:** vi (default), en  
**🌓 Theme:** Dynamic time-of-day (Asia/Ho_Chi_Minh)

*Last updated: 2026-07-22*
