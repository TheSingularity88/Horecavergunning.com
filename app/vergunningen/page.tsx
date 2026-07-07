import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { FloatingWhatsApp } from '@/app/components/FloatingWhatsApp';
import { createPublicClient } from '@/app/lib/supabase/public';
import { PERMIT_SLUGS } from '@/app/lib/permit-content';
import type { PermitType } from '@/app/lib/types/database';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Horecavergunningen aanvragen in Amsterdam | Alle vergunningen & tarieven',
  description:
    'Overzicht van alle horecavergunningen die wij voor u aanvragen: exploitatievergunning, alcoholvergunning, terrasvergunning, Bibob en meer. Vaste tarieven per vergunning.',
  alternates: { canonical: '/vergunningen' },
};

async function getPermitTypes(): Promise<PermitType[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('permit_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    // Only show permits that have a public content page.
    return ((data as PermitType[]) || []).filter((p) => PERMIT_SLUGS.includes(p.slug));
  } catch {
    return [];
  }
}

const euro = (cents: number) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);

export default async function VergunningenHub() {
  const permitTypes = await getPermitTypes();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      <section className="bg-slate-900 text-white pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-300">Vergunningen</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-balance">
            Horecavergunningen aanvragen in Amsterdam
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl">
            Wij verzorgen de volledige aanvraag van al uw horecavergunningen — tegen een vaste prijs
            per vergunning. Kies uw vergunning voor de voorwaarden, het proces en de kosten.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl py-16">
        <div className="grid sm:grid-cols-2 gap-5">
          {permitTypes.map((pt) => (
            <Link
              key={pt.id}
              href={`/${pt.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 hover:border-amber-300 hover:shadow-lg transition-all"
            >
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-amber-600">
                {pt.name_nl}
              </h2>
              {pt.description_nl && (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">
                  {pt.description_nl}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {pt.base_fee_cents > 0 ? euro(pt.base_fee_cents) : 'Op aanvraag'}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                  Meer info <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-slate-900 text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Niet zeker welke vergunning u nodig heeft?</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Vertel ons over uw zaak en wij bepalen kosteloos welke vergunningen u precies nodig heeft.
          </p>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-500 px-8 font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
          >
            Gratis intake aanvragen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
