'use client';

import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Plus, Edit, ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { TableSkeleton } from '@/components/admin/SkeletonState';
import { useSwrFetch } from '@/lib/use-swr-fetch';

interface Project {
  id: string;
  title: string;
  status: string;
  category: string;
  created_at: string;
}

interface ProjectsResponse {
  projects: Project[];
}

function ProjectsTable() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const { data, isLoading, mutate } = useSwrFetch<Project[] | ProjectsResponse>('/api/projects');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const projects: Project[] = Array.isArray(data) ? data : (data as ProjectsResponse)?.projects ?? [];

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      // Optimistic update: remove the deleted project from cache
      mutate((prev) => {
        const prevList = Array.isArray(prev) ? prev : (prev as ProjectsResponse)?.projects ?? [];
        return (prevList as Project[]).filter(p => p.id !== id) as any;
      }, false);
    } catch (err) {
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">
            {t('projects')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Manage your automation projects</p>
        </div>
        <Link
          href="/admin/projects-manager/create"
          className="self-start sm:self-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        >
          <Plus size={15} />
          {t('create')}
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-8 sm:p-12 text-center shadow-premium border border-white/20">
          <div className="inline-flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 mb-3 sm:mb-4">
            <ExternalLink size={24} className="text-slate-300 sm:size-8" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400">{t('noData')}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/40 backdrop-blur-xl shadow-premium border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/10 bg-white/30">
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700">Title</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700">Category</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700">Status</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p, index) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="border-b border-black/5 transition-colors hover:bg-white/50"
                  >
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm text-slate-800">{p.title}</td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-[11px] sm:text-sm text-slate-500">{p.category}</td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <span className={`inline-block rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold ${
                        p.status === 'published' ? 'bg-brand-green/10 text-brand-green'
                        : p.status === 'draft' ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <button
                        onClick={() => router.push(`/admin/projects-manager/${p.id}`)}
                        className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition-all hover:bg-brand-blue/10 hover:text-brand-blue active:scale-90"
                        title="Edit"
                      >
                        <Edit size={13} className="sm:size-[15px]" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/projects-manager/${p.id}/preview`)}
                        className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition-all hover:bg-brand-blue/10 hover:text-brand-blue active:scale-90"
                        title="Preview"
                      >
                        <ExternalLink size={13} className="sm:size-[15px]" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        disabled={deletingId === p.id}
                        className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50 active:scale-90"
                        title="Delete"
                      >
                        <Trash2 size={13} className="sm:size-[15px]" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsManagerPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <ProjectsTable />
    </Suspense>
  );
}
