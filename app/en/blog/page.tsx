import type { Metadata } from 'next';
import BlogIndex from '@/app/blog/page';
import { alternatesFor } from '@/app/lib/i18n-routes';
import { SITE_NAME } from '@/app/lib/site';

const title = 'Hospitality Knowledge & News';
const description =
  'Guidance on hospitality permits in the Netherlands: what you need, what it costs, and how the Bibob screening works. Written for owners opening or taking over a venue.';

export const metadata: Metadata = {
  title: { absolute: `${title} | ${SITE_NAME}` },
  description,
  alternates: alternatesFor('/blog', 'en'),
  openGraph: {
    title,
    description,
    url: '/en/blog',
    siteName: SITE_NAME,
    locale: 'en',
    type: 'website',
  },
};

export default function EnglishBlogIndex() {
  return <BlogIndex />;
}
