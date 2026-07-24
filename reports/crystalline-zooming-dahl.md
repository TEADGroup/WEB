# Plan: Chỉnh sửa Timeline "Dự Án Tiêu Biểu — Hành Trình Của Chúng Tôi"

> **Back to [Reports](../reports/README.md)**

## Context

Section **FeaturedProjectsSection** hiện tại sử dụng 3D timeline (React Three Fiber) với:
- Đường path cong 3D (CatmullRomCurve3) — màu xanh sáng
- Các node dự án hình tròn + sprite text (tháng + tên)
- Year marker dọc path
- Floating tooltip hiện khi hover

Mục tiêu: chỉnh sửa đường line và cách hiển thị thông tin dự án để giống với thiết kế tham khảo `image.png`.

## Phân tích thiết kế tham khảo

Từ hình ảnh, timeline có các đặc điểm rõ ràng:

| Yếu tố | Mô tả |
|--------|-------|
| **Đường path** | Cong S-curve ngang, chạy từ trái sang phải, stroke dày ~3-4px, gradient xanh |
| **Node** | Vòng tròn trắng viền xanh tại các vị trí dự án trên path |
| **Card dự án** | Thẻ thông tin (title, năm, mô tả, location) được kết nối với node qua **đường dashed connector** |
| **Layout** | Cards xen kẽ trên/dưới path (alternating) |
| **Style** | Flat 2D vector, không có depth/perspective 3D |

**Kết luận**: Reference design là **2D SVG/HTML**, không phải 3D immersive. Việc giữ R3F và cố gắng "ép" thành 2D sẽ phức tạp không cần thiết.

## Quyết định kiến trúc: Chuyển từ 3D → 2D SVG/HTML

**Lý do**:
1. Reference design thuần 2D — path + cards trên mặt phẳng
2. SVG path styling (gradient stroke, dashed line, linecap) dễ dàng hơn Three.js rất nhiều
3. HTML text trong cards chất lượng cao hơn canvas/sprite text
4. GSAP (đã có trong project) tích hợp tốt với SVG animation
5. Hiệu năng tốt hơn (không cần WebGL canvas)
6. Code đơn giản hơn, dễ maintain

## Các file cần tạo mới

| File | Mục đích |
|------|----------|
| `apps/web/src/components/3d/timeline/TimelinePathSVG.tsx` | SVG path + nodes + dashed connectors + year labels |
| `apps/web/src/components/3d/timeline/ProjectCard.tsx` | HTML card hiển thị thông tin dự án (absolute positioned overlay) |

## Các file cần sửa

| File | Thay đổi |
|------|----------|
| `apps/web/src/components/3d/timeline/TimelineData.tsx` | Thêm `build2DTimelinePath()` — tính toán vị trí 2D cho path và cards |
| `apps/web/src/components/3d/timeline/TimelineScene.tsx` | Rewrite — bỏ R3F Canvas, dùng SVG + cards |
| `apps/web/src/components/home/sections/FeaturedProjectsSection.tsx` | Bỏ tooltip, cập nhật layout cho 2D timeline |

## Các file có thể xóa (sau khi hoàn thành)

| File | Ghi chú |
|------|---------|
| `CurvedPath.tsx` | Đã thay bằng SVG path |
| `ProjectNode.tsx` | Đã thay bằng SVG circles + HTML cards |
| `YearMarker.tsx` | Đã thay bằng SVG text labels |
| `ProjectTooltip.tsx` | Persistent cards thay thế tooltip |

## Thiết kế chi tiết

### 1. `TimelineData.tsx` — Thêm hàm build 2D

Thêm type và function mới (giữ nguyên 3D functions cũ):

```typescript
export interface ProjectNode2D {
  project: FeaturedProject;
  x: number;       // Node position X
  y: number;       // Node position Y on S-curve
  cardX: number;   // Card X position
  cardY: number;   // Card Y position
  side: 'top' | 'bottom';
}

export function build2DTimelinePath(projects: FeaturedProject[]): {
  nodes: ProjectNode2D[];
  pathD: string;    // SVG path d attribute
  totalWidth: number;
}
```

**Logic S-curve**:
- Sort projects chronologically (như buildTimelineCurve cũ)
- Tính (x, y) cho mỗi node trên đường S-curve ngang
- Xác định side (top/bottom) xen kẽ
- Tạo SVG path `d` attribute (Cubic Bezier)

### 2. `TimelinePathSVG.tsx` — SVG path + nodes

**Props**:
```typescript
interface TimelinePathSVGProps {
  nodes: ProjectNode2D[];
  pathD: string;
  totalWidth: number;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}
```

**Nội dung SVG**:
- `<defs>` — gradient path, glow filter, shadow
- `<path d={pathD}>` — main S-curve với gradient stroke
- `<circle>` — node markers tại mỗi (x, y)
- `<path>` — dashed connector lines từ node → card position
- `<text>` — month + year label cạnh node

**Responsive**: `viewBox` fixed width, SVG width 100%, height auto.

### 3. `ProjectCard.tsx` — HTML card

**Props**:
```typescript
interface ProjectCardProps {
  project: FeaturedProject;
  node: ProjectNode2D;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}
```

**Card layout** (giống reference):
```
┌─────────────────────┐
│ Tháng Năm · Location│  ← text-xs, brand-blue
│ DỰ ÁN TITLE         │  ← font-display, bold, dark
│ Client Name          │  ← text-xs, muted
│ Mô tả ngắn scope     │  ← text-xs, line-clamp 2, muted
└─────────────────────┘
```

**Style**: White bg, border, shadow-lg, rounded-2xl, max-w-xs.
**Position**: `position: absolute; left: cardX; top: cardY;`
**Animation**: fade-in + slide-up (CSS transition or GSAP).

**Vị trí card**:
- `side === 'top'` → card ở phía trên path, mũi tên connector hướng xuống
- `side === 'bottom'` → card ở phía dưới path, mũi tên connector hướng lên

### 4. `TimelineScene.tsx` — Rewrite 2D

**Before**: R3F Canvas + OrbitControls + 3D meshes
**After**: Container div → SVG (path + nodes) → HTML ProjectCards (absolute positioned)

```tsx
export function TimelineScene({ onHoveredProject }: TimelineSceneProps) {
  const { projects } = useTimelineProjects();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { nodes, pathD, totalWidth } = useMemo(
    () => build2DTimelinePath(projects),
    [projects]
  );

  // Notify parent
  const hoveredProject = useMemo(
    () => projects.find(p => p.id === hoveredId) ?? null,
    [hoveredId, projects]
  );
  useEffect(() => { onHoveredProject?.(hoveredProject); }, [hoveredProject, onHoveredProject]);

  return (
    <div className="relative w-full h-full overflow-x-auto">
      {/* SVG layer */}
      <TimelinePathSVG ... />
      {/* Card layer (absolute overlay) */}
      {nodes.map(node => (
        <ProjectCard key={node.project.id} project={node.project} node={node} ... />
      ))}
    </div>
  );
}
```

### 5. `FeaturedProjectsSection.tsx` — Cập nhật

**Thay đổi**:
- Bỏ `onMouseMove` handler (không cần cho tooltip cũ)
- Bỏ `ProjectTooltip` import
- `TimelineScene` dynamic import vẫn giữ (nhưng content mới)
- Điều chỉnh layout để cards có thể click (pointer-events-auto)

## Scroll animation (nâng cao — optional phase 2)

Có thể thêm GSAP ScrollTrigger để animate path drawing khi scroll:
- SVG path `stroke-dasharray` + `stroke-dashoffset`
- ScrollTrigger `toggleActions: "play none none none"`
- Cards fade-in staggered

## Xử lý overlap

Khi các dự án gần nhau, cards có thể overlap. Giải pháp:
1. Trong `build2DTimelinePath()`, kiểm tra overlap và điều chỉnh Y offset
2. Hoặc dùng CSS `z-index` ordering

## Mobile

Giữ nguyên `MobileTimeline` component (2D vertical timeline) — không thay đổi.

## Thứ tự thực hiện

| Bước | File | Mô tả |
|------|------|-------|
| 1 | `TimelineData.tsx` | Thêm `build2DTimelinePath()` + `ProjectNode2D` type |
| 2 | `TimelinePathSVG.tsx` | Tạo mới: SVG path + nodes + connectors |
| 3 | `ProjectCard.tsx` | Tạo mới: HTML card overlay |
| 4 | `TimelineScene.tsx` | Rewrite: bỏ R3F, dùng SVG + cards |
| 5 | `FeaturedProjectsSection.tsx` | Bỏ tooltip, cập nhật layout |
| 6 | `ProjectTooltip.tsx` (xóa) | Không cần dùng nữa |

## Kiểm tra

1. `pnpm typecheck` — TypeScript pass
2. `pnpm dev` → `http://localhost:3000/vi`
3. Scroll xuống "DỰ ÁN TIÊU BIỂU" section
4. Verify:
   - ✅ Đường S-curve hiển thị với gradient xanh
   - ✅ Node circles tại mỗi dự án
   - ✅ Cards thông tin visible (không cần hover)
   - ✅ Dashed connectors nối node → card
   - ✅ Year labels trên path
   - ✅ Hover vào node → card highlight
   - ✅ Mobile (<768px) vẫn dùng vertical timeline cũ
5. `pnpm --filter @tea/web build` — production build pass
