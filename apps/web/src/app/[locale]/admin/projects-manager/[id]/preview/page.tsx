'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PreviewProjectPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.push('/admin/projects-manager')} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-bold text-slate-800">Project Preview</h1>
      </div>
      <div className="rounded-card bg-surface-card p-6 shadow-card backdrop-blur-card">
        <p className="text-body text-secondary">Project preview will be available in the next update.</p>
      </div>
    </div>
  );
}
