'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Status = 'idle' | 'sending' | 'success' | 'error';

/**
 * Contact form UI. Submits to `/api/contact` (implemented in Phase 6).
 * Includes a honeypot field (`company`) for basic spam protection.
 */
export function ContactForm() {
  const t = useTranslations('Contact');
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: new FormData(e.currentTarget),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('success');
      e.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30 dark:border-white/15 dark:bg-white/5 dark:text-white';

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* honeypot — hidden from users, bots fill it */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('name')}
          <input required name="name" type="text" className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('email')}
          <input required name="email" type="email" className={fieldClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('phone')}
          <input name="phone" type="tel" className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('subject')}
          <input name="subject" type="text" className={fieldClass} />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
        {t('message')}
        <textarea required name="message" rows={5} className={fieldClass} />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'sending' ? t('sending') : t('send')}
        </button>

        {status === 'success' ? (
          <p className="text-sm font-medium text-brand-green">{t('success')}</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm font-medium text-brand-red">{t('error')}</p>
        ) : null}
      </div>
    </form>
  );
}
