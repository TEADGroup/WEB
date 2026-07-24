# 🌐 [locale] Directory (i18n Routes)

**Purpose:** Internationalized routes cho Vietnamese (vi) và English (en)

---

## 📋 Overview

Thư mục này chứa **i18n routes** sử dụng next-intl:
- `[locale]` dynamic segment (`vi` or `en`)
- Route groups `(public)` và `(auth)`
- Root layout với i18n + theme provider

---

## 🎯 Route Structure

```
[locale]/
├── (public)/            # Public routes (no auth required)
│   ├── page.tsx         # Homepage
│   ├── solutions/
│   │   └── page.tsx    # Solutions listing
│   └── layout.tsx       # Public layout
│
├── (auth)/              # Protected routes (auth required)
│   └── admin/
│       ├── page.tsx     # Admin dashboard
│       ├── projects/
│       └── settings/
│
└── layout.tsx           # Root layout (i18n + theme)
```

---

## 🌐 Locales

| Code | Language | Default |
|------|----------|---------|
| `vi` | Vietnamese | ✅ Yes |
| `en` | English | No |

**Default locale:** `vi` (Vietnamese)

---

## 🔧 URL Structure

```
/                    → Redirects to /vi
/vi                  → Vietnamese homepage
/en                  → English homepage
/vi/solutions        → Vietnamese solutions
/en/solutions        → English solutions
/vi/admin            → Vietnamese admin (protected)
```

---

## 📝 Translation Files

```typescript
// locales/vi/common.json
{
  "title": "TEA Group",
  "description": "Tự động hóa công nghiệp"
}

// locales/en/common.json
{
  "title": "TEA Group",
  "description": "Industrial Automation"
}
```

---

## 🔧 Usage

### In Server Components
```typescript
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('Home');
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### In Client Components
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('Home');
  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  );
}
```

### Locale-Aware Navigation
```typescript
import { Link, useRouter } from '@/i18n/navigation';

// Link component (locale-aware)
<Link href="/solutions">Solutions</Link>

// Router hook (locale-aware)
const router = useRouter();
router.push('/solutions');
```

---

## ⚠️ Gotchas

### 1. Async Server Components
```typescript
// ❌ WRONG - useTranslations in async server component
export default async function Page() {
  const t = useTranslations(); // 💥 CRASH
}

// ✅ RIGHT - getTranslations
export default async function Page() {
  const t = await getTranslations(); // ✅ OK
}
```

### 2. Locale Detection
```typescript
// ⚠️ next-intl@3.26.5 does NOT export hasLocale
// ❌ WRONG: import { hasLocale } from 'next-intl';

// ✅ RIGHT: Use local isLocale from routing.ts
import { isLocale } from '@/i18n/routing';
```

### 3. Route Groups
```typescript
// (public) - Folder name not in URL
// → /vi/page (not /vi/public/page)

// (auth) - Protected routes
// → /vi/admin (not /vi/auth/admin)
```

---

## 🔗 Related

- **Parent:** [`../`](../) - App directory
- **i18n config:** [`../../i18n/`](../../i18n/) - i18n setup
- **Locales:** [`../../locales/`](../../locales/) - Translation files
- **Navigation:** [`../../i18n/navigation.ts`](../../i18n/navigation.ts) - Locale-aware routing

---

## 📚 next-intl Resources

- **Documentation:** https://next-intl-docs.vercel.app
- **GitHub:** https://github.com/amannn/next-intl

---

*Last updated: 2026-07-22*
**Version:** next-intl@3.26.5
