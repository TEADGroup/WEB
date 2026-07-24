# 🔌 API Routes

**Purpose:** API endpoints - backend logic cho frontend

---

## 📋 Overview

Thư mục này chứa **API Route Handlers** (Next.js App Router):
- Authentication endpoints
- Project CRUD operations
- File upload handling
- AI HDVH parsing
- System settings
- Contact form submission

---

## 🎯 Endpoint Structure

```
api/
├── auth/                # Authentication
│   ├── route.ts         # Login, logout, refresh
│   └── callback/route.ts # OAuth callback
│
├── users/               # User management
│   └── route.ts         # CRUD + RBAC (admin only)
│
├── projects/            # Project CRUD + tree
│   ├── route.ts         # List, create projects
│   ├── [id]/            # Single project operations
│   └── tree/            # Tree structure endpoints
│
├── uploads/             # File upload
│   └── route.ts         # Image, PDF, DOCX upload
│
├── hdvh-parser/         # AI parsing (Phase 5)
│   └── route.ts         # HDVH document parsing
│
├── settings/            # System settings (admin)
│   └── route.ts         # Get/update settings
│
└── contact/             # Contact form (Phase 6)
    └── route.ts         # Email submission
```

---

## 🔧 Endpoint Patterns

### GET (List/Read)
```typescript
// GET /api/projects
export async function GET(request: NextRequest) {
  const projects = await getProjects();
  return NextResponse.json(projects);
}
```

### POST (Create)
```typescript
// POST /api/projects
export async function POST(request: NextRequest) {
  const body = await request.json();
  const project = await createProject(body);
  return NextResponse.json(project, { status: 201 });
}
```

### PUT/PATCH (Update)
```typescript
// PUT /api/projects/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const project = await updateProject(params.id, body);
  return NextResponse.json(project);
}
```

### DELETE
```typescript
// DELETE /api/projects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteProject(params.id);
  return new NextResponse(null, { status: 204 });
}
```

---

## 🔒 Authentication Pattern

```typescript
import { requireAuth } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const user = await requireAuth(); // Throws if not authenticated
  // User data available here
  return NextResponse.json({ data: 'protected' });
}
```

### Role-Based Access (RBAC)
```typescript
import { requireRole } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  const user = await requireRole(['admin']); // Only admins
  // Proceed with deletion
  return new NextResponse(null, { status: 204 });
}
```

---

## ⚡ Runtime Configuration

### Node.js Runtime (for Node-only libs)
```typescript
// hdvh-parser/route.ts
export const runtime = 'nodejs'; // Required for mammoth, pdf-parse

export async function POST(request: NextRequest) {
  // Can use Node-only libraries here
  const mammoth = require('mammoth');
  // ...
}
```

### Edge Runtime (default)
```typescript
// Most API routes can use Edge (faster)
export const runtime = 'edge'; // Optional, edge is default
```

---

## ⚠️ Gotchas

### 1. Request Body
```typescript
// ❌ WRONG - Not reading body
export async function POST(request: NextRequest) {
  const data = request.json(); // 💥 This is a promise!
}

// ✅ RIGHT - Await the body
export async function POST(request: NextRequest) {
  const data = await request.json(); // ✅ Await required
}
```

### 2. Response Format
```typescript
// ❌ WRONG - Returning object directly
export async function GET() {
  return { data: 'value' }; // 💥 Wrong type
}

// ✅ RIGHT - Using NextResponse
export async function GET() {
  return NextResponse.json({ data: 'value' }); // ✅ Correct
}
```

### 3. Error Handling
```typescript
// ❌ WRONG - Throwing raw errors
export async function GET() {
  throw new Error('Not found'); // 💥 Returns 500
}

// ✅ RIGHT - Using NextResponse
export async function GET() {
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  ); // ✅ Correct status code
}
```

---

## 🔗 Related

- **Parent:** [`../`](../) - App directory
- **Supabase clients:** [`../../lib/supabase/`](../../lib/supabase/) - Database clients
- **Server modules:** [`../../server/modules/`](../../server/modules/) - Business logic
- **Schemas:** [`../../../../../packages/shared/`](../../../../../packages/shared/) - Validation schemas

---

## 📚 API Documentation Resources

- **Next.js Route Handlers:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **NextResponse docs:** https://nextjs.org/docs/app/api-reference/next-response

---

*Last updated: 2026-07-22*
