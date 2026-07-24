'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';

import { layoutTree, buildTreeData, type FlatProject, type FlatSection } from '@/lib/tree-layout';
import { RootNode } from './nodes/RootNode';
import { CategoryNode } from './nodes/CategoryNode';
import { ProjectNode } from './nodes/ProjectNode';
import { SectionNode } from './nodes/SectionNode';
import { ProjectDetailPanel } from './ProjectDetailPanel';

const nodeTypes: NodeTypes = {
  root: RootNode,
  category: CategoryNode,
  project: ProjectNode,
  section: SectionNode,
};

interface ProjectsTreeProps {
  projects: FlatProject[];
  sections: FlatSection[];
}

export function ProjectsTreeInner({ projects, sections }: ProjectsTreeProps) {
  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => buildTreeData(projects || [], sections || []),
    [projects, sections],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedProject, setSelectedProject] = useState<Node | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (rawNodes.length === 0) return;
    const { nodes: laidOut, edges: laidEdges } = layoutTree(rawNodes, rawEdges);
    setNodes(laidOut);
    setEdges(laidEdges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    const q = search.toLowerCase();
    return nodes.filter((n) => {
      const label = String(n.data?.label || '').toLowerCase();
      const client = String(n.data?.client || '').toLowerCase();
      return label.includes(q) || client.includes(q);
    });
  }, [nodes, search]);

  const filteredEdges = useMemo(() => {
    if (!search.trim()) return edges;
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [edges, filteredNodes, search]);

  const onNodeClickHandler = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'project') setSelectedProject(node);
    },
    [],
  );

  if (!projects || projects.length === 0) {
    return (
      <div className="grid place-items-center rounded-card bg-surface-card px-6 py-20 text-center shadow-card backdrop-blur-card">
        <p className="text-body text-secondary">
          No published projects yet. Check back later or{' '}
          <a href="#contact" className="text-brand-blue underline">contact us</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-input border border-black/10 bg-white/60 px-4 py-2 text-body-sm backdrop-blur focus:border-brand-blue focus:outline-none"
        />
      </div>

      <div className="flex gap-4">
        <div className="h-[500px] flex-1 overflow-hidden rounded-card bg-surface-card shadow-card backdrop-blur-card">
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClickHandler}
            fitView
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'root': return '#0099FF';
                  case 'category': return '#33B5FF';
                  case 'project': return '#00A651';
                  case 'section': return '#FF3333';
                  default: return '#ccc';
                }
              }}
            />
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {selectedProject && (
          <ProjectDetailPanel
            project={selectedProject.data}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </div>
    </div>
  );
}

export function ProjectsTree(props: ProjectsTreeProps) {
  return (
    <ReactFlowProvider>
      <ProjectsTreeInner {...props} />
    </ReactFlowProvider>
  );
}
