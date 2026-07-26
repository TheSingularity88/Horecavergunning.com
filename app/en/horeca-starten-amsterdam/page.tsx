import type { Metadata } from 'next';
import StartenPage, { buildMetadata } from '@/app/horeca-starten-amsterdam/page';

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata('en');

/**
 * The English guide. Same slug as the Dutch page so the two URLs mirror each
 * other, which is what keeps the hreflang pair and the language switcher
 * correct without a lookup table.
 */
export default function EnglishStartenPage() {
  return <StartenPage locale="en" />;
}
