import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-brand-blue/10 p-4">
        <svg className="h-12 w-12 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      <h1 className="font-display text-3xl font-bold text-slate-800">404 — Page not found</h1>

      <p className="max-w-md text-body text-secondary">
        The page you are looking for does not exist or has been moved.
        Please check the URL or return to the home page.
      </p>

      <Link
        href="/"
        className="rounded-button bg-gradient-to-r from-brand-cyan to-brand-blue px-6 py-3 text-body-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-transform hover:scale-[1.02]"
      >
        Back to home
      </Link>
    </div>
  );
}
