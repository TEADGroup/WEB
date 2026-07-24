# 🏠 Homepage Sections

**Purpose:** Homepage-specific section components

---

## 📋 Overview

Thư mục này chứa **sections components** used on the homepage:
- Hero section (with 3D scene)
- Solutions section (solution cards)
- About section
- Contact section
- Stats section

---

## 🎯 Available Sections

```
home/
└── sections/
    ├── HeroSection.tsx       # Hero with 3D scene
    ├── SolutionsSection.tsx  # Solution cards (3D models)
    ├── AboutSection.tsx       # About TEA Group
    ├── StatsSection.tsx      # Key statistics
    └── ContactSection.tsx    # Contact form (Phase 6)
```

---

## 🔧 Usage

### In Homepage
```typescript
// app/[locale]/(public)/page.tsx
import { HeroSection } from '@/components/home/sections/HeroSection';
import { SolutionsSection } from '@/components/home/sections/SolutionsSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SolutionsSection />
      {/* ... */}
    </>
  );
}
```

---

## 🎨 Section Patterns

### Standard Section Pattern
```typescript
export function SolutionsSection() {
  const t = await getTranslations('Solutions');
  
  return (
    <section className="py-20">
      <Container>
        <h2>{t('title')}</h2>
        <p>{t('subtitle')}</p>
        {/* Section content */}
      </Container>
    </section>
  );
}
```

### Section with 3D
```typescript
'use client'; // Required for 3D

const HeroScene = dynamic(() => import('./3d/HeroScene'), { 
  ssr: false 
});

export function HeroSection() {
  return (
    <section className="relative h-screen">
      <HeroScene />
      {/* Overlay content */}
    </section>
  );
}
```

---

## 🌐 i18n Pattern

```typescript
// In server component
export default async function AboutSection() {
  const t = await getTranslations('About');
  
  return (
    <section>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </section>
  );
}
```

---

## 🎯 Current Sections

### HeroSection
- **Content:** 3D hero scene with animated gears, robot arm
- **3D:** Uses HeroScene from components/3d/
- **Text:** Headline, CTA button
- **Status:** ✅ Complete (Phase 2)

### SolutionsSection
- **Content:** Solution cards with 3D models
- **3D:** BrainStem, CesiumMilkTruck, ChronographWatch
- **Text:** Solution titles, descriptions
- **Status:** ✅ Complete (Phase 2)

### AboutSection
- **Content:** About TEA Group
- **Text:** Company description, history
- **Status:** ⏳ TODO (Phase 3+)

### StatsSection
- **Content:** Key statistics
- **Text:** Numbers, labels
- **Status:** ⏳ TODO (Phase 3+)

### ContactSection
- **Content:** Contact form
- **Form:** Submit to /api/contact (Phase 6)
- **Status:** ⏳ TODO (Phase 6)

---

## ⚠️ Gotchas

### 1. Section Order
```typescript
// Current order (single-page scroll):
HeroSection → SolutionsSection → AboutSection → StatsSection → ContactSection
```

### 2. Client vs Server
```typescript
// Sections with 3D → Client components
// Sections without 3D → Server components (better performance)
```

### 3. Anchor Navigation
```typescript
// Hash anchor navigation (single-page):
/solutions#automation
/solutions#control
/solutions#integration
```

---

## 🔗 Related

- **Parent:** [`../`](../) - All components
- **3D components:** [`../3d/`](../3d/) - 3D scenes
- **Layout components:** [`../layout/`](../layout/) - Container, Section
- **Homepage:** [`../../app/[locale]/(public)/page.tsx`](../../app/[locale]/(public)/page.tsx) - Where sections are used

---

## 📚 Next Steps

- [ ] Complete AboutSection content
- [ ] Complete StatsSection  
- [ ] Implement ContactSection (Phase 6)
- [ ] Add smooth scroll behavior
- [ ] Add scroll progress indicator

---

*Last updated: 2026-07-22*
