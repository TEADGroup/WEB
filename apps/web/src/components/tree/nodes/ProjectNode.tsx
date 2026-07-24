'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function ProjectNode({ data }: NodeProps) {
  const label = data?.label as string | undefined;
  const client = data?.client as string | undefined;
  const descVi = data?.description_vi as string | undefined;

  return (
    <div className="w-52 rounded-xl bg-white shadow-card backdrop-blur transition-shadow hover:shadow-card-hover">
      <Handle type="target" position={Position.Left} className="!border-brand-blue" />
      <div className="border-b border-black/10 px-4 py-3">
        <p className="font-display text-sm font-semibold text-slate-800">{label}</p>
        {client && <p className="text-xs text-slate-500">{client}</p>}
      </div>
      {descVi && (
        <p className="px-4 py-2 text-xs text-slate-500 line-clamp-2">{descVi}</p>
      )}
      <Handle type="source" position={Position.Right} className="!border-brand-blue" />
    </div>
  );
}
