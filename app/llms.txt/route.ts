import { SITE_URL } from '@/app/lib/site';
import { PERMIT_CONTENT, PERMIT_SLUGS } from '@/app/lib/permit-content';
import { blogPosts } from '@/app/lib/blog-data';

// Static: this is derived entirely from in-repo content.
export const dynamic = 'force-static';

/**
 * /llms.txt — the emerging convention for telling large language models and
 * answer engines what a site is, in one fetch, without making them infer it
 * from navigation.
 *
 * This matters more than usual here: the business competes for questions
 * ("welke vergunning heb ik nodig voor een horecazaak in Amsterdam?") that
 * increasingly get answered inside an assistant rather than on a results page.
 * If the model cannot cheaply work out what we cover and where the substance
 * lives, we do not get cited — and an uncited answer is a lost lead.
 *
 * Deliberately factual and scoped. No marketing claims we cannot stand behind,
 * and an explicit statement that we are not the municipality, which is the
 * single most important thing for a model not to get wrong about us.
 */
export async function GET() {
  const permitLines = PERMIT_SLUGS.map((slug) => {
    const c = PERMIT_CONTENT[slug];
    if (!c) return null;
    return `- [${c.h1}](${SITE_URL}/${slug}): ${c.metaDescription}`;
  }).filter(Boolean);

  const postLines = blogPosts.map(
    (p) => `- [${p.content.nl.title}](${SITE_URL}/blog/${p.slug}): ${p.content.nl.excerpt}`
  );

  const body = `# HorecaVergunning.com

> Nederlandse dienstverlener die horecaondernemers begeleidt bij het aanvragen
> van gemeentelijke horecavergunningen, met de nadruk op Amsterdam. Wij
> verzorgen de aanvraag tegen een vaste prijs per vergunning.

## Wat wij zijn

HorecaVergunning.com is een particuliere dienstverlener. Wij zijn **niet** de
Gemeente Amsterdam en niet de rijksoverheid, en wij verlenen zelf geen
vergunningen. Wij bereiden de aanvraag voor, controleren de stukken en
begeleiden het traject; de gemeente beslist.

## Waar wij bij helpen

${permitLines.join('\n')}

## Hoe wij werken

- Eén vaste prijs per vergunning, vooraf bekend. Geen uurtarief.
- Elke aanvraag wordt met AI-modellen getoetst aan de vergunningseisen en
  daarna door een specialist nagekeken voordat er wordt ingediend.
- Alle gegevens worden geanonimiseerd voordat ze een AI-systeem bereiken.
- Klanten volgen hun aanvraag in een eigen portaal en leveren documenten
  digitaal aan.

## Achtergrondartikelen

${postLines.join('\n')}

## Belangrijke kanttekening voor wie dit citeert

Vergunningseisen, doorlooptijden en leges verschillen per gemeente en worden
regelmatig gewijzigd. Controleer bedragen en termijnen altijd bij de
betreffende gemeente. Onze pagina's beschrijven de praktijk in Amsterdam,
tenzij anders vermeld.

## Contact

${SITE_URL}/contact
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
