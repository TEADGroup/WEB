'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/#about' },
  { key: 'solutions', href: '/#solutions' },
  { key: 'projects', href: '/#projects' },
  { key: 'contact', href: '/#contact' },
] as const;

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setActive(e.target.id); break; }
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

export function PublicHeader() {
  const t = useTranslations('Nav');
  const [showMobile, setShowMobile] = useState(false);
  const closeMobile = () => setShowMobile(false);
  const activeSection = useActiveSection(['home', 'about', 'solutions', 'projects', 'contact']);

  return (
    <header className="sticky top-0 z-40 shadow-sm bg-white/40 backdrop-blur-nav">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="TEA Co., Ltd — home">
          <Image
            src="/images/logo.png"
            alt="TEA Co., Ltd"
            width={910}
            height={894}
            priority
            className="h-9 w-auto"
          />
          <span className="hidden font-display text-lg font-bold uppercase tracking-wide sm:inline">
            TEA Co., Ltd
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center justify-center gap-1 lg:flex">
          {NAV.map((item) => {
            const isActive = activeSection === item.key || (item.key === 'home' && activeSection === '');
            return (
              <Link
                key={item.key}
                href={item.href}
                data-active={isActive || undefined}
                className="rounded-md px-4 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-black/5 hover:text-brand-blue data-[active]:text-brand-blue data-[active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
        </div>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setShowMobile(!showMobile)}
          aria-label={showMobile ? 'Close navigation' : 'Open navigation'}
          aria-expanded={showMobile}
          className="lg:hidden ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-black/5"
        >
          {showMobile ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav — CSS transition for max-height + opacity */}
      <div
        className={`overflow-hidden border-t border-black/5 px-4 lg:hidden transition-[max-height,opacity,padding] duration-300 ease-in-out ${
          showMobile
            ? 'max-h-[500px] opacity-100 pb-4 pt-3'
            : 'max-h-0 opacity-0 pb-0 pt-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') closeMobile(); }}
      >
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={closeMobile}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="mt-4 flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
