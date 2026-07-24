'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

const SECTION_ICONS: Record<string, string> = {
  overview: '📋',
  equipment: '🔧',
  specs: '📊',
  operating: '▶️',
  maintenance: '🛠️',
  safety: '⚠️',
  other: '📄',
};

export function SectionNode({ data }: NodeProps) {
  const type = (data.type as string) || 'other';
  const icon = SECTION_ICONS[type] || '📄';

  return (
    <div className="flex w-40 items-center gap-2 rounded-lg bg-gradient-to-r from-brand-blue/5 to-brand-green/5 px-3 py-2 shadow-sm">
      <Handle type="target" position={Position.Left} className="!border-brand-green" />
      <span className="text-sm">{icon}</span>
      <p className="truncate text-xs font-medium text-slate-700">{data.label as string}</p>
      <Handle type="source" position={Position.Right} className="!border-brand-green" />
    </div>
  );
}
