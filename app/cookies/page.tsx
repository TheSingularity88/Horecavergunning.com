import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { JsonLd, breadcrumb, ORGANIZATION_REF } from '@/app/components/seo/JsonLd';
import { SITE_URL } from '@/app/lib/site';
import { CookiePreferencesLink } from '@/app/components/CookieConsent';

const title = 'Cookieverklaring';
const description =
  'Welke cookies HorecaVergunning.com plaatst, waarvoor ze dienen en hoe u uw keuze op elk moment kunt wijzigen.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/cookies' },
  // A cookie statement has no business ranking; it exists to be linked to.
  robots: { index: false, follow: true },
};

/**
 * Every row here is derived from what the code actually sets — not a generic
 * template. If a cookie is added or removed, this table has to change with it.
 */
const COOKIES = [
  {
    name: 'hv_lang',
    party: 'HorecaVergunning.com',
    purpose: 'Onthoudt of u de site in het Nederlands of Engels wilt zien.',
    category: 'Noodzakelijk',
    retention: '1 jaar',
  },
  {
    name: 'hv_consent',
    party: 'HorecaVergunning.com',
    purpose:
      'Legt uw cookiekeuze vast, zodat wij die keuze respecteren en u niet bij elk bezoek opnieuw hoeven te vragen.',
    category: 'Noodzakelijk',
    retention: '6 maanden',
  },
  {
    name: 'sb-<project>-auth-token',
    party: 'Supabase',
    purpose:
      'Houdt u ingelogd in het klantenportaal. Wordt alleen geplaatst als u daadwerkelijk inlogt.',
    category: 'Noodzakelijk',
    retention: 'Tot uitloggen',
  },
  {
    name: '_ga, _ga_<id>',
    party: 'Google Analytics',
    purpose:
      'Meet hoeveel bezoekers de site heeft en welke pagina’s worden bekeken, zodat wij de site kunnen verbeteren.',
    category: 'Analytisch (alleen met uw toestemming)',
    retention: '2 jaar',
  },
];

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <JsonLd
        graph={[
          breadcrumb([{ name: 'Cookieverklaring', path: '/cookies' }]),
          {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/cookies#webpage`,
            url: `${SITE_URL}/cookies`,
            name: title,
            description,
            inLanguage: 'nl-NL',
            about: ORGANIZATION_REF,
          },
        ]}
      />
      <Navbar />

      <section className="bg-slate-900 text-white pt-32 pb-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <nav
            className="flex items-center gap-1.5 text-sm text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-300">Cookieverklaring</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">Cookieverklaring</h1>
          <p className="mt-4 text-lg text-slate-300">
            Hieronder staat precies welke cookies wij plaatsen en waarom.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4 max-w-3xl space-y-10">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl font-bold text-slate-900">Wat zijn cookies?</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              Cookies zijn kleine tekstbestanden die een website op uw apparaat opslaat.
              Sommige zijn nodig om de site te laten werken — bijvoorbeeld om u ingelogd
              te houden. Andere gebruiken wij om te meten hoe de site gebruikt wordt.
              Die laatste plaatsen wij <strong>alleen als u daar toestemming voor geeft</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Welke cookies plaatsen wij?
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Overzicht van cookies die HorecaVergunning.com plaatst
                </caption>
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-900">Cookie</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-900">Wie plaatst</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-900">Waarvoor</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-900">Categorie</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-900">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COOKIES.map((c) => (
                    <tr key={c.name} className="align-top">
                      <td className="px-4 py-3 font-mono text-xs text-slate-900 whitespace-nowrap">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.party}</td>
                      <td className="px-4 py-3 text-slate-600">{c.purpose}</td>
                      <td className="px-4 py-3 text-slate-600">{c.category}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Uw keuze wijzigen</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              U kunt uw toestemming op elk moment intrekken of alsnog geven. Als u de
              analytische cookies weigert, verwijderen wij de eerder geplaatste
              Google Analytics-cookies.
            </p>
            <CookiePreferencesLink className="mt-4 inline-flex rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-800 transition-colors" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Weigeren heeft geen gevolgen</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              De site werkt volledig zonder analytische cookies. U kunt alle pagina&apos;s
              bekijken, contact opnemen en het klantenportaal gebruiken, ook als u
              weigert.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Vragen over uw gegevens</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              Heeft u een vraag over cookies of over de gegevens die wij verwerken?{' '}
              <Link href="/contact" className="text-amber-600 hover:text-amber-700 underline">
                Neem contact met ons op
              </Link>
              . U kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
