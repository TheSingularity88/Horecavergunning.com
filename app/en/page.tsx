import type { Metadata } from 'next';
import Home from '@/app/page';
import { alternatesFor } from '@/app/lib/i18n-routes';
import { SITE_NAME } from '@/app/lib/site';

// Same revalidation contract as the Dutch homepage.
export const revalidate = 3600;

const title =
  'Hospitality Permits in Amsterdam | HorecaVergunning.com';
const description =
  'Opening or taking over a venue in Amsterdam? We prepare and file your exploitatievergunning, alcohol licence, terrace permit and Bibob screening for a fixed fee per permit.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: alternatesFor('/', 'en'),
  openGraph: {
    title,
    description,
    url: '/en',
    siteName: SITE_NAME,
    locale: 'en',
    type: 'website',
  },
};

/**
 * The English homepage renders the SAME component tree as the Dutch one — the
 * /en layout supplies the locale, so every string resolves from the English
 * translations. Duplicating the markup would guarantee the two drift apart.
 */
export default function EnglishHome() {
  return <Home />;
}
