# Plan: Trang Home — Refactor Classes + 3D Timeline Dự án Tiêu Biểu

## 1. Refactor CSS Class Naming

Đồng nhất class naming theo section prefix:

| Section | Prefix hiện tại | Prefix mới |
|---------|----------------|------------|
| Hero (`#home`) | `hero-` | `hero-` (giữ nguyên) |
| Solutions (`#solutions`) | `sol-`, `sc-` | `solutions-`, `solutions-card-` |
| Stats | `st-` | `stats-` |
| Industry4 | `i4-` | `industry4-` |
| PainPoints | `pp-` | `painpoints-` |
| Testimonials | `tm-` | `testimonials-` |
| Blog | `blog-` | `blog-` |
| Contact | `ct-` | `contact-` |

**Files:** sửa tất cả section components trong `apps/web/src/components/home/sections/`.

---

## 2. Section "Dự Án Tiêu Biểu" — 3D Timeline

### 2.1 Schema — Thêm vào bảng `projects` hiện tại

**Migration mới:** `supabase/migrations/0007_featured_projects.sql`

```sql
-- Thêm cột featured vào bảng projects (không tạo bảng mới)
alter table public.projects
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_year int,
  add column if not exists featured_month int,
  add column if not exists featured_order int not null default 0,
  add column if not exists company_logo_url text,
  add column if not exists scope_vi text,
  add column if not exists scope_en text;

create index projects_featured_idx on public.projects (is_featured) where is_featured = true;
```

### 2.2 Shared Schema Update

**`packages/shared/src/schemas/project.ts`** — thêm fields:

```typescript
export const projectInputSchema = z.object({
  // ... existing fields ...
  is_featured: z.boolean().default(false),
  featured_year: z.number().int().optional(),
  featured_month: z.number().int().min(1).max(12).optional(),
  featured_order: z.number().int().default(0),
  company_logo_url: z.string().optional(),
  scope_vi: z.string().optional(),
  scope_en: z.string().optional(),
});
```

### 2.3 API Route — GET /api/projects?featured=true

**`apps/web/src/app/api/projects/route.ts`** — thêm query param:

```typescript
// GET /api/projects?featured=true — lấy dự án tiêu biểu (public)
// GET /api/projects — list tất cả (admin)
```

### 2.4 3D Timeline Component

```
src/components/3d/timeline/
├── TimelineScene.tsx          # R3F Canvas + camera auto-scroll
├── CurvedPath.tsx             # Đường cong 3D (CatmullRomCurve3)
├── YearMarker.tsx             # Mốc năm trên đường cong
├── ProjectNode.tsx            # Node hình tròn + logo công ty
├── ProjectTooltip.tsx         # Tooltip HTML overlay (hover)
└── TimelineData.tsx           # Fetch featured projects + map to 3D positions
```

**Kiến trúc 3D Timeline:**
1. **Đường cong**: `CatmullRomCurve3` từ drei — uốn lượn theo dạng S trong không gian 3D (XZ serpentine + Y nhẹ)
2. **Mốc năm**: Đánh dấu trên curve, hiển thị năm dạng 3D text (TroikaThreeText hoặc sprite)
3. **Mốc tháng**: Phân bố đều trong khoảng năm, mỗi project là 1 node
4. **ProjectNode**: Hình tròn 3D, có texture logo công ty bên trong
5. **Hover**: Raycaster → tooltip HTML overlay (thông tin: title, company, date, location, description)
6. **Camera**: GSAP ScrollTrigger — scroll trong section → camera di chuyển dọc timeline
7. **Responsive**: Desktop = 3D, Mobile (< 768px) = fallback 2D horizontal scroll

### 2.5 Admin Edit — Thêm Featured Section

**`apps/web/src/app/[locale]/admin/projects-manager/[id]/page.tsx`**

Thêm tab "Featured" với các field:
- `is_featured` (toggle)
- `featured_year` (dropdown 2020-2030)
- `featured_month` (dropdown 1-12)
- `company_logo_url` (upload)
- `scope_vi` / `scope_en` (mô tả ngắn phạm vi công việc)

### 2.6 HomeClient — Thêm FeaturedProjectsSection

```tsx
// apps/web/src/components/home/HomeClient.tsx
import { FeaturedProjectsSection } from './sections/FeaturedProjectsSection';

export function HomeClient({ blogPosts = [] }: HomeClientProps) {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <PainPointsSection />
      <SolutionsSection />
      <Industry4Section />
      <StatsSection />
      <FeaturedProjectsSection />   {/* ← thêm */}
      <BlogSection posts={blogPosts} />
      <ContactSection />
    </div>
  );
}
```

---

## 3. Files to Modify/Create

### Modify (class refactor):
- `apps/web/src/components/home/sections/HeroSection.tsx`
- `apps/web/src/components/home/sections/SolutionsSection.tsx`
- `apps/web/src/components/home/sections/StatsSection.tsx`
- `apps/web/src/components/home/sections/Industry4Section.tsx`
- `apps/web/src/components/home/sections/PainPointsSection.tsx`
- `apps/web/src/components/home/sections/TestimonialsSection.tsx`
- `apps/web/src/components/home/sections/BlogSection.tsx`
- `apps/web/src/components/home/sections/ContactSection.tsx`

### Modify (add featured fields):
- `packages/shared/src/schemas/project.ts`
- `apps/web/src/app/api/projects/route.ts` (thêm `?featured=true`)
- `apps/web/src/app/[locale]/admin/projects-manager/[id]/page.tsx` (thêm Featured tab)

### New DB migration:
- `supabase/migrations/0007_featured_projects.sql`

### New 3D Timeline components:
- `apps/web/src/components/3d/timeline/TimelineScene.tsx`
- `apps/web/src/components/3d/timeline/CurvedPath.tsx`
- `apps/web/src/components/3d/timeline/YearMarker.tsx`
- `apps/web/src/components/3d/timeline/ProjectNode.tsx`
- `apps/web/src/components/3d/timeline/ProjectTooltip.tsx`
- `apps/web/src/components/3d/timeline/TimelineData.tsx`

### New section component:
- `apps/web/src/components/home/sections/FeaturedProjectsSection.tsx`

### Update:
- `apps/web/src/components/home/HomeClient.tsx`
- `supabase/seed.sql` — thêm sample projects với `is_featured = true`

---

## 4. Verification

1. `pnpm typecheck` ✅
2. `pnpm dev` → homepage hiển thị đúng
3. Admin: tạo project, bật Featured, điền year/month → lưu
4. Featured projects xuất hiện trên 3D Timeline
5. Hover vào node → tooltip hiện thông tin
6. Light theme OK trên desktop & mobile
7. Mobile fallback 2D timeline hoạt động
