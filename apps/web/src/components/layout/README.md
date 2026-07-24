# 📐 Layout Components

**Purpose:** Layout components - header, footer, navigation, page wrappers

---

## 📋 Overview

Thư mục này chứa **layout components** used across pages:
- Header (logo, navigation, theme toggle)
- Footer (links, copyright, social)
- Navigation (menu, breadcrumbs)
- Page wrappers (container, section)

---

## 🎯 Available Components

```
layout/
├── Header.tsx           # Site header (logo, nav, theme toggle)
├── Footer.tsx           # Site footer (links, copyright)
├── Navigation.tsx       # Main navigation menu
├── Breadcrumbs.tsx      # Breadcrumb navigation
├── Container.tsx        # Page container (max-width, centering)
└── Section.tsx          # Section wrapper (spacing, padding)
```

---

## 🔧 Usage

### Header
```typescript
import { Header } from '@/components/layout/Header';

<Header 
  locale="vi"
  onThemeToggle={() => console.log('toggle')}
/>
```

### Footer
```typescript
import { Footer } from '@/components/layout/Footer';

<Footer 
  locale="vi"
  showSocialLinks={true}
/>
```

### Container
```typescript
import { Container } from '@/components/layout/Container';

<Container>
  <YourContent />
</Container>
```

---

## 🎨 Design Patterns

### Responsive Container
```typescript
// Container.tsx
export function Container({ children }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
```

### Section Wrapper
```typescript
// Section.tsx
export function Section({ children, className }) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>
      {children}
    </section>
  );
}
```

---

## 🌐 i18n in Layout Components

```typescript
// ❌ WRONG - useTranslations in async server component
export default async function Header() {
  const t = useTranslations();  // 💥 CRASH
}

// ✅ RIGHT - getTranslations in server component
export default async function Header() {
  const t = await getTranslations('Header');
  return <header>{t('title')}</header>;
}

// ✅ RIGHT - useTranslations in client component
'use client';
export function Header() {
  const t = useTranslations('Header');
  return <header>{t('title')}</header>;
}
```

---

## ⚠️ Gotchas

### 1. Client vs Server Components
```typescript
// ❌ WRONG - Interactive in server component
export default function Header() {
  const [open, setOpen] = useState(false);  // 💥 CRASH
}

// ✅ RIGHT - Interactive in client component
'use client';
export function Header() {
  const [open, setOpen] = useState(false);
}
```

### 2. Theme Toggle
```typescript
// Theme toggle requires client component
'use client';
import { useTheme } from '@/components/theme/ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme('light')}>Light</button>;
}
```

---

## 🔗 Related

- **Parent:** [`../`](../) - All components
- **App layouts:** [`../../app/[locale]/layout.tsx`](../../app/[locale]/layout.tsx) - Where layouts are used
- **Theme system:** [`../theme/`](../theme/) - Theme provider & toggle
- **i18n:** [`../../i18n/`](../../i18n/) - Translations

---

## 📚 Next Steps

- [ ] Add mobile menu component
- [ ] Add breadcrumb component
- [ ] Add progress indicator (scroll depth)

---

*Last updated: 2026-07-22*
