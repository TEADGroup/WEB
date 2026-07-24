'use client';

import { useState } from 'react';
import { Clock, Trash2, ArrowUpRight, MessageSquare, Loader2 } from 'lucide-react';

interface RecentActivityProps {
  initialLogs: Array<Record<string, unknown>>;
}

export function RecentActivity({ initialLogs }: RecentActivityProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [clearing, setClearing] = useState(false);

  async function handleClear() {
    if (!confirm('Xoá tất cả hoạt động gần đây?')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/admin/clear-activity', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      } else {
        alert('Failed to clear activity.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex-1 min-h-0 rounded-2xl bg-white/40 backdrop-blur-xl p-3 sm:p-4 lg:p-5 border border-white/20 flex flex-col shadow-premium">
      <div className="shrink-0 mb-2 sm:mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-slate-900">
          Recent Activity
        </h2>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="text-[11px] sm:text-xs font-medium text-red-400 hover:text-red-500 transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              {clearing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              Clear
            </button>
          )}
          <button className="text-[11px] sm:text-xs font-medium text-brand-blue hover:text-brand-cyan transition-colors flex items-center gap-1">
            View all
            <ArrowUpRight size={13} className="sm:size-[14px]" />
          </button>
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 sm:space-y-2">
          {logs.map((log) => (
            <div key={String(log.id)}
              className="flex items-center gap-2.5 sm:gap-3 rounded-xl bg-white/30 px-2.5 sm:px-3 py-2 sm:py-2.5 transition-all hover:bg-white/50 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue/10 to-brand-cyan/10">
                <Clock size={14} className="text-brand-blue/60 sm:size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-700 truncate">
                  {String(log.action)} — {String(log.entity)}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  {new Date(String(log.created_at)).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 mb-2 sm:mb-3">
              <MessageSquare size={20} className="text-slate-300 sm:size-6" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400">No recent activity</p>
          </div>
        </div>
      )}
    </div>
  );
}
