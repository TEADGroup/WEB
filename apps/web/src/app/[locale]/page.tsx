import { setRequestLocale } from 'next-intl/server';
import { HomeClient } from '@/components/home/HomeClient';
import { getPublishedPosts } from '@/lib/blogs';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const blogPosts = await getPublishedPosts(locale, undefined, 3);

  return (
    <HomeClient
      blogPosts={blogPosts}
    />
  );
}
