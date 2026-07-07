import type { Metadata } from 'next';
import { SITE_NAME } from '../lib/site';
import ContactClient from './ContactClient';

const title = 'Contact & gratis intake';
const description =
  'Neem contact op met HorecaVergunning. Stel uw vraag over een horecavergunning of vraag een gratis, vrijblijvende intake aan. Reactie doorgaans binnen één werkdag.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/contact' },
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
  return <ContactClient />;
}
