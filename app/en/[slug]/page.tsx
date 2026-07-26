import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PermitPage, { generateMetadata as dutchMetadata } from '@/app/[slug]/page';
import { PERMIT_SLUGS_EN, getPermitCopy } from '@/app/lib/permit-content';
import { alternatesFor } from '@/app/lib/i18n-routes';

export const revalidate = 3600;

/**
 * Only slugs with real English copy get an English page. A slug that exists in
 * Dutch but not in English is a 404 here, not a Dutch page under an English
 * URL — see getPermitCopy().
 */
export function generateStaticParams() {
  return PERMIT_SLUGS_EN.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const copy = getPermitCopy(slug, 'en');
  if (!copy) return {};

  return {
    title: { absolute: copy.metaTitle },
    description: copy.metaDescription,
    alternates: alternatesFor(`/${slug}`, 'en'),
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: `/en/${slug}`,
      type: 'website',
      locale: 'en',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: copy.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.metaTitle,
      description: copy.metaDescription,
      images: ['/opengraph-image'],
    },
  };
}

/**
 * Renders the same component as the Dutch page. The /en layout supplies the
 * locale, so the shared component resolves its copy from the English map.
 */
export default async function EnglishPermitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getPermitCopy(slug, 'en')) notFound();
  return <PermitPage params={params} locale="en" />;
}

// Keep the Dutch metadata helper referenced so a future refactor of it cannot
// silently diverge from this route without a type error.
export type _DutchMetadata = typeof dutchMetadata;
