import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

/**
 * Apply dagre hierarchical layout to raw nodes/edges.
 * Left-to-right layout for the project tree.
 */
export function layoutTree(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR',
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 80,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const laidOutNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: laidOutNodes, edges };
}

/**
 * Build tree nodes and edges from database data.
 * Hierarchy: Root → Categories → Projects → Sections
 */
export interface FlatProject {
  id: string;
  slug: string;
  category: string;
  title: string;
  client?: string;
  location?: string;
  date?: string;
  description_vi?: string;
  description_en?: string;
  images: string[];
  parse_status: string;
}

export interface FlatSection {
  id: string;
  project_id: string;
  type: string;
  title_vi?: string;
  title_en?: string;
  sort_order: number;
  status: string;
}

export function buildTreeData(
  projects: FlatProject[],
  sections: FlatSection[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Root node
  nodes.push({
    id: 'root',
    type: 'root',
    position: { x: 0, y: 0 },
    data: { label: 'TEA Group' },
  });

  // Group projects by category
  const categories = new Map<string, FlatProject[]>();
  for (const project of projects) {
    const cat = project.category || 'other';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(project);
  }

  let catIndex = 0;
  for (const [category, catProjects] of categories) {
    const catId = `cat-${category}`;
    nodes.push({
      id: catId,
      type: 'category',
      position: { x: 0, y: 0 },
      data: { label: category },
    });
    edges.push({ id: `e-root-${catId}`, source: 'root', target: catId });
    catIndex++;

    for (const project of catProjects) {
      const projectId = `proj-${project.id}`;
      nodes.push({
        id: projectId,
        type: 'project',
        position: { x: 0, y: 0 },
        data: {
          label: project.title,
          client: project.client,
          description_vi: project.description_vi,
          description_en: project.description_en,
        },
      });
      edges.push({ id: `e-${catId}-${projectId}`, source: catId, target: projectId });

      // Child sections
      const projectSections = sections.filter((s) => s.project_id === project.id && s.status === 'published');
      for (const section of projectSections) {
        const sectionId = `sec-${section.id}`;
        nodes.push({
          id: sectionId,
          type: 'section',
          position: { x: 0, y: 0 },
          data: {
            label: section.title_vi || section.title_en || section.type,
            type: section.type,
          },
        });
        edges.push({
          id: `e-${projectId}-${sectionId}`,
          source: projectId,
          target: sectionId,
        });
      }
    }
  }

  return { nodes, edges };
}
