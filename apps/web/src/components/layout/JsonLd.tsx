/** Structured data (JSON-LD) for SEO — injected in the root layout <head>. */
export function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://teagroup.vn';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Corporation',
    name: 'TEA Co., Ltd',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description:
      'Industrial automation & electrical control solutions. Control cabinets, PLC/SCADA, system integration, and technical support.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '294/41/18 Street No. 8, Thong Tay Hoi Ward',
      addressLocality: 'Ho Chi Minh City',
      addressCountry: 'VN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+84-28-XXXX-XXXX',
      contactType: 'sales',
    },
    sameAs: [
      // Add LinkedIn, Facebook etc. URLs here when available
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
