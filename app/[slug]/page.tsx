import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { FloatingWhatsApp } from '@/app/components/FloatingWhatsApp';
import { createPublicClient } from '@/app/lib/supabase/public';
import { SITE_URL, SITE_NAME } from '@/app/lib/site';
import {
  PERMIT_SLUGS,
  getPermitContent,
  PERMIT_CONTENT,
} from '@/app/lib/permit-content';
import type { PermitType, RequiredDocument } from '@/app/lib/types/database';

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return PERMIT_SLUGS.map((slug) => ({ slug }));
}

async function getPermitType(slug: string): Promise<{
  permit: PermitType | null;
  requiredDocs: RequiredDocument[];
}> {
  try {
    const supabase = createPublicClient();
    const { data: permit } = await supabase
      .from('permit_types')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (!permit) return { permit: null, requiredDocs: [] };
    const { data: docs } = await supabase
      .from('required_documents')
      .select('*')
      .eq('permit_type_id', (permit as PermitType).id)
      .order('sort_order');
    return {
      permit: permit as PermitType,
      requiredDocs: (docs as RequiredDocument[]) || [],
    };
  } catch {
    return { permit: null, requiredDocs: [] };
  }
}

const euro = (cents: number) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = getPermitContent(slug);
  if (!content) return {};
  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: `/${slug}`,
      type: 'website',
      locale: 'nl_NL',
    },
  };
}

export default async function PermitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = getPermitContent(slug);
  if (!content) notFound();

  const { permit, requiredDocs } = await getPermitType(slug);
  const feeCents = permit?.base_fee_cents ?? 0;

  // Prefer DB-managed required documents; fall back to the content checklist.
  const requirements =
    requiredDocs.length > 0 ? requiredDocs.map((d) => d.name_nl) : content.requirements;

  const related = content.related
    .map((s) => ({ slug: s, content: PERMIT_CONTENT[s] }))
    .filter((r) => r.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: content.h1,
        serviceType: content.metaTitle,
        description: content.metaDescription,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        areaServed: { '@type': 'City', name: 'Amsterdam' },
        ...(feeCents > 0
          ? {
              offers: {
                '@type': 'Offer',
                price: (feeCents / 100).toFixed(2),
                priceCurrency: 'EUR',
                url: `${SITE_URL}/${slug}`,
              },
            }
          : {}),
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Vergunningen',
            item: `${SITE_URL}/vergunningen`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: content.h1,
            item: `${SITE_URL}/${slug}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* Hero */}
      <section className="bg-slate-900 text-white pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/vergunningen" className="hover:text-white">Vergunningen</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-300">{permit ? permit.name_nl : content.h1}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-balance">
            {content.h1}
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl">{content.intro}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-500 px-7 font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
            >
              Gratis intake <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/client-register"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 px-7 font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Direct aanvragen
            </Link>
          </div>
        </div>
      </section>

      <article className="container mx-auto px-4 max-w-3xl py-16 space-y-12">
        {/* What is it */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{content.what.title}</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            {content.what.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* When needed */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{content.when.title}</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            {content.when.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* Requirements */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Welke documenten heeft u nodig?</h2>
          <ul className="space-y-2.5">
            {requirements.map((r, i) => (
              <li key={i} className="flex gap-3 text-slate-700">
                <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-500">
            Wij vertellen u tijdens de gratis intake precies welke stukken in uw situatie nodig zijn.
          </p>
        </section>

        {/* Process */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Zo verloopt het proces</h2>
          <ol className="space-y-4">
            {content.process.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{step.title}</p>
                  <p className="text-slate-600 text-sm">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Kosten */}
        <section id="kosten" className="rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-2xl font-bold mb-3">
            Wat kost een {permit ? permit.name_nl.toLowerCase() : slug}?
          </h2>
          <p className="text-slate-700 leading-relaxed">{content.kostenIntro}</p>
          <div className="my-5 flex items-baseline gap-2">
            {feeCents > 0 ? (
              <>
                <span className="text-4xl font-bold tracking-tight">{euro(feeCents)}</span>
                <span className="text-slate-500">eenmalig servicetarief</span>
              </>
            ) : (
              <span className="text-3xl font-bold">Op aanvraag</span>
            )}
          </div>
          <p className="text-sm text-slate-500">{content.kostenNote}</p>
          <Link
            href="/contact"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-amber-600 hover:text-amber-700"
          >
            Vraag een vrijblijvende offerte aan <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Veelgestelde vragen</h2>
          <dl className="space-y-5">
            {content.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <dt className="font-semibold text-slate-900 flex items-start gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  {f.q}
                </dt>
                <dd className="mt-2 text-slate-600 leading-relaxed pl-7">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Gerelateerde vergunningen</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.slug}`}
                  className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <FileText className="w-5 h-5 text-amber-500 mb-2" />
                  <p className="font-semibold text-slate-900 text-sm group-hover:text-amber-600">
                    {r.content.h1.replace(' aanvragen', '').replace(' in Amsterdam', '')}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="rounded-2xl bg-slate-900 text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Laat uw {permit ? permit.name_nl.toLowerCase() : 'vergunning'} door ons regelen</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Vaste prijs, geen verrassingen. Wij verzorgen de volledige aanvraag zodat u zich op uw zaak kunt richten.
          </p>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-500 px-8 font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
          >
            Gratis intake aanvragen <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </article>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
