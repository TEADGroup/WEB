'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, Settings, LogOut,
  ChevronLeft, Menu, X, MessageSquare,
  Sparkles, Route,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/50'
  },
  {
    key: 'projects',
    href: '/admin/projects-manager',
    icon: FolderKanban,
    gradient: 'from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/50'
  },
  {
    key: 'hdvhUpload',
    href: '/admin/hdvh-upload',
    icon: Route,
    gradient: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/50'
  },
  {
    key: 'aiChat',
    href: '/admin/ai-chat',
    icon: MessageSquare,
    gradient: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/50'
  },
  {
    key: 'users',
    href: '/admin/users-manager',
    icon: Users,
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/50'
  },
  {
    key: 'settings',
    href: '/admin/settings',
    icon: Settings,
    gradient: 'from-slate-500 to-gray-500',
    glow: 'shadow-slate-500/50'
  },
] as const;

function getActiveKey(pathname: string): string {
  const path = pathname.replace(/^\/(vi|en)\//, '');
  if (path.startsWith('admin/dashboard')) return 'dashboard';
  if (path.startsWith('admin/projects-manager')) return 'projects';
  if (path.startsWith('admin/hdvh-upload')) return 'hdvhUpload';
  if (path.startsWith('admin/ai-chat')) return 'aiChat';
  if (path.startsWith('admin/users-manager')) return 'users';
  if (path.startsWith('admin/settings')) return 'settings';
  return 'dashboard';
}

export function PremiumAdminSidebar() {
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
    <div className="flex h-full flex-col min-h-0">
      {/* Logo section - pinned top */}
      <div className="shrink-0 flex items-center justify-between px-3 pt-4 pb-3 sm:px-4 sm:pt-5 sm:pb-4">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 sm:gap-3"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan shadow-lg shadow-brand-blue/30">
                <Sparkles size={18} className="text-white sm:size-5" />
              </div>
              <div>
                <span className="font-display text-sm sm:text-base lg:text-lg font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-slate-800 leading-tight">
                  TEA
                </span>
                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider leading-tight">Admin Panel</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <motion.button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 opacity-60 transition-all hover:bg-black/5 hover:text-slate-600 hover:opacity-100 lg:block"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft
              size={16}
              className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
          </motion.button>
        )}

        {/* Expand button — visible only when collapsed */}
        {collapsed && (
          <motion.button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 opacity-60 transition-all hover:bg-black/5 hover:text-slate-600 hover:opacity-100 lg:block"
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ChevronLeft
              size={16}
              className="rotate-180"
            />
          </motion.button>
        )}
      </div>

      {/* Navigation - scrollable when overflow */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-3 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map(({ key, href, icon: Icon, gradient, glow }, index) => {
          const isActive = activeKey === key;

          return (
            <Link
              key={key}
              href={href}
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className="group relative block"
            >
              <div
                className={`relative flex items-center gap-2.5 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-r ${gradient} text-white shadow-md ${glow}`
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white/90"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-white/15 blur-sm" />
                  )}
                  <Icon
                    size={18}
                    className={`relative z-10 transition-all duration-200 ${
                      isActive ? 'text-white drop-shadow' : 'text-slate-400 group-hover:text-slate-500'
                    }`}
                  />
                </div>

                {/* Label */}
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 font-medium text-xs sm:text-sm whitespace-nowrap"
                    >
                      {t(key)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions - pinned bottom */}
      <div className="shrink-0 border-t border-black/[0.05] px-2 sm:px-3 py-3 space-y-1 sm:space-y-1.5">
        <Link
          href="/"
          className="group flex items-center gap-2.5 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-400 transition-all hover:bg-white/40 hover:text-slate-600"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5 shrink-0" />
          {!collapsed && <span>{t('backToSite')}</span>}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-2.5 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-red-400 transition-all hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={16} className="shrink-0 transition-transform group-hover:scale-105" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <motion.button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-2.5 left-2.5 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-lg shadow-black/5 backdrop-blur border border-black/[0.06] lg:hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {mobileOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={16} className="text-slate-600" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={16} className="text-slate-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex lg:hidden"
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-64 sm:w-72 bg-white/95 backdrop-blur-2xl shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
            <div
              className="flex-1 bg-black/15 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden h-screen shrink-0 border-r border-black/[0.04] bg-white/60 backdrop-blur-xl lg:flex lg:flex-col overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}