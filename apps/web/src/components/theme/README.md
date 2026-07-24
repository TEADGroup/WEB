# 🌓 Theme System

**Purpose:** Dynamic time-of-day theme system - single source of truth cho theme logic

---

## 📋 Overview

Thư mục này chứa **theme system** của application:
- `ThemeProvider.tsx` - Theme Context provider (ONLY provider)
- `ThemeBackground.tsx` - Animated gradient background
- `NoFlashScript.tsx` - No-flash inline script

---

## ⚠️ CRITICAL WARNING

**There is ONLY ONE theme provider in this app:**

```typescript
// ✅ RIGHT - Single provider
<ThemeProvider>
  <App />
</ThemeProvider>

// ❌ WRONG - Never create additional providers
// Don't do this anywhere else!
```

**File location:** [`ThemeProvider.tsx`](ThemeProvider.tsx)

---

## 🎨 Theme Phases

Theme có **4 phases** (not just light/dark):

| Phase | Time (HCM) | Colors | Transition |
|-------|------------|-------|------------|
| **Dawn** | 05:00-07:00 | Cool blues → warm oranges | Smooth gradient |
| **Day** | 07:00-17:00 | Bright blue sky | Light mode |
| **Dusk** | 17:00-19:00 | Warm oranges → cool purples | Smooth gradient |
| **Night** | 19:00-05:00 | Deep blue/purple | Dark mode |

---

## 🔧 Theme Logic

### Timezone
- **Source:** `Asia/Ho_Chi_Minh` timezone
- **Why:** TEA Group is in Vietnam
- **File:** [`../../../lib/theme.ts`](../../../lib/theme.ts)

### Manual Override
```typescript
// User can override in localStorage:
localStorage['tea-theme'] = 'auto';  // Default (follow time)
localStorage['tea-theme'] = 'light'; // Force light
localStorage['tea-theme'] = 'dark';  // Force dark
```

---

## 🎨 Brand Colors

```css
/* Saturated - for small accents ONLY */
--brand-blue: #0099FF;
--brand-green: #00A651;
--brand-red: #FF3333;

/* Desaturated tints - for backgrounds */
--bg-tint-blue: #E6F3FF;
--bg-tint-green: #E6FFE9;

/* Dark mode base */
--dark-base: #0A1626; /* Not pure black */
```

**Usage rule:**
- ✅ Use saturated colors for: Logo, CTAs, stat numbers
- ❌ NOT for: Backgrounds, large areas

---

## 🔧 Usage

### Getting theme value
```typescript
// ❌ WRONG - Don't use useTheme in multiple places
const theme = useTheme();

// ✅ RIGHT - Consume from Context
import { useTheme } from '@/components/theme/ThemeProvider';
// BUT: Only in few places, don't overuse
```

### Theme-aware CSS
```css
/* Use CSS variables set by ThemeProvider */
.background {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.brand-accent {
  color: var(--brand-blue);
}
```

---

## 📂 Files in this Directory

| File | Purpose | Notes |
|------|---------|-------|
| [`ThemeProvider.tsx`](ThemeProvider.tsx) | Theme Context provider | ⚠️ ONLY provider in app |
| [`ThemeBackground.tsx`](ThemeBackground.tsx) | Animated gradient background | CSS transition with @property |
| [`NoFlashScript.tsx`](NoFlashScript.tsx) | Inline script to prevent flash | Sets vars before hydration |

---

## ⚠️ Gotchas

### 1. Single Provider Pattern
```typescript
// ❌ WRONG - Creating provider in layout
export default function Layout() {
  return (
    <ThemeProvider>  {/* 💥 WRONG */}
      {children}
    </ThemeProvider>
  );
}

// ✅ RIGHT - Provider already in root layout
// Don't create additional providers!
```

### 2. CSS Variable Transition
```css
/* In globals.css */
@property {
  syntax: '<color>';
  inherits: true;
  initial-value: #000;
}

/* This enables smooth color transitions */
```

### 3. No-Flash on Load
```typescript
// NoFlashScript sets CSS variables BEFORE hydration
// Prevents flash of wrong color on page load
```

---

## 🔗 Related

- **Parent:** [`../`](../) - All components
- **Theme utilities:** [`../../../lib/theme.ts`](../../../lib/theme.ts) - Theme logic
- **Global styles:** [`../../../styles/globals.css`](../../../styles/globals.css) - CSS variables
- **Root layout:** [`../../app/[locale]/layout.tsx`](../../app/[locale]/layout.tsx) - Where provider is used

---

## 📚 Theme System Flow

```
1. Page loads
   ↓
2. NoFlashScript runs (inline)
   → Sets CSS variables based on localStorage or time
   ↓
3. React hydrates
   ↓
4. ThemeProvider initializes
   → Reads localStorage
   → Calculates theme phase from time
   → Sets CSS variables on <html>
   ↓
5. ThemeBackground animates
   → Smooth gradient transition between phases
```

---

*Last updated: 2026-07-22*

**⚠️ Remember: NEVER create additional theme providers!**
