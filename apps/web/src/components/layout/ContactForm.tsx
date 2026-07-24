'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'idle' | 'sending' | 'success' | 'error';

export function ContactForm() {
  const t = useTranslations('Contact');
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', { method: 'POST', body: new FormData(e.currentTarget) });
      if (!res.ok) throw new Error('request failed');
      setStatus('success');
      e.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  }

  const fieldClass =
    'w-full rounded-input border border-slate-200 bg-white/80 px-3 py-2.5 text-body-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-muted hover:border-brand-blue/30 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:bg-white';

  return (
    <div className="relative rounded-2xl border border-slate-100 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-brand-blue/40 via-brand-cyan/30 to-brand-green/20" />

      <form onSubmit={onSubmit} className="grid gap-4">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0" />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-body-sm font-medium text-primary">
            {t('name')}
            <input required name="name" type="text" className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-body-sm font-medium text-primary">
            {t('email')}
            <input required name="email" type="email" className={fieldClass} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-body-sm font-medium text-primary">
            {t('phone')}
            <input name="phone" type="tel" className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-body-sm font-medium text-primary">
            {t('subject')}
            <input name="subject" type="text" className={fieldClass} />
          </label>
        </div>

        <label className="grid gap-1.5 text-body-sm font-medium text-primary">
          {t('message')}
          <textarea required name="message" rows={5} className={fieldClass} />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="group relative rounded-button bg-gradient-to-r from-brand-cyan to-brand-blue px-6 py-3 text-body-sm font-semibold text-white shadow-md shadow-brand-blue/15 transition-all duration-300 hover:shadow-lg hover:shadow-brand-blue/25 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 overflow-hidden"
          >
            <span className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative flex items-center gap-2">
              {status === 'sending' ? (
                <><Loader2 size={16} className="animate-spin" /> {t('sending')}</>
              ) : (
                <><Send size={16} /> {t('send')}</>
              )}
            </span>
          </button>

          {status === 'success' && (
            <p className="flex items-center gap-1.5 text-body-sm font-medium text-brand-green">
              <CheckCircle size={16} /> {t('success')}
            </p>
          )}
          {status === 'error' && (
            <p className="flex items-center gap-1.5 text-body-sm font-medium text-brand-red">
              <AlertCircle size={16} /> {t('error')}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
