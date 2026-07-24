'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function RootNode({ data }: NodeProps) {
  return (
    <div className="flex h-16 w-44 items-center justify-center rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue px-4 shadow-lg">
      <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
        {data.label as string}
      </p>
      <Handle type="source" position={Position.Right} className="!border-brand-blue" />
    </div>
  );
}
