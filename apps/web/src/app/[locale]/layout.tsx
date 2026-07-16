import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { isLocale, routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { NoFlashScript } from '@/components/layout/NoFlashScript';
import { ThemeBackground } from '@/components/layout/ThemeBackground';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'TEA Group', template: '%s · TEA Group' },
  description:
    'TEA Group — tự động hoá công nghiệp & điện tự động. Giải pháp kỹ thuật tích hợp cho nhà máy và công trình.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  icons: { icon: '/images/logo.png', apple: '/images/logo.png' },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
  // Enable static rendering per locale.
  setRequestLocale(locale);
  // Forward the full message bundle to client components (header/toggle/etc.).
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* Runs synchronously before paint to set the time-of-day background
            variables — prevents a flash of the SSR `day` default. */}
        <NoFlashScript />
        {/* Forwards server messages to client components (LanguageSwitcher,
            ThemeToggle, PublicHeader). */}
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <ThemeBackground />
            <PublicHeader />
            <main className="mx-auto w-full max-w-7xl px-4">{children}</main>
            <PublicFooter />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
