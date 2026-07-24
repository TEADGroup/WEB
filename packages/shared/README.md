# 🔗 Shared Package

**Package:** `@tea/shared`  
**Purpose:** Single source of truth cho schemas, types, và config

---

## 📋 Mục đích

Package này chứa **code shared across monorepo**:
- Zod schemas (data validation)
- TypeScript types
- Theme configuration
- Shared constants
- Utility functions

---

## 🎯 Why `@tea/shared`?

### Single source of truth principle
```typescript
// ✅ RIGHT: Import from @tea/shared
import { projectSchema } from '@tea/shared/schemas';
// Used by: Anthropic AI, server validation, Admin UI

// ❌ WRONG: Define in multiple places
// apps/web/src/lib/schemas.ts
// apps/web/src/app/api/projects/route.ts
// apps/web/src/components/admin/ProjectForm.tsx
```

### Benefits
1. **Type safety** across monorepo
2. **Validation consistency** (Zod schemas)
3. **DRY principle** - don't repeat schemas
4. **AI-friendly** - single location for data contracts

---

## 📂 Cấu trúc (anticipated)

```
src/
├── schemas/                 # 📝 Zod schemas
│   ├── project.ts          # Project validation
│   ├── user.ts             # User validation
│   ├── document.ts         # HDVH document validation
│   └── index.ts            # Export all schemas
├── types/                   # 📘 TypeScript types
│   ├── supabase.ts         # Auto-generated from Supabase
│   ├── api.ts              # API response types
│   └── index.ts
├── config/                  # ⚙️ Configuration
│   ├── theme.ts            # Theme configuration
│   └── constants.ts
└── utils/                   # 🔧 Shared utilities
    └── index.ts
```

---

## 🔗 Usage

### In web app
```typescript
// apps/web/src/app/api/projects/route.ts
import { projectSchema } from '@tea/shared/schemas';

// Validate input
const validated = projectSchema.parse(body);
```

### In AI parsing
```typescript
// apps/web/src/server/modules/hdvh-parser/parser.ts
import { projectNodeSchema } from '@tea/shared/schemas';

// Anthropic AI returns structured data
const result = await anthropic.messages.create({
  // ...
  response_format: {
    type: 'json_schema',
    json_schema: projectNodeSchema,
  },
});
```

---

## 🚀 Commands

```bash
# Build shared package
pnpm --filter @tea/shared build

# Watch mode
pnpm --filter @tea/shared dev

# Type check
pnpm --filter @tea/shared typecheck
```

---

## 🔗 Liên kết

- **Parent:** [`../../`](../../) - Root
- **Web app:** [`../../apps/web/`](../../apps/web/) - Main consumer
- **Related:** [`../../packages/telegram-mcp/`](../telegram-mcp/) - Other package

---

*Last updated: 2026-07-22*
