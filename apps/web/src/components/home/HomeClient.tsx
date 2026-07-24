'use client';

import { useLocale } from 'next-intl';
import { HeroSection } from './sections/HeroSection';
import { PainPointsSection } from './sections/PainPointsSection';
import { SolutionsSection } from './sections/SolutionsSection';
import { Industry4Section } from './sections/Industry4Section';
import { StatsSection } from './sections/StatsSection';
import { FeaturedProjectsSection } from './sections/FeaturedProjectsSection';
import { BlogSection } from './sections/BlogSection';
import { ContactSection } from './sections/ContactSection';
import type { BlogPost } from '@/lib/blogs';

interface HomeClientProps {
  blogPosts?: BlogPost[];
}

export function HomeClient({ blogPosts = [] }: HomeClientProps) {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <PainPointsSection />
      <SolutionsSection />
      <Industry4Section />
      <StatsSection />
      <FeaturedProjectsSection />
      <BlogSection posts={blogPosts} />
      <ContactSection />
    </div>
  );
}
