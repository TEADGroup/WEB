'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card3D } from '@/components/ui/Card3D';
import type { BlogPost } from '@/lib/blogs';

interface Props { posts: BlogPost[]; }

export function BlogSection({ posts }: Props) {
  const t = useTranslations('Blog');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    try {
      gsap.fromTo(el.querySelectorAll('.blog-card'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 78%', once: true } },
      );
    } catch (e) { console.warn('[BlogSection] GSAP animation skipped:', e); }
  }, []);

  if (!posts.length) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-14 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/40 via-white to-white" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const title = locale === 'vi' ? post.title_vi : post.title_en;
            const excerpt = locale === 'vi' ? post.excerpt_vi : post.excerpt_en;
            const date = post.published_at
              ? new Date(post.published_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })
              : '';

            return (
              <div key={post.id} className="blog-card">
                <Card3D>
                  <Link href={`/${locale}/blog/${post.slug}`} className="block p-6">
                    {/* Category badge */}
                    <span className="inline-block rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-blue">
                      {post.category}
                    </span>

                    {/* Title */}
                    <h3 className="mt-4 font-display text-base font-bold text-slate-800 line-clamp-2">
                      {title}
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3">
                      {excerpt}
                    </p>

                    {/* Meta */}
                    <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {t('readingTime', { minutes: post.reading_time_minutes })}
                      </span>
                    </div>

                    {/* Read more */}
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-blue">
                      {t('readMore')} <ArrowRight size={12} />
                    </div>
                  </Link>
                </Card3D>
              </div>
            );
          })}
        </div>

        {/* View all */}
        <div className="mt-12 text-center">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-brand-blue/30 hover:text-brand-blue hover:shadow-md"
          >
            {t('viewAll')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
