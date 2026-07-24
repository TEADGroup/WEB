import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getPostBySlug, incrementViewCount } from '@/lib/blogs';
import { Calendar, Clock, User } from 'lucide-react';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Increment view count (fire and forget)
  incrementViewCount(post.id).catch(() => {});

  const title = locale === 'vi' ? post.title_vi : post.title_en;
  const content = locale === 'vi' ? post.content_vi : post.content_en;
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Back link */}
      <a
        href={`/${locale}`}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-brand-blue"
      >
        ← {locale === 'vi' ? 'Về trang chủ' : 'Back to home'}
      </a>

      {/* Category */}
      <span className="inline-block rounded-full bg-brand-blue/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-blue">
        {post.category}
      </span>

      {/* Title */}
      <h1 className="mt-6 font-display text-3xl font-bold leading-tight text-slate-800 md:text-4xl">
        {title}
      </h1>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1.5"><Calendar size={14} /> {date}</span>
        <span className="flex items-center gap-1.5"><Clock size={14} /> {post.reading_time_minutes} min read</span>
        <span className="flex items-center gap-1.5"><User size={14} /> {post.author_name}</span>
      </div>

      {/* Featured image */}
      {post.featured_image && (
        <img
          src={post.featured_image}
          alt={title}
          className="mt-8 w-full rounded-2xl object-cover shadow-sm"
          style={{ maxHeight: '400px' }}
        />
      )}

      {/* Content */}
      <div
        className="mt-10 prose prose-slate max-w-none prose-headings:font-display prose-a:text-brand-blue"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
