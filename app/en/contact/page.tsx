import type { Metadata } from 'next';
import { JsonLd, breadcrumb, ORGANIZATION_REF } from '@/app/components/seo/JsonLd';
import { alternatesFor } from '@/app/lib/i18n-routes';
import { SITE_NAME, SITE_URL } from '@/app/lib/site';
import ContactClient from '@/app/contact/ContactClient';

const title = 'Contact & free intake';
const description =
  'Get in touch about a hospitality permit in Amsterdam, or request a free, no-obligation intake. We usually reply within one working day.';

export const metadata: Metadata = {
  title: { absolute: `${title} | ${SITE_NAME}` },
  description,
  alternates: alternatesFor('/contact', 'en'),
  openGraph: {
    title,
    description,
    url: '/en/contact',
    siteName: SITE_NAME,
    locale: 'en',
    type: 'website',
  },
};

export default function EnglishContactPage() {
  return (
    <>
      <JsonLd
        graph={[
          breadcrumb([{ name: 'Contact', path: '/en/contact' }]),
          {
            '@type': 'ContactPage',
            '@id': `${SITE_URL}/en/contact#contactpage`,
            url: `${SITE_URL}/en/contact`,
            name: title,
            description,
            inLanguage: 'en',
            about: ORGANIZATION_REF,
          },
        ]}
      />
      <ContactClient />
    </>
  );
}
