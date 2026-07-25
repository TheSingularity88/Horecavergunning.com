import { SITE_URL, SITE_NAME } from '@/app/lib/site';

/**
 * Server-rendered JSON-LD block.
 *
 * `/vergunningen`, `/blog` and `/contact` previously emitted no structured data
 * at all, so search and answer engines had to infer what those pages were from
 * the prose. Every node here points at the same Organization @id declared on
 * the homepage rather than re-declaring the business, which keeps us as one
 * entity in the knowledge graph instead of several partial ones.
 */
export function JsonLd({ graph }: { graph: Record<string, unknown>[] }) {
  const jsonLd = { '@context': 'https://schema.org', '@graph': graph };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export const ORGANIZATION_REF = { '@id': `${SITE_URL}/#organization` };

/** BreadcrumbList for a page one level below the homepage. */
export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      ...items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
    ],
  };
}

/** The site's collection of permit services, for the /vergunningen hub. */
export function permitCollection(
  permits: { slug: string; name: string; description: string; priceCents?: number | null }[]
) {
  return {
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/vergunningen#collection`,
    name: `Horecavergunningen aanvragen | ${SITE_NAME}`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ORGANIZATION_REF,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: permits.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Service',
          '@id': `${SITE_URL}/${p.slug}#service`,
          name: p.name,
          description: p.description,
          url: `${SITE_URL}/${p.slug}`,
          provider: ORGANIZATION_REF,
          areaServed: { '@type': 'City', name: 'Amsterdam' },
          // Only advertise a price when we actually have one — a fabricated or
          // zero Offer is worse than none.
          ...(p.priceCents
            ? {
                offers: {
                  '@type': 'Offer',
                  price: (p.priceCents / 100).toFixed(2),
                  priceCurrency: 'EUR',
                  url: `${SITE_URL}/${p.slug}`,
                },
              }
            : {}),
        },
      })),
    },
  };
}
