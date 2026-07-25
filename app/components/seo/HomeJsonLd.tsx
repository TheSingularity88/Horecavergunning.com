import { translations } from '@/app/lib/translations';
import { SITE_URL, SITE_NAME } from '@/app/lib/site';

interface Nap {
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Server-rendered JSON-LD for the homepage.
 * - Organization + FAQPage are always emitted (FAQ pulled from the NL copy).
 * - LocalBusiness is only emitted once real contact/address data is provided
 *   (via admin settings) — fake NAP in structured data hurts SEO.
 */
export function HomeJsonLd({ nap }: { nap?: Nap }) {
  const faq = translations.nl.faq;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      // A stable @id lets the other nodes (and other pages) reference this one
      // entity instead of each re-declaring a nameless organisation.
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        'Wij verzorgen horecavergunningen voor Nederlandse ondernemers: exploitatievergunning, alcoholvergunning, terrasvergunning en Bibob.',
      areaServed: { '@type': 'City', name: 'Amsterdam' },
      knowsAbout: [
        'Exploitatievergunning',
        'Alcoholvergunning',
        'Terrasvergunning',
        'Wet Bibob',
        'Horeca-overname',
        'Gebruiksvergunning',
      ],
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon` },
      image: `${SITE_URL}/opengraph-image`,
      ...(nap?.email ? { email: nap.email } : {}),
      ...(nap?.phone ? { telephone: nap.phone } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'nl-NL',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];

  // Only add LocalBusiness when a real address is configured.
  if (nap?.address) {
    graph.push({
      '@type': 'ProfessionalService',
      name: SITE_NAME,
      url: SITE_URL,
      areaServed: { '@type': 'City', name: 'Amsterdam' },
      address: { '@type': 'PostalAddress', streetAddress: nap.address, addressLocality: 'Amsterdam', addressCountry: 'NL' },
      ...(nap.phone ? { telephone: nap.phone } : {}),
      ...(nap.email ? { email: nap.email } : {}),
    });
  }

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
