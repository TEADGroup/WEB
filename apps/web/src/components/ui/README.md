# 🎨 UI Components (shadcn/ui)

**Purpose:** Base UI components từ shadcn/ui - buttons, inputs, cards, dialogs, etc.

---

## 📋 Overview

Thư mục này chứa **shadcn/ui base components** - được copy và modified từ shadcn/ui project.

**shadcn/ui** is NOT a component library - it's a collection of re-usable components that you copy & paste into your project.

---

## 🎯 Available Components

```
ui/
├── button.tsx          # Button component
├── card.tsx            # Card container
├── input.tsx           # Text input
├── dialog.tsx          # Dialog/Modal
├── dropdown-menu.tsx   # Dropdown menu
├── ... (more components)
```

---

## 🔧 Usage

### Example: Button
```typescript
import { Button } from '@/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
```

### Example: Card
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

---

## 🎨 Customization

Mỗi component có thể được modified để fit project needs:
- ✅ **Thay đổi colors** để match brand colors
- ✅ **Thay đổi sizes** để fit design system
- ✅ **Thêm variants** mới nếu cần

**NOT:** Thay đổi API surface (keep props consistent)

---

## 🔗 Adding New Components

### From shadcn/ui:
```bash
npx shadcn-ui@latest add [component-name]
```

### Manual:
1. Copy component từ shadcn/ui
2. Paste vào `ui/` directory
3. Customized cho project needs
4. Export from `ui/index.ts` (if needed)

---

## ⚠️ Notes

- **These are base components** - not feature-specific
- **Keep them generic** - don't add business logic
- **Use brand colors** - `--brand-blue`, `--brand-green`, `--brand-red`
- **Responsive by default** - use Tailwind classes

---

## 🔗 Related

- **Parent:** [`../`](../) - All components
- **shadcn/ui docs:** https://ui.shadcn.com
- **Tailwind:** [`../../../styles/globals.css`](../../../styles/globals.css) - Brand colors

---

*Last updated: 2026-07-22*
