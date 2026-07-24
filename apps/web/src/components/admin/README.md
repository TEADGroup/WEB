# 🔐 Admin Components

**Purpose:** Admin dashboard components - Phase 4

---

## 📋 Overview

Thư mục này chứa **admin UI components** cho managing projects, users, và system settings:
- Dashboard overview
- Project management (CRUD + tree editor)
- User management (RBAC)
- System settings

---

## 🎯 Current Status

⏳ **TODO - Phase 4** (Auth + Admin + RBAC)

Components in this directory are planned but not yet implemented.

---

## 📂 Planned Components

```
admin/
├── DashboardOverview.tsx    # Stats, charts, recent activity
├── ProjectList.tsx          # Project table with actions
├── ProjectForm.tsx          # Create/edit project
├── TreeEditor.tsx           # React Flow tree editor
├── UserList.tsx             # User table with RBAC
├── UserForm.tsx             # Create/edit user
└── SystemSettings.tsx       # System configuration
```

---

## 🔧 Planned Usage

### Dashboard Overview
```typescript
'use client'; // Interactive charts, stats
import { DashboardOverview } from '@/components/admin/DashboardOverview';

export default function AdminDashboard() {
  return <DashboardOverview />;
}
```

### Project Management
```typescript
'use client'; // Interactive table
import { ProjectList } from '@/components/admin/ProjectList';

export default function ProjectsPage() {
  return <ProjectList />;
}
```

### Tree Editor (Phase 3)
```typescript
'use client'; // React Flow requires client
import { TreeEditor } from '@/components/admin/TreeEditor';

export default function TreeEditorPage() {
  return <TreeEditor projectId={params.id} />;
}
```

---

## 🔒 Authentication Required

Tất cả admin components require:
- ✅ User authenticated (Supabase Auth)
- ✅ User has admin or editor role (RBAC)
- ✅ Server-side validation (RLS policies)

```typescript
// Server component check
export default async function AdminPage() {
  const user = await getUser();
  if (!user || !['admin', 'editor'].includes(user.role)) {
    redirect('/unauthorized');
  }
  return <AdminDashboard />;
}
```

---

## 📊 Dependencies (Phase 4)

- **React Flow:** `@xyflow/react` v12 (tree editor)
- **Charts:** `recharts` or similar (dashboard stats)
- **Forms:** React Hook Form + Zod
- **Tables:** shadcn/ui table component

---

## 🔗 Related

- **Parent:** [`../`](../) - All components
- **Admin routes:** [`../../app/[locale]/(auth)/admin/`](../../app/[locale]/(auth)/admin/) - Admin pages
- **Tree components:** [`../tree/`](../tree/) - React Flow components (Phase 3)
- **API:** [`../../app/api/`](../../app/api/) - Backend endpoints

---

## 📚 Implementation Plan (Phase 4)

1. ✅ Setup Supabase Auth
2. ✅ Implement RBAC system
3. ⏳ Create dashboard overview
4. ⏳ Create project management
5. ⏳ Create tree editor
6. ⏳ Create user management
7. ⏳ Create system settings

---

*Last updated: 2026-07-22*
**Status:** Planned for Phase 4
