import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface BlogPost {
  id: string;
  slug: string;
  category: string;
  title_vi: string;
  title_en: string;
  excerpt_vi: string;
  excerpt_en: string;
  content_vi: string;
  content_en: string;
  featured_image: string | null;
  tags: string[] | null;
  reading_time_minutes: number;
  author_name: string;
  published_at: string | null;
  view_count: number;
}

export async function getPublishedPosts(
  locale: string,
  category?: string,
  limit: number = 6,
): Promise<BlogPost[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }

  const { data } = await query;
  return (data || []) as BlogPost[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  return data as BlogPost | null;
}

export async function incrementViewCount(postId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  // @ts-expect-error - Supabase rpc type inference limitation
  await supabase.rpc('increment_blog_view_count', { post_id: postId });
}
