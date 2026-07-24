# 🎨 Components Directory

**Purpose:** Tất cả React components của web application

---

## 📂 Component Categories

```
components/
├── ui/              # shadcn/ui base components (buttons, inputs, etc.)
├── 3d/              # React Three Fiber 3D scenes
├── tree/            # React Flow tree components (Phase 3)
├── theme/           # Theme provider & background components
├── layout/          # Layout components (header, footer, nav)
├── admin/           # Admin dashboard components (Phase 4)
├── home/            # Homepage-specific sections
├── video/           # Video player components
└── server-components/ # Server-only components
```

---

## 🎯 Component Architecture

### Client Components (`'use client'`)
- **3D components** - R3F requires client-side rendering
- **Theme components** - Context providers
- **Interactive components** - Forms, buttons with handlers

### Server Components
- **Layout components** - Static layouts
- **Data-fetching components** - Server-side data fetching
- **SEO components** - Metadata, structured data

---

## 🔑 Key Patterns

### 1. 3D Components Pattern
```typescript
'use client';
import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('./Scene3D'), { ssr: false });
export default function Scene3DWrapper() { return <Scene3D />; }
```

### 2. Theme Component Pattern
```typescript
'use client';
// NEVER create additional Context providers
// Always consume from existing ThemeProvider
```

### 3. Server Component Pattern
```typescript
// No 'use client' directive
// Can use async/await for data fetching
export default async function Component() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

---

## 📚 Subdirectories

| Directory | Purpose | Notes |
|-----------|---------|-------|
| [`ui/`](ui/) | shadcn/ui base components | Copy & modify from shadcn/ui |
| [`3d/`](3d/) | R3F 3D scenes | Must use `ssr: false` |
| [`tree/`](tree/) | React Flow tree (Phase 3) | `@xyflow/react` v12 |
| [`theme/`](theme/) | Theme system | CRITICAL - single provider |
| [`layout/`](layout/) | Layout components | Header, footer, navigation |
| [`admin/`](admin/) | Admin UI (Phase 4) | Dashboard, tables |
| [`home/`](home/) | Homepage sections | Hero, solutions, contact |
| [`video/`](video/) | Video players | Video components |

---

## ⚠️ Gotchas

### 3D Components
- ⚠️ **Must use `'use client'` directive**
- ⚠️ **Must use `dynamic(..., { ssr: false })`**
- ⚠️ **Next 15 forbids ssr:false in server components**

### Theme Components
- ⚠️ **NEVER create additional Context providers**
- ⚠️ **Always consume from existing ThemeProvider**
- ⚠️ **Single source of truth: `components/theme/ThemeProvider.tsx`**

### Client vs Server Components
- ⚠️ **Default to server components** (better performance)
- ⚠️ **Only use client when needed** (interactivity, 3D, browser APIs)

---

## 🎨 Naming Conventions

```typescript
// ✅ GOOD - Descriptive names
SolutionCard.tsx
Hero3DScene.tsx
ThemeBackground.tsx

// ❌ BAD - Generic names
Card.tsx
Scene.tsx
Background.tsx
```

---

## 🔗 Related

- **Parent:** [`../../`](../../) - Web app root
- **App structure:** [`../app/`](../app/) - Next.js App Router
- **Utilities:** [`../lib/`](../lib/) - Client utilities
- **Docs:** [`../../../../PROJECT-QUICK-REFERENCE.md`](../../../../PROJECT-QUICK-REFERENCE.md)

---

*Last updated: 2026-07-22*
