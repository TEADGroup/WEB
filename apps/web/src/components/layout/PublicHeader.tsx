'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'solutions', href: '/solutions' },
  { key: 'projects', href: '/projects' },
  { key: 'news', href: '/news' },
  { key: 'careers', href: '/careers' },
  { key: 'contact', href: '/contact' },
] as const;

export function PublicHeader() {
  const t = useTranslations('Nav');

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label="TEA Group — home">
          <Image
            src="/images/logo.png"
            alt="TEA Group"
            width={910}
            height={894}
            priority
            className="h-9 w-auto"
          />
          <span className="hidden font-display text-lg font-bold uppercase tracking-wide sm:inline">
            TEA Group
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-white/10"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
