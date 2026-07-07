'use client';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  Store,
  Wine,
  Umbrella,
  ShieldCheck,
  ArrowLeftRight,
  Hammer,
  FileText,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { PermitType } from '../lib/types/database';

interface PricingProps {
  permitTypes: PermitType[];
}

const ICONS: Record<string, React.ElementType> = {
  exploitatievergunning: Store,
  alcoholvergunning: Wine,
  terrasvergunning: Umbrella,
  bibob: ShieldCheck,
  overname: ArrowLeftRight,
  verbouwing: Hammer,
  other: FileText,
};

// The permit most clients start with gets the highlighted treatment.
const FEATURED_SLUG = 'exploitatievergunning';

export function Pricing({ permitTypes }: PricingProps) {
  const { language, t } = useLanguage();

  const euro = (cents: number) =>
    new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const featured = permitTypes.some((p) => p.slug === FEATURED_SLUG)
    ? FEATURED_SLUG
    : permitTypes[0]?.slug;

  return (
    <section id="pricing" className="relative py-24 bg-slate-50 overflow-hidden">
      {/* subtle background accent */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0,#fef3c7_0,transparent_45%)]" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-3">
            {t.pricing.eyebrow || 'Tarieven'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
            {t.pricing.title}
          </h2>
          <p className="text-slate-600 text-lg">{t.pricing.subtitle}</p>
        </div>

        {permitTypes.length === 0 ? (
          <p className="text-center text-slate-500">{t.pricing.subtitle}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {permitTypes.map((pt) => {
              const name = language === 'en' ? pt.name_en : pt.name_nl;
              const desc = language === 'en' ? pt.description_en : pt.description_nl;
              const Icon = ICONS[pt.slug] ?? FileText;
              const isFeatured = pt.slug === featured;

              return (
                <div
                  key={pt.id}
                  className={[
                    'group relative flex flex-col rounded-2xl p-6 transition-all duration-300',
                    isFeatured
                      ? 'bg-slate-900 text-white shadow-2xl ring-1 ring-slate-900 lg:-translate-y-2'
                      : 'bg-white text-slate-900 border border-slate-200 hover:-translate-y-1 hover:shadow-xl hover:border-amber-300',
                  ].join(' ')}
                >
                  {isFeatured && (
                    <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-900 shadow">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {t.pricing.popular || 'Meest gekozen'}
                    </span>
                  )}

                  {/* icon */}
                  <div
                    className={[
                      'flex h-12 w-12 items-center justify-center rounded-xl mb-5',
                      isFeatured ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600',
                    ].join(' ')}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="font-semibold text-lg leading-snug">{name}</h3>
                  {desc && (
                    <p
                      className={[
                        'mt-2 text-sm leading-relaxed line-clamp-3 min-h-[3.75rem]',
                        isFeatured ? 'text-slate-300' : 'text-slate-500',
                      ].join(' ')}
                    >
                      {desc}
                    </p>
                  )}

                  {/* price */}
                  <div
                    className={[
                      'mt-5 pt-5 border-t',
                      isFeatured ? 'border-white/10' : 'border-slate-100',
                    ].join(' ')}
                  >
                    {pt.base_fee_cents > 0 ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-bold tracking-tight">
                          {euro(pt.base_fee_cents)}
                        </span>
                        <span
                          className={[
                            'text-sm',
                            isFeatured ? 'text-slate-400' : 'text-slate-500',
                          ].join(' ')}
                        >
                          {t.pricing.oneTime || 'eenmalig'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold">
                        {t.pricing.onRequest || 'Op aanvraag'}
                      </span>
                    )}
                    <p
                      className={[
                        'mt-1 flex items-center gap-1.5 text-xs',
                        isFeatured ? 'text-slate-400' : 'text-slate-500',
                      ].join(' ')}
                    >
                      <Check className="h-3.5 w-3.5 text-amber-500" />
                      {t.pricing.inclLabel || 'Wij verzorgen de volledige aanvraag'}
                    </p>
                  </div>

                  {/* CTA */}
                  <Link
                    href="/client-register"
                    className={[
                      'mt-6 inline-flex h-11 items-center justify-center gap-1.5 rounded-lg font-semibold text-sm transition-colors',
                      isFeatured
                        ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                        : 'bg-slate-900 text-white hover:bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-900',
                    ].join(' ')}
                  >
                    {t.pricing.startCta || 'Aanvraag starten'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* trust bar */}
        <div className="mx-auto mt-14 max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-slate-200 bg-white/70 px-6 py-4 text-sm text-slate-600 backdrop-blur">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              {t.pricing.trustFixed || 'Vaste prijs per vergunning'}
            </span>
            <span className="hidden sm:block h-4 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              {t.pricing.trustResponse || 'Reactie binnen 1 werkdag'}
            </span>
            <span className="hidden sm:block h-4 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-amber-500" />
              {t.pricing.trustApproval || 'U betaalt na goedkeuring'}
            </span>
          </div>
          <p className="mt-5 text-center text-sm text-slate-500">
            <Link href="/contact" className="font-medium text-amber-600 hover:text-amber-700">
              {t.pricing.customQuestion || 'Andere vraag? Neem contact op →'}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
