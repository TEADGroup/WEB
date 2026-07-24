import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { PremiumStatCard } from '@/components/admin/PremiumStatCard';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { FolderKanban, CheckCircle, FileText, MessageSquare } from 'lucide-react';
import { Suspense as ReactSuspense } from 'react';

// Cache dashboard stats for 60 seconds for the same request
interface DashboardStats {
  totalProjects: number;
  publishedProjects: number;
  draftSections: number;
  newMessages: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDashboardStats(supabase: any): Promise<DashboardStats> {
  const queries = [
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('project_sections').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
  ];

  const [
    { count: total },
    { count: published },
    { count: draft },
    { count: messages },
  ] = await Promise.all(queries);

  return {
    totalProjects: total ?? 0,
    publishedProjects: published ?? 0,
    draftSections: draft ?? 0,
    newMessages: messages ?? 0,
  };
}

// Dashboard Static Content - no motion/animations, just pure data
async function DashboardContent() {
  const t = await getTranslations('Admin');
  const supabase = await createSupabaseServerClient();

  // Run stats + audit log in parallel with revalidate options
  const [stats, { data: recentAudit }] = await Promise.all([
    getDashboardStats(supabase),
    supabase.from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const statCards = [
    {
      label: t('projects'),
      value: stats.totalProjects,
      color: 'text-brand-blue',
      trend: 'up' as const,
      trendValue: '+12%',
      icon: <FolderKanban className="text-brand-blue" size={24} />
    },
    {
      label: 'Published',
      value: stats.publishedProjects,
      color: 'text-brand-green',
      trend: 'up' as const,
      trendValue: '+8%',
      icon: <CheckCircle className="text-brand-green" size={24} />
    },
    {
      label: 'Draft sections',
      value: stats.draftSections,
      color: 'text-amber-500',
      trend: 'down' as const,
      trendValue: '-3%',
      icon: <FileText className="text-amber-500" size={24} />
    },
    {
      label: 'New messages',
      value: stats.newMessages,
      color: 'text-brand-red',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: <MessageSquare className="text-brand-red" size={24} />
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-3 sm:space-y-4 min-h-0">
      {/* Header */}
      <div className="shrink-0 space-y-0.5 sm:space-y-1">
        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">
          {t('dashboard')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Welcome back &middot; Here&rsquo;s your overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4 shrink-0">
        {statCards.map((card, index) => (
          <PremiumStatCard
            key={card.label}
            {...card}
            delay={index * 0.08}
          />
        ))}
      </div>

      {/* Activity feed - fills remaining space */}
      <RecentActivity initialLogs={recentAudit ?? []} />
    </div>
  );
}

export default async function AdminDashboardPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <ReactSuspense fallback={<AdminLoadingState />}>
        <DashboardContent />
      </ReactSuspense>
    </div>
  );
}
