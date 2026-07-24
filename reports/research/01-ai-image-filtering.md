# Phase 3 — Sơ đồ cây dự án (React Flow)

## Context

Hiện tại website TEA Group là single-page scroll với các section: Hero, Solutions, About, Stats, **Projects**, Contact. Section Projects **đang chỉ là placeholder** ("Sơ đồ cây dự án tương tác đang được hoàn thiện"). Phase 3 thay thế placeholder này bằng **sơ đồ cây dự án tương tác** dùng React Flow, hiển thị dự án mẫu đã seed trong Supabase.

Kiến trúc hiện tại:
- DB đã có `projects` (6 categories) + `project_sections` (7 section types) + RLS + seed data mẫu
- Shared package `@tea/shared` có schemas Zod cho project + section types
- Tailwind đã có `signal-flow` animation (`stroke-dashoffset`) dùng cho edge
- `framer-motion`, `lucide-react` đã có sẵn

## Scope

1. Cài đặt `@xyflow/react` v12 + `dagre` + `@types/dagre`
2. Tạo server module `server/modules/projects/queries.ts` — fetch published data cho tree
3. Tạo components tree: node types (Root, Category, Project, Section) + tree wrapper + detail panel
4. Tạo `useTreeData.ts` hook xử lý data → React Flow nodes/edges
5. Tạo `tree-layout.ts` utility — dagre auto-layout
6. Sửa `HomeClient.tsx`: thay placeholder bằng tree component
7. Thêm locale keys cho tree labels
8. Styles: custom nodes glassmorphism + signal edges + detail panel

## Files to Create

### `apps/web/src/server/modules/projects/queries.ts`

Server-side query function:
```ts
export interface PublishedTree {
  projects: (Project & { sections: ProjectSection[] })[];
}
export async function getPublishedTree(): Promise<PublishedTree>
```
- Query `projects where status='published'` + their `project_sections where status='published'`
- Use `createSupabaseServerClient()` from `lib/supabase/server.ts`
- Return typed data matching `@tea/shared` schemas

### `apps/web/src/lib/tree-layout.ts`

Pure function utility:
```ts
interface TreeNode {
  id: string;
  type: 'root' | 'category' | 'project' | 'section';
  parentId: string | null;
  label: string;
  data?: Record<string, unknown>;
}

export function buildTreeLayout(treeNodes: TreeNode[]): {
  nodes: Node<TreeNode['data']>[];
  edges: Edge[];
}
```
- Build flat node list + parent-child edges
- Run dagre layout (`rankdir: 'TB'`, `nodeSep: 60`, `rankSep: 100`)
- Return React Flow-compatible `Node[]` + `Edge[]`

### `apps/web/src/components/tree/nodes/CategoryNode.tsx`

Custom node cho category (6 loại giải pháp):
- Glass card (`bg-white/30 backdrop-blur dark:bg-white/5`) với icon Lucide
- Màu sắc theo từng category: line-automation (#FF3333), control-cabinets (#0099FF), plc-scada (#00A651), system-integration (#33B5FF), maintenance (#FF6666), other (#888)
- Font-display uppercase label
- Kích thước cố định ~180×80px
- `handleClick` → expand/collapse children

### `apps/web/src/components/tree/nodes/ProjectNode.tsx`

Custom node cho từng project:
- Glass card với title, client, date, category badge
- Corner accent stripe màu brand-blue
- `onClick` → mở detail panel bên phải
- Hover → glow shadow (`hover:shadow-card-hover`)

### `apps/web/src/components/tree/nodes/SectionNode.tsx`

Custom node cho section (con của project):
- Small pill/capsule shape (`rounded-full` hoặc `rounded-xl`)
- Icon nhỏ theo type: overview (FileText), equipment (Package), specs (Settings), operating (Play), maintenance (Wrench), safety (Shield)
- Màu viền accent theo type
- Text 1 dòng, gray nhỏ

### `apps/web/src/components/tree/ProjectsTree.tsx'

Main tree wrapper — `'use client'`:
```tsx
import dynamic from 'next/dynamic';

const ReactFlowWrapper = dynamic(() => import('./ReactFlowWrapper'), { ssr: false });

export function ProjectsTree({ projects }: { projects: PublishedTree }) {
  // Server data → treeNodes via buildTreeLayout
  // render ReactFlowWrapper
}
```

### `apps/web/src/components/tree/ReactFlowWrapper.tsx`

Client-only component chứa `<ReactFlowProvider>` + `<ReactFlow>`:
- Canvas: `fitView`, `proseOnNodes: false`
- `nodeTypes` đăng ký: category, project, section
- `defaultEdgeOptions`: animated dashed brand-blue
- Background dots/grid (brand-blue/5)
- MiniMap (góc dưới phải, collapsed)
- Controls (góc dưới trái)
- Animation: edge `signal-flow` CSS animation (stroke-dashoffset)
- Connection line style dùng brand colors
- `<Suspense>` wrapper cho loading skeleton

### `apps/web/src/components/tree/ProjectDetailPanel.tsx`

Panel detail xuất hiện khi click project node:
- Slide-in bên phải hoặc overlay modal
- Thông tin: title, client, location, date, description (VI/EN theo locale)
- Danh sách sections với section type badge
- Gallery images nếu có (lazy load)
- Close button + click-outside-to-close
- Transition: `framer-motion` `AnimatePresence`

### `apps/web/src/hooks/useTreeData.ts`

Client hook:
```ts
function useTreeData(projects: PublishedTree) {
  // projects → TreeNode[] (root + categories + project + sections)
  // buildTreeLayout → nodes + edges
  // State cho selectedNodeId, filter, search
  // setCenter() helper khi filter
  return { nodes, edges, selectedNode, selectNode, filterByCategory, searchQuery, setSearchQuery, fitView }
}
```

### `apps/web/src/components/tree/TreeSkeleton.tsx`

Loading skeleton hiển thị trong khi React Flow load:
- 3-4 div hình tròn/chữ nhật với `animate-pulse`
- `bg-black/5 dark:bg-white/5` glassmorphism
- Sắp xếp mô phỏng tree layout

## Files to Modify

### `apps/web/package.json`
- Add deps: `@xyflow/react@^12.4`, `dagre@^0.8`, `@types/dagre`

### `apps/web/src/app/[locale]/page.tsx`
- Server component: import `getPublishedTree()` từ server module
- Pass `projects` data xuống `<HomeClient projects={projects} />`

### `apps/web/src/components/home/HomeClient.tsx`
- Nhận `projects` prop
- Thay `<div placeholder>` bằng `<ProjectsTree projects={projects} />`
- Giữ nguyên mọi section khác

### `apps/web/src/locales/vi.json` + `en.json`
Thêm keys:
```json
"Tree": {
  "rootLabel": "TEA Group — Dự án" / "TEA Group — Projects",
  "filterAll": "Tất cả" / "All",
  "searchPlaceholder": "Tìm dự án…" / "Search projects…",
  "detailClient": "Khách hàng" / "Client",
  "detailLocation": "Địa điểm" / "Location",
  "detailDate": "Ngày thực hiện" / "Date",
  "detailSections": "Hạng mục" / "Sections",
  "detailGallery": "Hình ảnh" / "Gallery",
  "noResults": "Không tìm thấy dự án" / "No projects found",
  "loading": "Đang tải sơ đồ…" / "Loading tree…",
  "category_line-automation": "Tự động hoá dây chuyền" / "Line automation",
  "category_control-cabinets": "Tủ điện điều khiển" / "Control cabinets",
  "category_plc-scada": "PLC / SCADA" / "PLC / SCADA",
  "category_system-integration": "Tích hợp hệ thống" / "System integration",
  "category_maintenance": "Bảo trì" / "Maintenance",
  "category_other": "Khác" / "Other"
}
```

### `apps/web/tailwind.config.ts`
- Add: Nếu `typeColors` cho category + section type chưa có trong theme extension, thêm vào

## Data Flow

```
page.tsx (Server) 
  │
  ├─ getPublishedTree() [Supabase server client]
  │    └─ SELECT * FROM projects WHERE status='published'
  │         JOIN project_sections WHERE status='published'
  │
  └─ <HomeClient projects={data} />

HomeClient.tsx (Client)
  │
  └─ <ProjectsTree projects={data} />
       │
       ├─ buildTreeLayout(projects) 
       │    ├─ treeNodes: [{ root }, { categories... }, { projects... }, { sections... }]
       │    └─ dagre → { nodes, edges }
       │
       └─ <ReactFlowWrapper nodes={nodes} edges={edges} />
            │
            ├─ nodeTypes: { category, project, section }
            ├─ edges: animated dashed
            ├─ MiniMap + Controls + Background
            │
            └─ onClick(projectNode) → <ProjectDetailPanel />
```

## Node Hierarchy

```
root (TEA Group — Projects)
├── category: Line automation
│   ├── project: Dây chuyền đóng gói tự động
│   │   ├── section: System overview
│   │   └── section: Safety warnings
│   └── ... other projects
├── category: Control cabinets
│   └── ... projects (future)
├── category: PLC / SCADA
│   └── ...
├── category: System integration
├── category: Maintenance
└── category: Other
```

## Mobile Strategy (< 768px)

Trên mobile, React Flow có touch interaction khó dùng. Strategy:
1. **Detect viewport width** — `useMediaQuery('(max-width: 767px)')`
2. **Replace canvas** với **accordion list**:
   - Category = accordion header (click → expand/collapse)
   - Project = sub-header với title + client badge
   - Sections = nested list items với type icon
3. Reuse `ProjectDetailPanel` khi click project (modal full-screen)

## Styling

- Nodes: background `bg-white/30 dark:bg-white/5` glassmorphism, `shadow-card`, `border border-white/20 dark:border-white/10`, `backdrop-blur`
- Edges: brand-blue `#0099FF`, dashed, animated stroke-dashoffset
- Selected node: ring `ring-2 ring-brand-blue`
- Detail panel: glass sidebar `w-80 lg:w-96`, scroll, close button
- MiniMap: styled dark/light matching theme

## Edge Signal Animation

Tailwind đã có `signal-flow` animation:
```css
@keyframes signal-flow {
  to { stroke-dashoffset: 0; }
}
```
Áp dụng cho edges bằng `edgeStyle` trong React Flow config:
```ts
defaultEdgeOptions={{
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#0099FF', strokeWidth: 2, strokeDasharray: '8 4' },
}}
```

## Verification

1. `pnpm install` — @xyflow/react, dagre cài đặt thành công
2. `pnpm dev` — không lỗi TypeScript
3. Home page → scroll đến `#projects` → thấy sơ đồ cây thay vì placeholder
4. Cây có root → categories → 1 project demo → 2 sections
5. Click project node → detail panel xuất hiện với thông tin
6. MiniMap + Controls hoạt động (zoom, pan)
7. Resize < 768px → accordion view thay canvas
8. Filter by category → chỉ hiện node thuộc category đó
9. prefers-reduced-motion → edges không animated
10. `pnpm typecheck` passes
