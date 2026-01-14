'use client';
import { FileCheck, Scale, TrendingUp, HardHat } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Services() {
  const { t } = useLanguage();

  const icons = [FileCheck, Scale, TrendingUp, HardHat];

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
              <div key={i} className="group p-6 rounded-2xl border border-slate-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300 bg-white">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
                  <Icon className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{service.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}