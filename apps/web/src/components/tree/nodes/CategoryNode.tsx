'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

const CATEGORY_COLORS: Record<string, string> = {
 'line-automation': 'border-brand-blue text-brand-blue',
 'control-cabinets': 'border-brand-green text-brand-green',
 'plc-scada': 'border-brand-red text-brand-red',
 'system-integration': 'border-purple-500 text-purple-500',
 maintenance: 'border-amber-500 text-amber-500',
};

export function CategoryNode({ data }: NodeProps) {
 const colorClass = CATEGORY_COLORS[data.label as string] || 'border-slate-400 text-slate-500';

 return (
 <div className={`flex h-12 w-44 items-center justify-center rounded-lg border-l-4 bg-white/80 px-3 shadow-sm backdrop-blur ${colorClass}`}>
 <Handle type="target" position={Position.Left} className="!border-slate-400" />
 <p className="text-xs font-bold uppercase tracking-wide">{data.label as string}</p>
 <Handle type="source" position={Position.Right} className="!border-slate-400" />
 </div>
 );
}
