# 🌳 Tree Components (React Flow)

**Purpose:** Interactive project tree using React Flow - Phase 3

---

## 📋 Overview

Thư mục này chứa **React Flow components** cho interactive project tree:
- Tree visualization (nodes + edges)
- Tree editor (drag & drop, edit)
- Custom node types
- Tree layout algorithms

---

## 🎯 Current Status

⏳ **TODO - Phase 3** (Project Tree)

---

## 📂 Planned Components

```
tree/
├── ProjectTree.tsx         # Main tree component
├── TreeNode.tsx            # Custom node component
├── TreeEdge.tsx            # Custom edge component
├── TreeToolbar.tsx         # Toolbar (zoom, fit, layout)
├── TreePanel.tsx           # Side panel (node details)
└── nodes/                  # Custom node types
    ├── ProjectNode.tsx     # Project node
    ├── CategoryNode.tsx    # Category node
    └── DocumentNode.tsx     # Document node
```

---

## ⚡ React Flow Setup

```typescript
'use client'; // Required!

import '@xyflow/react/dist/style.css'; // ⚠️ REQUIRED CSS import
import { ReactFlow, Background, Controls } from '@xyflow/react';

export function ProjectTree() {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}
```

---

## 🎨 Custom Node Types

```typescript
// Custom node component
function ProjectNode({ data }) {
  return (
    <div className="project-node">
      <div className="node-icon">{data.icon}</div>
      <div className="node-label">{data.label}</div>
    </div>
  );
}

// Register custom node
const nodeTypes = {
  project: ProjectNode,
  category: CategoryNode,
  document: DocumentNode,
};
```

---

## 🔧 Tree Layout (dagre)

```typescript
import dagre from 'dagre';

function layoutTree(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB' }); // Top to bottom
  
  // Add nodes and edges
  nodes.forEach(node => dagreGraph.setNode(node.id, { width: 200, height: 50 }));
  edges.forEach(edge => dagreGraph.setEdge(edge.source, edge.target));
  
  // Calculate layout
  dagre.layout(dagreGraph);
  
  // Apply positions
  return nodes.map(node => ({
    ...node,
    position: dagreGraph.node(node.position)
  }));
}
```

---

## 📱 Mobile Fallback

```typescript
// Mobile devices: Use accordion instead of tree
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function ProjectTree() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return <ProjectAccordion />; // Fallback
  }
  
  return <ReactFlowTree />; // Full tree
}
```

---

## 🔗 Related

- **Parent:** [`../`](../) - All components
- **React Flow docs:** https://reactflow.dev
- **@xyflow/react:** https://github.com/xyflow/xyflow (v12+)
- **dagre:** https://github.com/dagrejs/dagre (layout algorithm)
- **Tree data:** [`../../app/api/projects/`](../../app/api/projects/) - API endpoints

---

## 📚 Implementation Plan (Phase 3)

1. ✅ Setup React Flow (@xyflow/react v12)
2. ✅ Create basic tree component
3. ⏳ Create custom node types
4. ⏳ Implement dagre layout
5. ⏳ Add tree editing (CRUD)
6. ⏳ Add mobile accordion fallback
7. ⏳ Integrate with admin dashboard

---

*Last updated: 2026-07-22*
**Status:** Planned for Phase 3
**Package:** `@xyflow/react` v12 (not `reactflow`!)
