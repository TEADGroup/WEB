'use client';

import { useTranslations } from 'next-intl';
import { useTimeOfDay } from '@/components/theme/ThemeProvider';
import type { ThemeOverride } from '@/lib/theme';

const OPTIONS: ThemeOverride[] = ['auto', 'light', 'dark'];

/** Segmented control: Auto / Light / Dark. */
export function ThemeToggle() {
  const t = useTranslations('Theme');
  const { override, setOverride, mounted } = useTimeOfDay();

  // Placeholder skeleton until the client mounts (avoids hydration mismatch
  // because the active state depends on localStorage).
  if (!mounted) {
    return <div className="h-8 w-28 animate-pulse rounded-full bg-black/5" aria-hidden="true" />;
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="inline-flex rounded-full border border-black/10 bg-white/40 p-0.5 backdrop-blur dark:border-white/15 dark:bg-white/5"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setOverride(opt)}
          aria-pressed={override === opt}
          data-active={override === opt}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors data-[active=true]:bg-brand-cyan data-[active=true]:text-white dark:text-slate-300"
        >
          {t(opt)}
        </button>
      ))}
    </div>
  );
}
