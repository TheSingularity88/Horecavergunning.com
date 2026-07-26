import { alternatesFor } from '@/app/lib/i18n-routes';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '../lib/site';
import { JsonLd, breadcrumb, ORGANIZATION_REF } from '@/app/components/seo/JsonLd';
import ContactClient from './ContactClient';

const title = 'Contact & gratis intake';
const description =
  'Neem contact op met HorecaVergunning. Stel uw vraag over een horecavergunning of vraag een gratis, vrijblijvende intake aan. Reactie doorgaans binnen één werkdag.';

export const metadata: Metadata = {
  title,
  description,
  alternates: alternatesFor('/contact', 'nl'),
  openGraph: {
    title,
    description,
    url: '/contact',
    siteName: SITE_NAME,
    locale: 'nl_NL',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        graph={[
          breadcrumb([{ name: 'Contact', path: '/contact' }]),
          {
            '@type': 'ContactPage',
            '@id': `${SITE_URL}/contact#contactpage`,
            url: `${SITE_URL}/contact`,
            name: title,
            description,
            inLanguage: 'nl-NL',
            about: ORGANIZATION_REF,
          },
        ]}
      />
      <ContactClient />
    </>
  );
}
