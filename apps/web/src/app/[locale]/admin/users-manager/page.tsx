'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { TableSkeleton } from '@/components/admin/SkeletonState';
import { useSwrFetch } from '@/lib/use-swr-fetch';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

function UsersTable() {
  const t = useTranslations('Admin');
  const { data, isLoading } = useSwrFetch<User[]>('/api/users');

  const users: User[] = Array.isArray(data) ? data : [];

  if (isLoading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-0.5 sm:space-y-1">
        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">
          {t('users')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Manage user access and permissions</p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-8 sm:p-12 text-center shadow-premium border border-white/20">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 mx-auto mb-3 sm:mb-4">
            <Users size={24} className="text-slate-300 sm:size-8" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400">{t('noData')}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/40 backdrop-blur-xl shadow-premium border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/10 bg-white/30">
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700">Email</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700">Role</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="border-b border-black/5 transition-colors hover:bg-white/50"
                  >
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm text-slate-800">{u.email}</td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <span className={`inline-block rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-[11px] sm:text-sm text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
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

export default function UsersManagerPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <UsersTable />
    </Suspense>
  );
}
