# Redesign Plan: TEA Group — Industrial Automation, Sang Trọng & Đồng Bộ

## Context

Trang web hiện tại có nền móng tốt (Next.js 15, next-intl, framer-motion, GSAP, glassmorphism layout) nhưng đang ở trạng thái "bán phần". Nhiều tính năng flagship như 3D Hero, 3D solution cards, theme time-of-day là **dead code** — đã được thiết kế nhưng bị tháo dỡ. Kết quả audit từ 5 agent (Design System, Public Site, 3D/Perf, Admin/Auth, Cross-cutting) cho thấy 82 findings, trong đó cốt lõi là:

- **Form liên hệ 100% hỏng** — mất lead kinh doanh
- **Dead code ~11 MB** (3 GLB + 8 R3F components + 200+ `dark:` classes)
- **Không design tokens** — màu sắc hardcode 20+ chỗ, type scale không tồn tại
- **SEO bằng 0** — không OG/hreflang/sitemap/JSON-LD

Mục tiêu redesign: biến site thành trang web tự động hóa công nghiệp với giao diện **sang trọng, đồng bộ**, animation chỉn chu, phù hợp B2B.

## Quyết định chiến lược

1. **3D** → XÓA SẠCH. Không restore. Giữ GIF tĩnh cho solution cards.
2. **Theme time-of-day** → XÓA SẠCH. Một theme light cố định duy nhất.
3. **GSAP** → Chuyển sang framer-motion (GSAP chỉ dùng 1 file, framer-motion đã có sẵn & dùng 8 file).
4. **Scope** → P0+P1+P2 — redesign toàn diện cả public + admin.

---

## PHASE 0 — Dọn dẹp dead code (làm trước, không ảnh hưởng UI)

**Mục tiêu:** Xóa ~1500 dòng code chết + 10.7 MB assets. Sạch bundle, dễ maintain.

### Bước 0.0: Xóa 3D components
- Xóa directory `apps/web/src/components/3d/` — 8 files: `Hero3D.tsx`, `Scene.tsx`, `Gears.tsx`, `RobotArm.tsx`, `Controller.tsx`, `ModelViewer.tsx`, `CardAnimation.tsx`, `CircuitParticles.tsx`
- Xóa `apps/web/public/models3d/` — 3 GLB: BrainStem (3.1MB), CesiumMilkTruck (370KB), ChronographWatch (7.4MB)

### Bước 0.1: Xóa theme time-of-day
- `apps/web/src/components/theme/ThemeProvider.tsx` — Replace entire content: simplify to a provider that does nothing (or just renders children). Remove `applyTheme('day', ...)` call. Remove `useTimeOfDay` stub.
- `apps/web/src/components/layout/ThemeToggle.tsx` — Delete file (không còn import nào trỏ tới sau bước 0.3)
- `apps/web/src/components/layout/NoFlashScript.tsx` — Delete file (vì không còn dynamic theme cần no-flash)
- `apps/web/src/components/layout/ThemeBackground.tsx` — Simplify: remove empty `<div>`, keep only the `bg-tech-grid` div
- `apps/web/src/lib/theme.ts` — Delete file (`computePhase`, `resolvePhase`, `applyTheme` không còn dùng)
- `packages/shared/src/constants.ts` — Remove `DEFAULT_THEME_CONFIG`, `THEME_STORAGE_KEY`. Keep only `LOCALES`, `DEFAULT_LOCALE`, `SETTINGS_KEYS`, `DEFAULT_CONTACT_EMAIL`.
- `packages/shared/src/schemas/settings.ts` — Remove `ThemePhase`, `ThemePhaseConfig`, `ThemeConfig` schemas nếu không dùng ở nơi khác.

### Bước 0.2: Xóa CSS theme infrastructure
- `apps/web/src/styles/globals.css`:
  - Xóa 4 `@property` declarations (`--tea-bg-from`, `--tea-bg-via`, `--tea-bg-to`, `--tea-accent`)
  - Xóa `:root` block (4 biến CSS trên)
  - Xóa `transition` block ở body (chuyển từ gradient động sang fixed gradient phù hợp industrial theme)
  - Xóa `color-scheme: light`
  - Cập nhật `body` background thành gradient cố định: `linear-gradient(135deg, #E3F1FB, #E9F6EF, #F6F8FB)` (màu day-phase desaturated — giữ lại vì đẹp)
  - Cập nhật `body` text color: `#1E293B` (slate-800 — tối hơn `#0F172A` một chút nhưng ấm hơn)

### Bước 0.3: Xóa `dark:` classes khỏi 26 files
Đây là bước cơ học, lặp lại pattern: xóa mọi `dark:` variant trong Tailwind classes.
- Pattern: `dark:bg-white/5` → xóa, `dark:text-slate-300` → xóa, `dark:shadow-card-dark` → xóa
- Các file affected (đại diện — xóa `dark:` trong từng file):
  - `components/home/sections/HeroSection.tsx`
  - `components/home/sections/ContactSection.tsx`
  - `components/home/sections/StatsSection.tsx`
  - `components/home/sections/AboutSection.tsx`
  - `components/home/sections/SolutionsSection.tsx`
  - `components/home/data.tsx`
  - `components/layout/ContactForm.tsx`
  - `components/layout/LanguageSwitcher.tsx`
  - `components/layout/PageHeader.tsx`
  - `components/layout/PublicFooter.tsx`
  - `components/layout/ThemeBackground.tsx`
  - `components/admin/AdminSidebar.tsx`
  - `components/tree/ProjectsTree.tsx`, `ProjectDetailPanel.tsx`
  - `components/tree/nodes/ProjectNode.tsx`, `SectionNode.tsx`, `CategoryNode.tsx`
  - `app/[locale]/admin/*.tsx` (6 files)
  - `app/[locale]/(auth)/login/page.tsx`

### Bước 0.4: Cleanup Tailwind config
- `tailwind.config.ts`:
  - Xóa `darkMode: 'class'`
  - Xóa `shadow-card-dark`, `shadow-card-hover-dark`
  - Giữ: `brand` colors, `boxShadow` (card, card-hover), `backgroundImage` (tech-grid), `backgroundSize`, `keyframes`, `animation`

### Bước 0.5: Xóa lệ thuộc GSAP + R3F
- `apps/web/package.json`:
  - Xóa: `gsap`, `@gsap/react`, `@react-three/fiber`, `@react-three/drei`, `three`, `@types/three`
- Kiểm tra `pnpm-lock.yaml` sẽ tự dọn sau `pnpm install`

### Bước 0.6: Gộp component trùng lặp
- `StemDot`, `BranchLine`, `Card3D` hiện duplicate giữa `HomeClient.tsx:140-226` và `SolutionsSection.tsx:16-104`
- Extract vào file mới: `components/home/solution-tree.tsx`

---

## PHASE 1 — Design Token System (nền tảng "sang trọng")

### Bước 1.0: CSS Custom Properties cho brand colors
Thêm vào `globals.css` (sau `@tailwind utilities`):

```css
:root {
  --brand-blue: #0099FF;
  --brand-cyan: #33B5FF;
  --brand-green: #00A651;
  --brand-red: #FF3333;
  --brand-navy: #0A1626;

  --surface-base: #FFFFFF;
  --surface-card: rgba(255, 255, 255, 0.30);
  --surface-glass: rgba(255, 255, 255, 0.55);

  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;

  --radius-card: 1rem;
  --radius-button: 0.5rem;
  --radius-input: 0.5rem;

  --shadow-card: 0 4px 24px rgba(0,153,255,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-card-hover: 0 12px 48px rgba(0,153,255,0.14), 0 4px 12px rgba(0,0,0,0.06);

  --backdrop-blur-card: 12px;
  --backdrop-blur-nav: 8px;
}
```

### Bước 1.1: Cập nhật Tailwind config
```ts
// tailwind.config.ts — thêm vào theme.extend
colors: {
  brand: {
    blue: 'var(--brand-blue)',
    cyan: 'var(--brand-cyan)',
    green: 'var(--brand-green)',
    red: 'var(--brand-red)',
    navy: 'var(--brand-navy)',
  },
  surface: {
    base: 'var(--surface-base)',
    card: 'var(--surface-card)',
    glass: 'var(--surface-glass)',
  },
},
fontSize: {
  'display-1': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
  'display-2': ['3.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
  'display-3': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
  'heading-1': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
  'heading-2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
  'heading-3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
  'body-lg': ['1.125rem', { lineHeight: '1.625' }],
  'body': ['1rem', { lineHeight: '1.625' }],
  'body-sm': ['0.875rem', { lineHeight: '1.5' }],
  'eyebrow': ['0.75rem', { lineHeight: '1', letterSpacing: '0.2em', fontWeight: '700' }],
  'label': ['0.75rem', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '600' }],
},
borderRadius: {
  card: 'var(--radius-card)',
  button: 'var(--radius-button)',
  input: 'var(--radius-input)',
},
backdropBlur: {
  card: 'var(--backdrop-blur-card)',
  nav: 'var(--backdrop-blur-nav)',
},
```

Đồng thời **xóa** các shadow/boxShadow cũ và giữ:
```ts
boxShadow: {
  card: 'var(--shadow-card)',
  'card-hover': 'var(--shadow-card-hover)',
},
```

### Bước 1.2: Chuẩn hóa glassmorphism
- Giờ dùng: `bg-surface-card backdrop-blur-card rounded-card shadow-card`
- Thống nhất backdrop-blur: card=12px, nav=8px

### Bước 1.3: Extract `<Button>` component
Tạo `components/ui/Button.tsx`:
```tsx
// variants: primary (gradient brand-cyan→brand-blue), secondary (glass), ghost
// sizes: sm, md, lg
// states: loading (spinner), disabled
// Sử dụng new token classes
```

---

## PHASE 2 — Visual Component Redesign

### Bước 2.0: Hero Section
File: `components/home/sections/HeroSection.tsx`

**Cũ:**
- FloatingShape blur-balls (CSS animated, framer-motion)
- Logo img, eyebrow, h1, subtitle, 2 CTA buttons
- `100dvh` min-height

**Mới (giữ cấu trúc, chỉnh visual):**
- **Background**: Giữ FloatingShape nhưng dùng màu trầm hơn (`opacity-[0.12]` thay vì `opacity-[0.22]`) và blur mạnh hơn. Chỉ 2 shapes: blue + green.
- **Typography**:
  - Eyebrow: `font-eyebrow text-eyebrow uppercase tracking-[0.2em] text-brand-blue` (giống, đúng với type scale mới)
  - Title: `font-display text-display-2 lg:text-display-1 font-bold text-slate-800` (dùng token `display-1/2`)
  - Subtitle: `text-body-lg text-secondary max-w-2xl`
- **CTA buttons**: Dùng `<Button variant="primary" size="lg" />` và `<Button variant="secondary" size="lg" />`
- **Logo**: Đổi từ `<img>` sang `<Image>` (next/image) — fix CLS

### Bước 2.1: Solutions Section (chuyển GSAP → framer-motion)
File: `components/home/sections/SolutionsSection.tsx`

**Chuyển toàn bộ GSAP ScrollTrigger animations sang framer-motion:**

- **Vertical stem**: `motion.div` với `initial={{ scaleY: 0 }}` + `whileInView={{ scaleY: 1 }}`
- **Cards**: Giữ nguyên cấu trúc tree, chuyển `SolutionTreeCard` từ GSAP `fromTo` sang framer-motion:
  - Card container: `motion.div` với `initial={{ opacity: 0, y: 60, rotateX: 10 }}` + `whileInView`
  - Curtain: xóa (curtain reveal là GSAP-specific, chuyển thành fade simpler)
  - Icon: `initial={{ opacity: 0, scale: 0.5, rotate: -15 }}` + `whileInView`
  - Title/Sub-items: `staggerChildren` trong framer-motion
- **3D hover tilt**: Chuyển từ GSAP mousemove → CSS `perspective` + `transform` thuần (nhẹ hơn):
  ```css
  .card-3d-inner {
    transition: transform 0.4s ease;
  }
  .card-3d:hover .card-3d-inner {
    transform: rotateX(3deg) rotateY(-3deg);
  }
  ```
- **Xóa lệ thuộc**: Sau bước này, GSAP có thể gỡ hoàn toàn khỏi project

### Bước 2.2: About Section
File: `components/home/sections/AboutSection.tsx`

- **Typography**: Dùng `text-heading-1` cho tiêu đề section, `text-body-lg` cho body
- **Cards**: Dùng glassmorphism tokens mới (`bg-surface-card backdrop-blur-card rounded-card shadow-card`)
- **Giá trị**: Giữ cấu trúc 4 giá trị, chỉnh hover thành `card-hover` shadow
- **Images**: Đổi raw `<img>` sang `<Image>` (fix CLS)

### Bước 2.3: Stats Section
File: `components/home/sections/StatsSection.tsx`

- **Animated counters**: Dùng framer-motion `useInView` + `animate` để đếm số (0 → 120+, 0 → 15+, v.v.)
  - Tạo hook `useCountUp({ end, duration })` hoặc dùng `motion.span` với `initial={{ opacity: 0 }}` + `animate`
- **Typography**: Stat value: `font-display text-display-3 text-brand-blue`, label: `text-label text-muted`
- **Cards**: Glassmorphism token

### Bước 2.4: Projects Section
File: `components/home/HomeClient.tsx` (projects section trong orchestrator)

- **Thêm PageHeader** (`#projects` section hiện không có heading)
- Dùng translation keys đã tồn tại: `projectsEyebrow`, `projectsTitle`, `projectsSubtitle`
- Giữ ProjectsTree (đã hoạt động tốt)

### Bước 2.5: Contact Section
File: `components/home/sections/ContactSection.tsx`, `components/layout/ContactForm.tsx`

- **FIX CRITICAL**: Tạo `apps/web/src/app/api/contact/route.ts` với handler POST:
  - Validate fields (name, email, subject, message, phone)
  - Lưu vào Supabase table `contact_submissions`
  - Gửi email qua Resend (nếu có key) hoặc chỉ lưu DB
  - Trả về success/error response
- **Form UI**: Dùng `<Input>` component mới với token classes (`rounded-input border-slate-200 focus:border-brand-blue focus:ring-brand-blue/30`)
- **Validation**: Client-side với native Constraint Validation API (hoặc react-hook-form + zod nếu triển khai admin trước)

### Bước 2.6: Header & Navigation
File: `components/layout/PublicHeader.tsx`

- **ScrollSpy**: Thêm IntersectionObserver hook mới:
  ```
  hooks/useActiveSection.ts
  ```
  - Watch `#home`, `#about`, `#solutions`, `#projects`, `#contact`
  - Apply class `text-brand-blue font-semibold` + `aria-current="true"` vào nav link active
- **Mobile nav animation**: Dùng framer-motion `AnimatePresence` cho slide-down:
  ```tsx
  <AnimatePresence>
    {showMobile && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
      />
    )}
  </AnimatePresence>
  ```
- **Xóa borders**: `border-b border-black/5` → chuyển sang `shadow-sm` cho sticky header

### Bước 2.7: Footer
File: `components/layout/PublicFooter.tsx`

- **Xóa border**: `border-t border-black/5` → `shadow-sm` inverted hoặc không shadow
- Typography: `text-body-sm text-secondary`

### Bước 2.8: ScrollSpy Hook
Tạo `hooks/useActiveSection.ts`:
```tsx
'use client';
import { useEffect, useState } from 'react';

export function useActiveSection(sectionIds: string[]) {
  const [active, setActive] = useState(sectionIds[0] ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return active;
}
```

---

## PHASE 3 — Motion Design System

### Bước 3.0: Motion Tokens
Tạo `components/home/animation-variants.ts` (sửa file hiện tại):
```ts
// easing
export const easings = {
  out: [0.22, 1, 0.36, 1],       // power4.out — tiêu chuẩn
  inOut: [0.87, 0, 0.13, 1],     // ease-in-out tự nhiên
  spring: { type: 'spring', stiffness: 100, damping: 20 },
};

// durations
export const durations = {
  fast: 0.25,
  normal: 0.45,
  slow: 0.65,
  reveal: 1.0,
};

// section variants (giữ nguyên với easing mới)
export const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: durations.normal, ease: easings.out },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: durations.normal, ease: easings.out },
  },
};

// prefers-reduced-motion
export const useReducedMotion = () => {
  // Trả về true/false dựa trên matchMedia
};
```

### Bước 3.1: prefers-reduced-motion
- framer-motion tự động respect `prefers-reduced-motion` khi dùng `useReducedMotion()` hook
- Thêm vào globals.css: fallback CSS (đã có, giữ nguyên)
- Trong components, kiểm tra `reducedMotion` và disable animation nếu true

---

## PHASE 4 — SEO & i18n Fixes

### Bước 4.0: generateMetadata với locale
File: `apps/web/src/app/[locale]/layout.tsx`

- Đổi từ static `export const metadata` sang async `generateMetadata`
- Đọc locale từ params, trả về OG/Twitter/hreflang tương ứng

```ts
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://teagroup.vn';

  return {
    title: { default: 'TEA Co., Ltd', template: '%s · TEA Co., Ltd' },
    description: locale === 'vi'
      ? 'TEA Co., Ltd — tự động hoá công nghiệp & điện tự động. Giải pháp kỹ thuật tích hợp cho nhà máy và công trình.'
      : 'TEA Co., Ltd — industrial automation & electrical control. Integrated engineering solutions for factories and facilities.',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        vi: '/vi',
        en: '/en',
      },
    },
    openGraph: {
      title: 'TEA Co., Ltd',
      description: locale === 'vi'
        ? 'Tự động hoá công nghiệp & điện tự động'
        : 'Industrial Automation & Electrical Control',
      url: `/${locale}`,
      siteName: 'TEA Co., Ltd',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      type: 'website',
      images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'TEA Co., Ltd',
      description: 'Industrial Automation & Electrical Control',
    },
    icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  };
}
```

### Bước 4.1: sitemap.ts + robots.ts
- `apps/web/src/app/sitemap.ts` — locale-aware entries cho /vi, /en
- `apps/web/src/app/robots.ts` — cho phép crawl public pages

### Bước 4.2: JSON-LD Structured Data
Thêm component `components/layout/JsonLd.tsx` hoặc inline trong layout:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Corporation',
      name: 'TEA Co., Ltd',
      url: process.env.NEXT_PUBLIC_SITE_URL,
      logo: `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`,
      address: { '@type': 'PostalAddress', addressLocality: 'Ho Chi Minh City', addressCountry: 'VN' },
    }),
  }}
/>
```

### Bước 4.3: Sửa `<img>` thành `next/image`
- `HeroSection.tsx:35` — logo hero
- `AboutSection.tsx:101` — GIFs about values
- `SolutionsSection.tsx:61` — solution card GIFs
- Dùng `next/image` với `width`/`height` tương ứng và `sizes` prop

### Bước 4.4: Sửa hardcoded i18n strings
- `error.tsx:41-63` — hardcoded VI → dùng `useTranslations()`
- `ProjectDetailPanel.tsx:38,50` — `Client:`, `No additional details.` → dùng translation keys
- `ProjectsTree.tsx:99` — `"Search projects..."` → dùng translation key

### Bước 4.5: PageHeader `<h1>` fix
- `PageHeader.tsx` — nhận prop `level?: 'h1' | 'h2'` (default `'h2'`)
- HeroSection dùng `<PageHeader level="h1" />` hoặc không dùng PageHeader
- Tất cả section khác dùng `<h2>` (default)

---

## PHASE 5 — Admin Polish

### Bước 5.0: Toast system
- Thêm thư viện `sonner` (1.6KB, đơn giản)
- Wrap trong admin layout: `<Toaster />`
- Convert các inline `setMessage` pattern trong settings, projects-manager → `toast.success()` / `toast.error()`

### Bước 5.1: Form validation
- Thêm `react-hook-form` + `zod` + `@hookform/resolvers`
- Dùng cho: login, settings, project edit, hdvh-upload

### Bước 5.2: RBAC admin layout check
- `apps/web/src/app/[locale]/admin/layout.tsx` — thêm server-side role check
- Nếu user role không phải `admin`/`editor`, redirect về login

### Bước 5.3: Topbar + Breadcrumbs
- Thêm `AdminTopbar` component: user avatar, breadcrumbs từ pathname
- `layout.tsx`: render topbar + sidebar

### Bước 5.4: DataTable sort/pagination
- Tạo `<DataTable>` component với sortable headers, pagination controls
- Áp dụng cho users-manager, projects-manager

### Bước 5.5: HDVH parser progress thật
- API: chuyển từ `POST` trả về kết quả batch sang SSE (`text/event-stream`)
- Frontend: EventSource lắng nghe progress event, cập nhật real steps

---

## PHASE 6 — Cross-cutting Cleanup

### Bước 6.0: not-found.tsx + loading/error admin
- `app/[locale]/not-found.tsx` — branded 404 với gradient + link về home
- `app/[locale]/admin/loading.tsx` — skeleton
- `app/[locale]/admin/error.tsx` — error boundary (dùng i18n)

### Bước 6.1: Xóa console.log production
- `ollama.ts:29,44,60,69,87,98` → wrap với `if (process.env.NODE_ENV === 'development')`
- `ai-chat/route.ts:103,136,142,161,164` → same
- `hdvh-parser/route.ts:165,192,237,241` → same

### Bước 6.2: Favicon set
- Tạo: `favicon.ico` (32x32), `apple-touch-icon.png` (180x180), `icon-192.png`, `icon-512.png`
- Cập nhật layout metadata `icons` field

### Bước 6.3: WCAG contrast
- Brand-blue `#0099FF` trên nền trắng = 3.1:1 (fail AA cho normal text)
- **Fix**: Dùng `#0073E6` cho text (4.5:1+) hoặc giữ `#0099FF` chỉ cho decorative/graphics
- Báo cáo: colors đẹp → `#0073E6` vẫn đẹp và pass contrast

### Bước 6.4: Đóng góp vào CLAUDE.md
- Cập nhật để phản ánh trạng thái mới: không 3D, không time-of-day, theme light cố định, dùng framer-motion, GSAP đã gỡ

---

## Thứ tự thực thi (dependency graph)

```
Phase 0 (dọn dẹp)
  ├── 0.0 Xóa 3D — không phụ thuộc gì
  ├── 0.1 Xóa theme — không phụ thuộc gì  
  ├── 0.2 Xóa CSS theme — phụ thuộc 0.1
  ├── 0.3 Xóa dark: — độc lập
  ├── 0.4 Cleanup tailwind — phụ thuộc 0.0, 0.1
  ├── 0.5 Xóa dependencies — phụ thuộc 0.0, 0.1
  └── 0.6 Gộp components — độc lập

Phase 1 (tokens)
  ├── 1.0 CSS vars — độc lập
  ├── 1.1 Tailwind config — phụ thuộc 1.0
  ├── 1.2 Chuẩn hóa glassmorphism — phụ thuộc 1.1
  └── 1.3 Button component — phụ thuộc 1.1

Phase 2 (visual redesign)
  ├── 2.0 Hero — phụ thuộc 1.1 (dùng token classes)
  ├── 2.1 Solutions (GSAP→framer) — phụ thuộc 1.1, 0.6
  ├── 2.2 About — phụ thuộc 1.1
  ├── 2.3 Stats — phụ thuộc 1.1
  ├── 2.4 Projects — độc lập
  ├── 2.5 Contact + API route — độc lập (fix P0 ngay)
  ├── 2.6 Header + ScrollSpy — phụ thuộc 1.1
  ├── 2.7 Footer — phụ thuộc 1.1
  └── 2.8 ScrollSpy hook — độc lập

Phase 3 (motion system) — phụ thuộc 2.1 (GSAP→framer conversion)

Phase 4 (SEO & i18n)
  ├── 4.0 generateMetadata — độc lập
  ├── 4.1 sitemap + robots — độc lập
  ├── 4.2 JSON-LD — độc lập
  ├── 4.3 next/image — độc lập (ưu tiên cao, fix CLS)
  ├── 4.4 i18n strings — độc lập
  └── 4.5 PageHeader h1 fix — phụ thuộc 1.1

Phase 5 (admin) — phần lớn độc lập với public site
Phase 6 (cleanup) — nên làm cuối
```

## Priority order cho implementation:

1. **NGAY (critical business)**: 2.5 (contact API route) + 4.3 (next/image cho logo)
2. **PHASE 0** trọn vẹn (dọn code chết giảm bundle)
3. **PHASE 1** trọn vẹn (token system)
4. **PHASE 2** (visual redesign các section, bắt đầu từ Hero)
5. **PHASE 3** (motion system)
6. **PHASE 4** (SEO)
7. **PHASE 5 + 6** (admin + cleanup)

## Verification

1. `pnpm dev` — trang chạy không lỗi, không 404
2. Contact form gửi thành công → check Supabase `contact_submissions` table
3. Không còn dark mode artifacts: test toggle F12 → không còn `dark:` classes
4. Lighthouse: improved CLS, SEO, accessibility
5. Tab network: không còn 3D chunks/GLB, bundle size giảm
6. `pnpm typecheck` — không lỗi TypeScript
7. Viewport testing: 360px, 768px, 1440px — không overflow, không layout shift
