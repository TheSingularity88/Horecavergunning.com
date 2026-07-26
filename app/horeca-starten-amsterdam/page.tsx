import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { FloatingWhatsApp } from '@/app/components/FloatingWhatsApp';
import { JsonLd, breadcrumb, ORGANIZATION_REF } from '@/app/components/seo/JsonLd';
import { alternatesFor, localePath } from '@/app/lib/i18n-routes';
import { SITE_NAME, SITE_URL } from '@/app/lib/site';
import { STARTEN_SLUG, getStartenCopy } from '@/app/lib/starten-content';
import type { Language } from '@/app/lib/translations';

export const revalidate = 3600;

export function buildMetadata(locale: Language): Metadata {
  const copy = getStartenCopy(locale);
  return {
    title: { absolute: copy.metaTitle },
    description: copy.metaDescription,
    alternates: alternatesFor(`/${STARTEN_SLUG}`, locale),
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: localePath(`/${STARTEN_SLUG}`, locale),
      siteName: SITE_NAME,
      locale: locale === 'en' ? 'en' : 'nl_NL',
      type: 'article',
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

export const metadata: Metadata = buildMetadata('nl');

/** Permit pages this guide routes people to, in the order they are mentioned. */
const PERMIT_LINKS = [
  'exploitatievergunning',
  'alcoholvergunning',
  'terrasvergunning',
  'bibob',
  'overname',
  'verbouwing',
];

export default function StartenPage({ locale = 'nl' }: { locale?: Language } = {}) {
  const copy = getStartenCopy(locale);
  const base = `/${STARTEN_SLUG}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <JsonLd
        graph={[
          breadcrumb([{ name: copy.h1, path: localePath(base, locale) }]),
          {
            '@type': 'WebPage',
            '@id': `${SITE_URL}${localePath(base, locale)}#webpage`,
            url: `${SITE_URL}${localePath(base, locale)}`,
            name: copy.metaTitle,
            description: copy.metaDescription,
            inLanguage: locale === 'en' ? 'en' : 'nl-NL',
            about: ORGANIZATION_REF,
            // The self-contained answer, so an engine can quote the page
            // without having to infer what it says.
            abstract: copy.answer,
          },
          {
            '@type': 'HowTo',
            '@id': `${SITE_URL}${localePath(base, locale)}#howto`,
            name: copy.orderTitle,
            description: copy.orderIntro,
            inLanguage: locale === 'en' ? 'en' : 'nl-NL',
            step: copy.steps.map((s, i) => ({
              '@type': 'HowToStep',
              position: i + 1,
              name: s.title,
              text: s.body,
            })),
          },
          {
            '@type': 'FAQPage',
            '@id': `${SITE_URL}${localePath(base, locale)}#faq`,
            mainEntity: copy.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
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
            <Link href={localePath('/', locale)} className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-slate-300">{copy.h1}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight text-balance">{copy.h1}</h1>
          {/* The answer comes FIRST, before any pitch — this is the paragraph
              an answer engine is most likely to quote. */}
          <p className="mt-6 text-lg text-slate-200 leading-relaxed">{copy.answer}</p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4 max-w-3xl space-y-14">
          {/* Decision table — the most extractable format for "which do I need". */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{copy.situationsTitle}</h2>
            <p className="mt-2 text-slate-600">{copy.situationsIntro}</p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <caption className="sr-only">{copy.situationsTitle}</caption>
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-900">
                      {copy.colSituation}
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-900">
                      {copy.colPermits}
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-900">
                      {copy.colNote}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {copy.situations.map((row) => (
                    <tr key={row.situation} className="align-top">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.situation}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <ul className="space-y-1">
                          {row.permits.map((p) => (
                            <li key={p} className="flex items-start gap-1.5">
                              <CheckCircle2
                                className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ordered process — mirrors the HowTo schema above. */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{copy.orderTitle}</h2>
            <p className="mt-2 text-slate-600">{copy.orderIntro}</p>
            <ol className="mt-6 space-y-4">
              {copy.steps.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-900">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-slate-600 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* The honesty block. Anything quoting this page inherits the hedge. */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex gap-4">
            <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-slate-900">{copy.caveatTitle}</h2>
              <p className="mt-1 text-slate-600 leading-relaxed">{copy.caveat}</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{copy.faqTitle}</h2>
            <dl className="space-y-4">
              {copy.faqs.map((f) => (
                <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-5">
                  <dt className="font-semibold text-slate-900">{f.q}</dt>
                  <dd className="mt-2 text-slate-600 leading-relaxed">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Route people onward to the detail pages this guide summarises. */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {locale === 'en' ? 'Read more per permit' : 'Lees verder per vergunning'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {PERMIT_LINKS.map((slug) => (
                <Link
                  key={slug}
                  href={localePath(`/${slug}`, locale)}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <span className="font-medium text-slate-900 capitalize group-hover:text-amber-600">
                    {slug.replace(/-/g, ' ')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 text-white p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{copy.ctaTitle}</h2>
            <p className="text-slate-300 mb-6 max-w-xl mx-auto">{copy.ctaBody}</p>
            <Link
              href={localePath('/contact', locale)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-500 px-8 font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
            >
              {copy.ctaButton} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
