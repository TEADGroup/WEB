interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** @default 'h2' — only the hero section should use h1 */
  level?: 'h1' | 'h2';
}

export function PageHeader({ eyebrow, title, subtitle, level = 'h2' }: PageHeaderProps) {
  const HeadingTag = level;

  return (
    <header className="py-10 md:py-16">
      {eyebrow ? (
        <p className="mb-3 font-display text-eyebrow uppercase text-brand-blue">
          {eyebrow}
        </p>
      ) : null}
      <HeadingTag className="font-display text-heading-1 font-bold tracking-tight text-slate-800">
        {title}
      </HeadingTag>
      {subtitle ? (
        <p className="mt-4 max-w-2xl text-body-lg text-secondary">{subtitle}</p>
      ) : null}
    </header>
  );
}
