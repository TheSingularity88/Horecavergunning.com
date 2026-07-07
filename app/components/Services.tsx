'use client';
import Link from 'next/link';
import { FileCheck, Scale, TrendingUp, HardHat, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Services() {
  const { t } = useLanguage();

  const icons = [FileCheck, Scale, TrendingUp, HardHat];
  // Where each service card leads. Permit-related cards go to permit pages;
  // legal/financial go to contact (no dedicated permit page for those).
  const hrefs = ['/vergunningen', '/contact', '/contact', '/verbouwing'];

  return (
    <section id="services" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{t.services.title}</h2>
          <p className="text-slate-600">{t.services.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {t.services.items.map((service, i) => {
            const Icon = icons[i];
            return (
              <Link
                key={i}
                href={hrefs[i] ?? '/vergunningen'}
                className="group p-6 rounded-2xl border border-slate-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300 bg-white flex flex-col"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
                  <Icon className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">{service.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.services.more || 'Meer informatie'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/vergunningen"
            className="inline-flex items-center gap-2 text-slate-900 font-semibold hover:text-amber-600 transition-colors"
          >
            {t.services.viewAll || 'Bekijk alle vergunningen & tarieven'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
