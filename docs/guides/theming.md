# 🎨 Theme System Guide

**Last updated:** 2026-07-22

---

## 📋 Overview

TEA Group website uses a **dynamic time-of-day theme system** với 4 phases (not just light/dark):
- **Dawn** - Cool blues → warm oranges
- **Day** - Bright blue sky (light mode)
- **Dusk** - Warm oranges → cool purples
- **Night** - Deep blue/purple (dark mode)

---

## 🎯 Theme Phases

| Phase | Time (HCM) | Colors | Description |
|-------|------------|-------|-------------|
| **Dawn** | 05:00-07:00 | Cool → Warm transition | Sunrise transition |
| **Day** | 07:00-17:00 | Bright, light mode | Working hours |
| **Dusk** | 17:00-19:00 | Warm → Cool transition | Sunset transition |
| **Night** | 19:00-05:00 | Dark, purple/blue | Night mode |

---

## 🔧 Theme Logic

### Timezone
- **Source:** `Asia/Ho_Chi_Minh` (Vietnam time)
- **Why:** TEA Group is located in Ho Chi Minh City
- **File:** [`apps/web/src/lib/theme.ts`](../../apps/web/src/lib/theme.ts)

### Calculation
```typescript
function getThemePhase(time?: Date): ThemePhase {
  const hour = time?.getHours() || new Date().getHours();
  
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}
```

---

## 🎮 Manual Override

Users can manually override theme:

```typescript
// In browser console:
localStorage['tea-theme'] = 'auto';   // Follow time (default)
localStorage['tea-theme'] = 'light';  // Force light mode
localStorage['tea-theme'] = 'dark';   // Force dark mode
```

---

## 🎨 CSS Variables

Theme uses CSS variables set by [`ThemeProvider`](../../apps/web/src/components/theme/ThemeProvider.tsx):

```css
:root {
  /* Brand colors (saturated - small accents ONLY) */
  --brand-blue: #0099FF;
  --brand-green: #00A651;
  --brand-red: #FF3333;

  /* Backgrounds (desaturated tints) */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-tint-blue: #E6F3FF;
  --bg-tint-green: #E6FFE9;

  /* Text colors */
  --text-primary: #1A1A1A;
  --text-secondary: #666666;

  /* Dark mode */
  --dark-base: #0A1626;  /* Not pure black */
}
```

---

## ⚡ Smooth Transitions

Theme uses CSS `@property` cho smooth color transitions:

```css
@property --bg-primary {
  syntax: '<color>';
  inherits: true;
  initial-value: #FFFFFF;
}

/* This enables smooth transitions */
```

**Result:** Colors transition smoothly between phases (not abrupt changes).

---

## 🚫 Critical Rules

### 1. Single Provider Pattern
```typescript
// ✅ RIGHT - Single provider in root layout
<ThemeProvider>
  <App />
</ThemeProvider>

// ❌ WRONG - Never create additional providers
// Don't do this anywhere else!
```

### 2. Brand Color Usage
```css
/* ✅ RIGHT - Saturated colors for small accents */
.logo { color: var(--brand-blue); }
.cta-button { background: var(--brand-green); }

/* ❌ WRONG - Not for large areas */
.hero-section { background: var(--brand-blue); } /* Too much! */
```

### 3. Theme Hook Usage
```typescript
// ⚠️ WARNING - Don't overuse theme hook
const theme = useTheme(); // Only in few places

// ✅ BETTER - Use CSS variables
div.style.backgroundColor = 'var(--bg-primary)';
```

---

## 🔧 Usage in Components

### Reading Theme Value
```typescript
'use client';
import { useTheme } from '@/components/theme/ThemeProvider';

export function Component() {
  const { theme, phase } = useTheme();
  return <div>Current: {phase}</div>;
}
```

### Theme-Aware Styles
```css
.component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--brand-blue);
}
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| [`apps/web/src/lib/theme.ts`](../../apps/web/src/lib/theme.ts) | Theme logic utilities |
| [`apps/web/src/components/theme/ThemeProvider.tsx`](../../apps/web/src/components/theme/ThemeProvider.tsx) | Theme provider (ONLY one) |
| [`apps/web/src/components/theme/ThemeBackground.tsx`](../../apps/web/src/components/theme/ThemeBackground.tsx) | Animated gradient background |
| [`apps/web/src/components/theme/NoFlashScript.tsx`](../../apps/web/src/components/theme/NoFlashScript.tsx) | Prevents flash on load |

---

## 🔗 Related

- **Parent:** [`../`](../) - Docs
- **Components:** [`../../apps/web/src/components/theme/README.md`](../../apps/web/src/components/theme/README.md) - Theme components
- **Global styles:** [`../../apps/web/src/styles/globals.css`](../../apps/web/src/styles/globals.css) - CSS variables

---

## 📚 Resources

- **CSS @property:** https://developer.mozilla.org/en-US/docs/Web/CSS/@property
- **Vietnam timezone:** `Asia/Ho_Chi_Minh` (UTC+7)

---

*Last updated: 2026-07-22*
