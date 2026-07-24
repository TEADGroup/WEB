'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import {
  LayoutDashboard, FolderKanban, Users, Settings, LogOut,
  ChevronLeft, Menu, X, FileUp, MessageSquare,
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'projects', href: '/admin/projects-manager', icon: FolderKanban },
  { key: 'hdvhUpload', href: '/admin/hdvh-upload', icon: FileUp },
  { key: 'aiChat', href: '/admin/ai-chat', icon: MessageSquare },
  { key: 'users', href: '/admin/users-manager', icon: Users },
  { key: 'settings', href: '/admin/settings', icon: Settings },
] as const;

function getActiveKey(pathname: string): string {
  const path = pathname.replace(/^\/(vi|en)\//, '');
  if (path.startsWith('admin/dashboard')) return 'dashboard';
  if (path.startsWith('admin/projects-manager')) return 'projects';
  if (path.startsWith('admin/hdvh-upload')) return 'hdvhUpload';
  if (path.startsWith('admin/users-manager')) return 'users';
  if (path.startsWith('admin/settings')) return 'settings';
  if (path.startsWith('admin/ai-chat')) return 'aiChat';
  return 'dashboard';
}

export function AdminSidebar() {
  const t = useTranslations('Admin');
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeKey = getActiveKey(pathname);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const sidebarContent = (
    <div className="flex h-full flex-col gap-1">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        {!collapsed && (
          <span className="font-display text-lg font-bold uppercase tracking-[0.15em] text-slate-800">
            TEA Admin
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 lg:block"
        >
          <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const isActive = activeKey === key;
          return (
            <Link
              key={key}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-brand-blue'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-blue/10 to-brand-cyan/10 shadow-inner" />
              )}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl opacity-0 bg-black/[0.03] transition-opacity duration-200 group-hover:opacity-100" />
              )}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-brand-blue to-brand-cyan" />
              )}
              <Icon
                size={18}
                className={`shrink-0 transition-all duration-200 ${
                  isActive
                    ? 'text-brand-blue drop-shadow-[0_0_6px_rgba(0,153,255,0.3)]'
                    : 'text-slate-400 group-hover:scale-105'
                }`}
              />
              {!collapsed && (
                <span className="relative z-10">{t(key)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/[0.06] px-2 py-3">
        <Link
          href="/"
          className="group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-black/[0.03] hover:text-slate-600"
        >
          <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          {!collapsed && <span>{t('backToSite')}</span>}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
          {!collapsed && <span className="relative z-10">{t('logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-lg shadow-black/5 backdrop-blur border border-black/[0.06] lg:hidden"
      >
        {mobileOpen ? <X size={18} className="text-slate-600" /> : <Menu size={18} className="text-slate-600" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-64 bg-white/95 backdrop-blur-2xl shadow-2xl">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <aside
        className={`hidden h-screen shrink-0 border-r border-black/[0.04] bg-gradient-to-b from-white/50 to-white/30 backdrop-blur-xl transition-all duration-300 ease-out lg:flex lg:flex-col ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
