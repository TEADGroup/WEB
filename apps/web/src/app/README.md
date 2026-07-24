# 📱 App Directory (Next.js App Router)

**Purpose:** Next.js 15 App Router structure - routes, layouts, pages

---

## 📋 Overview

Thư mục này chứa **Next.js App Router** structure:
- File-based routing
- Route groups `(public)`, `(auth)`
- API routes
- Layouts

---

## 🎯 Route Structure

```
app/
├── [locale]/                 # i18n routes (vi/en)
│   ├── (public)/            # Public routes (no auth)
│   │   ├── page.tsx         # Homepage
│   │   └── solutions/       # Solution pages
│   ├── (auth)/              # Protected routes (auth required)
│   │   └── admin/           # Admin dashboard
│   └── layout.tsx           # Root layout (i18n + theme)
│
└── api/                      # API routes (backend logic)
    ├── auth/                # Authentication endpoints
    ├── projects/            # Project CRUD
    ├── uploads/             # File upload
    ├── hdvh-parser/         # AI parsing
    └── settings/            # System settings
```

---

## 🌐 i18n Routing

### File Structure
```typescript
app/[locale]/
├── (public)/page.tsx       # → /vi/page, /en/page
├── (auth)/admin/page.tsx    # → /vi/admin, /en/admin
└── layout.tsx              # Root layout
```

### Locale Detection
```typescript
// Detects from:
// 1. URL path (/vi or /en)
// 2. Accept-Language header
// 3. Cookie preference
// 4. Defaults to 'vi' (Vietnamese)
```

---

## 🔧 Route Patterns

### Public Page
```typescript
// app/[locale]/(public)/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('Home');
  return <div>{t('title')}</div>;
}
```

### Protected Page
```typescript
// app/[locale]/(auth)/admin/page.tsx
import { requireAuth } from '@/lib/supabase/server';

export default async function AdminPage() {
  const user = await requireAuth();
  return <div>Welcome {user.email}</div>;
}
```

### API Route
```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const projects = await getProjects();
  return NextResponse.json(projects);
}
```

---

## ⚠️ Gotchas

### 1. i18n in Server Components
```typescript
// ❌ WRONG
export default async function Page() {
  const t = useTranslations(); // 💥 CRASH
}

// ✅ RIGHT
export default async function Page() {
  const t = await getTranslations(); // ✅ OK
}
```

### 2. Route Groups
```typescript
// (public) - Parentheses = folder not in URL
// → /vi/page (not /vi/public/page)

// (auth) - Protected routes
// → /vi/admin (not /vi/auth/admin)
```

### 3. Dynamic Routes
```typescript
// app/[locale]/projects/[id]/page.tsx
export default async function ProjectPage({ params }) {
  const { locale, id } = params;
  // locale: 'vi' or 'en'
  // id: project ID
}
```

---

## 🔗 Related

- **Parent:** [`../`](../) - Web app root
- **Components:** [`../components/`](../components/) - React components
- **Lib:** [`../lib/`](../lib/) - Utilities
- **i18n config:** [`../i18n/`](../i18n/) - i18n setup

---

## 📚 Next.js 15 Resources

- **App Router docs:** https://nextjs.org/docs/app
- **i18n docs:** https://next-intl-docs.vercel.app
- **API routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

*Last updated: 2026-07-22*
