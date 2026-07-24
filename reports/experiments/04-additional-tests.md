# Plan: TEA Group Website — Visual Overhaul (Nav, About, Theme, Language, Animations, 3D)

## Context

The user wants a significant visual refresh of the TEA Group corporate website. The single-page site exists with Hero, Solutions, About, Stats, Projects, and Contact sections, but:

- The **nav links** are left-aligned, not centered, and **invisible on mobile** (no hamburger menu)
- The **About section** lacks compelling value propositions — only Vision/Mission + Team cards with no visual hooks
- **Animations are minimal** (only Hero has `fade-up`; framer-motion installed but unused)
- **Theme toggle** uses text labels (Auto/Light/Dark) instead of intuitive icons
- **Language switcher** uses text codes "vi"/"en" instead of flag icons
- The site doesn't yet feel like an **Industry 4.0 / automation tech** website — 3D components exist but aren't wired in, and no subtle tech pattern overlays exist
- The color scheme feels flat — needs more depth to match a modern 3D-automation brand

## Plan

### Step 1 — Locale translations for new About value props
**Files:** `apps/web/src/locales/en.json`, `apps/web/src/locales/vi.json`

Add 10 new keys under the `"About"` namespace:
- `valuePropsTitle` — "Key values" / "Giá trị nổi bật"
- `valuePropsLead` — "Why choose TEA Group?" / "Tại sao chọn TEA Group?"
- `value1Title` + `value1Desc` — Experienced engineers / Đội ngũ kỹ sư giàu kinh nghiệm
- `value2Title` + `value2Desc` — International standards / Chuẩn quốc tế
- `value3Title` + `value3Desc` — 24/7 support / Hỗ trợ 24/7
- `value4Title` + `value4Desc` — Customized solutions / Giải pháp tùy chỉnh

### Step 2 — Tailwind config: tech grid + subtle animations
**File:** `apps/web/tailwind.config.ts`

- Add `backgroundImage['tech-grid']` — CSS `repeating-linear-gradient` for a subtle grid overlay (brand-blue at 0.04 opacity)
- Add `backgroundSize['grid']` — `'60px 60px'`
- Add keyframes `pulse-soft` (opacity pulse) and `drift` (slow translateY) for subtle motion
- Add corresponding animation utilities

### Step 3 — ThemeBackground: subtle tech grid overlay
**File:** `apps/web/src/components/layout/ThemeBackground.tsx`

- Add a fixed overlay `div` with `bg-tech-grid bg-grid opacity-50 dark:opacity-30` behind content
- This gives the Industry 4.0 feel via pure CSS — zero JS, zero performance cost

### Step 4 — ThemeToggle: icon-only Sun/Moon cycling button
**File:** `apps/web/src/components/layout/ThemeToggle.tsx`

**Full rewrite:** Replace 3-button segmented control with a **single toggle button**:
- Icon = `Sun` (light override), `Moon` (dark override), or dynamic Sun/Moon based on `timePhase` (auto mode)
- Cycle: auto → light → dark → auto on click
- Size: `h-9 w-9 rounded-full` with glassmorphism border
- Skeleton: `h-9 w-9 rounded-full bg-black/5 animate-pulse`
- Remove `useTranslations('Theme')` dependency — no text labels needed
- Import `Sun`, `Moon` from `lucide-react`

### Step 5 — LanguageSwitcher: flag SVGs + layout
**File:** `apps/web/src/components/layout/LanguageSwitcher.tsx`

- Add inline SVG flag components: 2-button segmented control stays, but each button renders a flag SVG (14×11 viewBox) instead of locale text
- Vietnam flag: red field + yellow star (`#DA251D` / `#FFD200`)
- UK flag: Union Jack cross pattern (`#012169` / `#FFFFFF` / `#C8102E`)
- Each button: `h-8 w-8 rounded-full p-0.5 grid place-items-center`
- Active state: `data-[active=true]:bg-brand-blue` (icon background circle)
- `aria-label={t(l)}` for accessibility tooltips

### Step 6 — PublicHeader: centered nav + mobile hamburger menu
**File:** `apps/web/src/components/layout/PublicHeader.tsx`

- **Layout → 3-column grid**: `grid-cols-[auto_1fr_auto]` — logo left, nav center, controls right
- **Nav**: remove `ml-2`, add `justify-center`, keep `hidden lg:flex`
- **Mobile**: Add `useState<boolean>(false)` for `showMobile`
- **Hamburger button**: `<button className="lg:hidden ...">` cycling `Menu`/`X` from lucide-react
- **Mobile panel**: absolute/fixed dropdown with NAV items stacked vertically + LanguageSwitcher + ThemeToggle
- **Close**: on nav link click (and optionally click-outside with `useRef` + `useEffect`)
- Import additions: `Menu`, `X` from `lucide-react`; `useState` from `react`

### Step 7 — HomeClient: new client component for animations + About value props
**File:** `apps/web/src/components/home/HomeClient.tsx` (new)

**`'use client'`** component receiving all translations as props:
```ts
interface HomeClientProps {
  t: Record<string, string>;
  aboutT: (key: string) => string;
  contactT: (key: string) => string;
  footerT: (key: string) => string;
  locale: string;
}
```

Contains:
1. **Hero3D wired in**: `<Suspense><Hero3D /></Suspense>` inside `#home` section (Hero3D already handles dynamic import internally)
2. **3 floating brand-colored shapes** in the Hero background: Three soft geometric shapes (circle, rounded-square, soft blob) in brand colors (`#0099FF`, `#00A651`, `#FF3333`) that gently drift/float around using CSS keyframes. These are:
   - Pure CSS `div` elements with `border-radius` variations, absolutely positioned
   - Animated with `@keyframes` float + drift (different speeds/directions per shape)
   - `opacity-20` to stay subtle and not distract from content
   - `pointer-events-none` and behind content (`-z-1`)
   - Responsive — smaller on mobile, hidden if reduced-motion preferred
   - This gives the "friendly company feel" without requiring WebGL
3. **motion.section** wrappers: each page section wrapped for scroll-triggered entrance:
   - `initial={{ opacity: 0, y: 30 }}` / `whileInView={{ opacity: 1, y: 0 }}`
   - `viewport={{ once: true, margin: '-80px' }}`
   - `transition={{ duration: 0.5 }}`
3. **Staggered children**: Solutions cards, Stats cards, About value props use `motion.div` with `variants` for staggered entrance (`delay: i * 0.1`)
4. **About section**: Add 4 value proposition cards after Vision/Mission grid:
   - Title + lead from translations
   - Grid (`grid gap-6 sm:grid-cols-2 lg:grid-cols-4`)
   - Icons from lucide-react: `Award`, `FileCheck`, `Headphones`, `Settings2`
   - Same glassmorphism styling as other cards
5. **Remove** the old "Technical capabilities" subsection (5 items with Cog, CircuitBoard, Cpu, Wrench, HardDrive) — the new 4 value cards already cover this content more compellingly
6. **Keep existing**: Solutions section, Vision/Mission + Team cards, Stats, Projects, Contact sections all preserved with identical structure
6. **Hero CSS animation preserved**: The existing `animate-fade-up` on hero content remains

### Step 8 — page.tsx: thin server shell
**File:** `apps/web/src/app/[locale]/page.tsx`

- Convert from rendering all sections inline to fetching translations and passing as props to `<HomeClient>`
- Remove direct JSX sections (moved to HomeClient)
- Import and render: `<HomeClient t={t} aboutT={aboutT} contactT={contactT} footerT={footerT} locale={locale} />`
- Keep `setRequestLocale(locale)` for i18n static generation
- All data arrays (solutions, capabilities, stats) also become props or stay in the JSX passed as children

---

## File Change Summary

| # | File | Action |
|---|------|--------|
| 1 | `apps/web/src/locales/en.json` | Edit — add 10 About keys |
| 2 | `apps/web/src/locales/vi.json` | Edit — add 10 About keys |
| 3 | `apps/web/tailwind.config.ts` | Edit — add tech-grid, pulse-soft, drift |
| 4 | `apps/web/src/components/layout/ThemeBackground.tsx` | Edit — add tech grid overlay div |
| 5 | `apps/web/src/components/layout/ThemeToggle.tsx` | Edit — icon-only Sun/Moon toggle |
| 6 | `apps/web/src/components/layout/LanguageSwitcher.tsx` | Edit — flag SVGs replacing text |
| 7 | `apps/web/src/components/layout/PublicHeader.tsx` | Edit — centered nav, hamburger menu |
| 8 | `apps/web/src/components/home/HomeClient.tsx` | **Create** — client page with animations |
| 9 | `apps/web/src/app/[locale]/page.tsx` | Edit — thin server shell using HomeClient |

No new npm dependencies needed — framer-motion, lucide-react already installed.

---

## Verification

1. **Run dev server**: `pnpm dev` → http://localhost:3000 → redirected to /vi
2. **Check nav centering**: Nav items (Home, Giới thiệu, Giải pháp, Dự án, Liên hệ) appear centered between logo and right controls
3. **Check mobile responsiveness**: Resize to <1024px — hamburger menu appears, nav hidden; tap hamburger → menu slides down with all links + theme + lang toggles
4. **Check flag icons**: Language switcher shows VN flag / UK flag instead of "vi"/"en"
5. **Check theme toggle**: Single button with Sun/Moon icon; click cycles auto → light → dark; auto mode shows Sun during day/dawn, Moon during dusk/night
6. **Check About value props**: Scroll to #about — 4 new glass cards with icons, titles, and descriptions
7. **Check entrance animations**: Scroll down — sections fade in with subtle upward motion; cards stagger in
8. **Check 3D**: Hero section has animated 3D gears + robot arm background
9. **Check tech grid**: Subtle grid pattern visible behind content at normal zoom
10. **Typecheck**: `pnpm typecheck` passes
11. **Build**: `pnpm build` succeeds
