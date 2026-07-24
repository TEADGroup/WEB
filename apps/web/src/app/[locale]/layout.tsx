import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { isLocale, routing } from '@/i18n/routing';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { JsonLd } from '@/components/layout/JsonLd';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://teagroup.vn';

  return {
    title: { default: 'TEA Co., Ltd', template: '%s · TEA Co., Ltd' },
    description:
      locale === 'vi'
        ? 'TEA Co., Ltd — tự động hoá công nghiệp & điện tự động. Giải pháp kỹ thuật tích hợp cho nhà máy và công trình.'
        : 'TEA Co., Ltd — industrial automation & electrical control. Integrated engineering solutions for factories and facilities.',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        vi: '/vi',
        en: '/en',
      },
    },
    openGraph: {
      title: 'TEA Co., Ltd',
      description:
        locale === 'vi'
          ? 'Tự động hoá công nghiệp & điện tự động'
          : 'Industrial Automation & Electrical Control',
      url: `/${locale}`,
      siteName: 'TEA Co., Ltd',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'TEA Co., Ltd',
      description: 'Industrial Automation & Electrical Control',
    },
    icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co';

  return (
    <html lang={locale} className={`${inter.variable} ${display.variable}`}>
      <head>
        <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={supabaseUrl} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-sans antialiased">
        <JsonLd />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <NextIntlClientProvider messages={messages}>
          <PublicHeader />
          <main id="main-content" className="mx-auto w-full">{children}</main>
          <PublicFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
