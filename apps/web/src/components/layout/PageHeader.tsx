/** Consistent page header: small uppercase eyebrow + display title + subtitle. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="py-16">
      {eyebrow ? (
        <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">{subtitle}</p>
      ) : null}
    </header>
  );
}
