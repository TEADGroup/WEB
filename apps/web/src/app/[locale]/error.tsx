'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-brand-red/10 p-4">
        <svg className="h-12 w-12 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold text-slate-800">Something went wrong</h1>
      <p className="max-w-md text-body text-secondary">An unexpected error occurred.</p>
      <button onClick={reset} className="rounded-button bg-gradient-to-r from-brand-cyan to-brand-blue px-6 py-3 text-body-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02]">
        Try again
      </button>
    </div>
  );
}
