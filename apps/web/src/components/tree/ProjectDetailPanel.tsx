'use client';

import { X } from 'lucide-react';

interface ProjectData {
  label?: string;
  client?: string;
  description_vi?: string;
  description_en?: string;
}

interface ProjectDetailPanelProps {
  project: Record<string, unknown>;
  onClose: () => void;
}

export function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  const p = project as ProjectData;

  return (
    <div className="w-72 shrink-0 rounded-card bg-surface-card p-5 shadow-card backdrop-blur-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-primary">{p.label}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-black/5"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2 text-xs text-secondary">
        {p.client && (
          <p>
            <span className="font-semibold text-muted">Client:</span> {p.client}
          </p>
        )}
        {p.description_vi && <p className="text-secondary">{p.description_vi}</p>}
        {p.description_en && <p className="italic text-muted">{p.description_en}</p>}
      </div>

      {!p.client && !p.description_vi && (
        <p className="text-xs text-muted">No additional details.</p>
      )}
    </div>
  );
}
