import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Wire next-intl's request config (messages loader). Path is relative to the
// project root of this app.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Consume the internal workspace package as raw TS (no build step needed).
  transpilePackages: ['@tea/shared'],
  // pdf-parse ships a bundled worker (pdf.worker.mjs) that webpack cannot
  // resolve when it's inside a pnpm-hoisted node_modules tree.  Excluding it
  // from the server bundle lets it resolve its worker via native Node.js
  // require() at runtime instead.
  serverExternalPackages: ['pdf-parse'],
  // ⚡ Bundle optimization — tree-shake the heavy packages aggressively
  experimental: {
    optimizePackageImports: ['lucide-react', '@xyflow/react'],
  },
  images: {
    remotePatterns: [
      // Supabase Storage public URLs (project images, logos).
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default withNextIntl(nextConfig);
