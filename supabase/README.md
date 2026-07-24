# 🗄️ Supabase - Database & Backend

**Purpose:** Database schema, migrations, storage policies, và Edge Functions

---

## 📋 Mục đích

Thư mục này chứa **tất cả Supabase-related code**:
- Database migrations (schema + RLS policies)
- Storage bucket policies
- Seed data
- Edge Functions (Deno runtime)

---

## 📂 Cấu trúc

```
supabase/
├── migrations/              # 📝 SQL migrations
│   ├── 0001_*.sql          # Initial schema
│   ├── 0002_rls_policies.sql  # RLS for all tables
│   └── ...
├── functions/              # ⚡ Edge Functions (Deno)
├── seed.sql                # 🌱 Initial seed data
└── .temp/                  # Temporary files (gitignored)
```

---

## 🗃️ Database Structure

### Main Tables
- `users` - User accounts (linked to Supabase Auth)
- `projects` - Project data
- `project_nodes` - Tree structure nodes (Phase 3)
- `settings` - System settings (public read)
- `documents` - HDVH documents (Phase 5)

### Storage Buckets
- `project-docs/` - Project documents (admin upload only)
- `images/` - Public images

---

## 🔒 Security (RLS)

**RLS is enabled on ALL tables.**

### Anonymous users (public):
- ✅ Can read: `status='published'` rows
- ✅ Can read: All `settings` rows
- ❌ Cannot write: Anything

### Authenticated users:
- ✅ Can read: Their own data
- ✅ Can write: Based on role (admin/editor)

### Admin/Editor:
- ✅ Can read/write: Everything (via `public.current_user_role()`)

---

## 🚀 Commands

### Local Development
```bash
# Start local Supabase
supabase start

# Reset database (re-apply migrations + seed)
supabase db reset

# Apply migrations
supabase db push

# Generate TypeScript types
pnpm db:types  # From root
```

### Production
```bash
# Link to project
supabase link --project-ref <your-ref>

# Push migrations to production
supabase db push
```

---

## ⚠️ Gotchas

### 1. Service-role client
```typescript
// apps/web/src/lib/supabase/service.ts
// ❌ NEVER use in client code
// ✅ ONLY in server-side code
// 🔓 Bypasses RLS - use with extreme caution
```

### 2. RLS policies
- Mọi table CÓ RLS enabled
- Anon users ONLY read `status='published'`
- Check [`0002_rls_policies.sql`](migrations/0002_rls_policies.sql)

### 3. Edge Functions vs Node.js
- Edge Functions = Deno runtime (NOT Node)
- For Node-only libs (mammoth, pdf-parse) → Use Next Route Handler with `runtime: 'nodejs'`

---

## 📝 Migrations

| Migration | Mô tả |
|-----------|-------|
| `0001_*.sql` | Initial schema (users, projects, settings) |
| `0002_rls_policies.sql` | RLS policies for all tables |
| `0003_*.sql` | Storage buckets & policies |
| `0004_*.sql` | Additional schema updates |

---

## 🔗 Liên kết

- **Parent:** [`../`](../) - Root
- **Web app:** [`../apps/web/src/lib/supabase/`](../apps/web/src/lib/supabase/) - Supabase clients
- **Docs:** [`../docs/runbook.md`](../docs/runbook.md) - Full setup guide
- **Supabase Dashboard:** https://app.supabase.com

---

*Last updated: 2026-07-22*
