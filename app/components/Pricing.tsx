'use client';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';
import type { PermitType } from '../lib/types/database';

interface PricingProps {
  permitTypes: PermitType[];
}

export function Pricing({ permitTypes }: PricingProps) {
  const { language, t } = useLanguage();

  const euro = (cents: number) =>
    new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{t.pricing.title}</h2>
          <p className="text-slate-600">{t.pricing.subtitle}</p>
        </div>

        {permitTypes.length === 0 ? (
          <p className="text-center text-slate-500">{t.pricing.subtitle}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {permitTypes.map((pt) => {
              const name = language === 'en' ? pt.name_en : pt.name_nl;
              const desc = language === 'en' ? pt.description_en : pt.description_nl;
              return (
                <div
                  key={pt.id}
                  className="bg-white rounded-2xl p-7 border border-slate-200 flex flex-col hover:border-amber-300 hover:shadow-lg transition-all"
                >
                  <h3 className="font-bold text-lg text-slate-900">{name}</h3>
                  <div className="mt-3 mb-4">
                    {pt.base_fee_cents > 0 ? (
                      <>
                        <span className="text-3xl font-bold text-slate-900">
                          {euro(pt.base_fee_cents)}
                        </span>
                        <span className="text-slate-500 text-sm ml-1">
                          {t.pricing.oneTime || 'eenmalig'}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-slate-900">
                        {t.pricing.onRequest || 'Op aanvraag'}
                      </span>
                    )}
                  </div>
                  {desc && <p className="text-sm text-slate-600 mb-6 flex-1">{desc}</p>}
                  <Link href="/client-register" className="mt-auto">
                    <Button variant="outline" className="w-full">
                      {t.pricing.startCta || 'Aanvraag starten'}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="max-w-6xl mx-auto mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-600">
          <Check className="w-4 h-4 text-green-500" />
          <span>{t.pricing.reassurance || 'Vaste tarieven per vergunning — geen verrassingen achteraf.'}</span>
          <Link href="/contact" className="text-amber-600 hover:text-amber-700 font-medium">
            {t.pricing.customQuestion || 'Andere vraag? Neem contact op →'}
          </Link>
        </div>
      </div>
    </section>
  );
}
