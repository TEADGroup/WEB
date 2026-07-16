import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Wire next-intl's request config (messages loader). Path is relative to the
// project root of this app.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Consume the internal workspace package as raw TS (no build step needed).
  transpilePackages: ['@tea/shared'],
  images: {
    remotePatterns: [
      // Supabase Storage public URLs (project images, logos).
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default withNextIntl(nextConfig);
