CREATE TYPE blog_category AS ENUM (
  'technology', 'case-study', 'technical-guide', 'industry-news', 'company-news'
);

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category blog_category NOT NULL DEFAULT 'technology',
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_vi TEXT NOT NULL,
  excerpt_en TEXT NOT NULL,
  content_vi TEXT NOT NULL,
  content_en TEXT NOT NULL,
  featured_image TEXT,
  tags TEXT[],
  reading_time_minutes INTEGER DEFAULT 5,
  author_name TEXT DEFAULT 'TEA Group',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  view_count INTEGER DEFAULT 0
);

CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_published_blog" ON blog_posts
  FOR SELECT TO anon USING (status = 'published');

CREATE POLICY "admin_all_blog" ON blog_posts
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE OR REPLACE FUNCTION increment_blog_view_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$;
