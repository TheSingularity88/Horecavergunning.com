import type { Metadata } from 'next';
import VergunningenHub from '@/app/vergunningen/page';
import { alternatesFor } from '@/app/lib/i18n-routes';
import { SITE_NAME } from '@/app/lib/site';

export const revalidate = 3600;

const title = 'Hospitality permits in Amsterdam | All permits & fixed fees';
const description =
  'Every hospitality permit we file for you: exploitatievergunning, alcohol licence, terrace permit, Bibob screening and more. A fixed fee per permit, known in advance.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: alternatesFor('/vergunningen', 'en'),
  openGraph: {
    title,
    description,
    url: '/en/vergunningen',
    siteName: SITE_NAME,
    locale: 'en',
    type: 'website',
  },
};

/**
 * The hub renders the same component as the Dutch page — the /en layout
 * supplies the locale. The path keeps the Dutch segment so the two URLs mirror
 * each other exactly, which is what makes the hreflang pairs and the language
 * switcher correct by construction.
 */
export default function EnglishVergunningenHub() {
  return <VergunningenHub locale="en" />;
}
