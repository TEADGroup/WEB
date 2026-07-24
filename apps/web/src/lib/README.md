# 🔧 Client & Server Utilities

**Purpose:** Utilities, helpers, và shared logic

---

## 📋 Overview

Thư mục này chứa **utility functions và helpers**:
- Supabase clients (server, client, service)
- Anthropic AI SDK
- Resend email SDK
- Theme utilities
- Search utilities

---

## 🎯 Directory Structure

```
lib/
├── supabase/              # Supabase clients
│   ├── server.ts          # SSR cookie client
│   ├── client.ts          # Browser client
│   └── service.ts         # Service-role (SERVER ONLY)
│
├── anthropic/             # Anthropic AI SDK
│   └── client.ts         # Anthropic client for HDVH parsing
│
├── resend/               # Resend email SDK
│   └── client.ts         # Email client (Phase 6)
│
├── theme.ts              # Theme utilities
├── search/               # Search utilities
│   └── index.ts
│
└── utils.ts              # General utilities
```

---

## 🔑 Key Files

### Supabase Clients

```typescript
// server.ts - For server components
import { createServerClient } from '@supabase/ssr';
export const supabase = createServerClient(cookies());

// client.ts - For client components
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(url, key);

// service.ts - SERVER ONLY, bypasses RLS
export const supabase = createClient(url, serviceRoleKey);
```

### Theme Utilities

```typescript
// theme.ts - Theme logic
export function getThemePhase(time?: Date): ThemePhase {
  // Returns: 'dawn' | 'day' | 'dusk' | 'night'
}
```

---

## 🔧 Usage

### In Server Component
```typescript
import { supabase } from '@/lib/supabase/server';

export default async function Page() {
  const { data } = await supabase.from('projects').select('*');
  return <div>{data.length} projects</div>;
}
```

### In Client Component
```typescript
'use client';
import { supabase } from '@/lib/supabase/client';

export function Component() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    supabase.from('projects').select('*').then(setData);
  }, []);
  
  return <div>{data.length} projects</div>;
}
```

### With Service Role (Server Only!)
```typescript
import { supabase } from '@/lib/supabase/service';

// ⚠️ WARNING: Bypasses RLS, use with extreme caution
export async function adminFunction() {
  return await supabase.from('projects').select('*');
}
```

---

## ⚠️ Gotchas

### 1. Client Selection
```typescript
// ❌ WRONG - Using client in server component
import { supabase } from '@/lib/supabase/client';
export default async function Page() { /* ... */ }

// ✅ RIGHT - Using server in server component
import { supabase } from '@/lib/supabase/server';
export default async function Page() { /* ... */ }
```

### 2. Service Role
```typescript
// ❌ WRONG - Using service in client code
import { supabase } from '@/lib/supabase/service';
'use client'; // 💥 SECURITY RISK!

// ✅ RIGHT - Service role ONLY in server code
import { supabase } from '@/lib/supabase/service';
// Server component or API route only
```

### 3. Theme Functions
```typescript
// ❌ WRONG - Calling theme hooks from multiple places
const theme = useTheme(); // In multiple components

// ✅ RIGHT - Reading from CSS variables
const bgColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--bg-primary');
```

---

## 🔗 Related

- **Parent:** [`../`](../) - Web app source
- **Server modules:** [`../server/modules/`](../server/modules/) - Server-side logic
- **Components:** [`../components/`](../components/) - React components

---

## 📚 Utilities Documentation

### Supabase
- **Docs:** https://supabase.com/docs
- **SSR:** https://supabase.com/docs/guides/auth/server-side-rendering

### Anthropic AI
- **Docs:** https://docs.anthropic.com
- **SDK:** https://www.npmjs.com/package/@anthropic-ai/sdk

### Resend
- **Docs:** https://resend.com/docs
- **SDK:** https://www.npmjs.com/package/resend

---

*Last updated: 2026-07-22*
