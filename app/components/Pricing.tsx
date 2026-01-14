'use client';
import { Check } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

export function Pricing() {
  const { t } = useLanguage();

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{t.pricing.title}</h2>
          <p className="text-slate-600">{t.pricing.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          
          {/* Starter */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900">{t.pricing.starter.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-slate-900">€295</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-600 mb-6">{t.pricing.starter.desc}</p>
            <Button variant="outline" className="w-full mb-8">{t.pricing.starter.cta}</Button>
            <ul className="space-y-3 text-sm text-slate-700">
              {t.pricing.starter.features.map((feature, i) => (
                 <li key={i} className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> {feature}</li>
              ))}
            </ul>
          </div>

          {/* Growth (Highlight) */}
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl relative transform md:-translate-y-4">
            <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500 rounded-t-2xl" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-xs font-bold px-3 py-1 rounded-full text-slate-900 uppercase tracking-wide">
              {t.pricing.growth.badge}
            </div>
            
            <h3 className="font-bold text-lg text-white">{t.pricing.growth.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-white">€495</span>
              <span className="text-slate-400">/mo</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">{t.pricing.growth.desc}</p>
            <Button className="w-full mb-8">{t.pricing.growth.cta}</Button>
            <ul className="space-y-3 text-sm text-slate-300">
              {t.pricing.growth.features.map((feature, i) => (
                 <li key={i} className="flex gap-3"><Check className="w-4 h-4 text-amber-500" /> {feature}</li>
              ))}
            </ul>
          </div>

          {/* Enterprise */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900">{t.pricing.all_in.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-slate-900">{t.pricing.all_in.price}</span>
            </div>
            <p className="text-sm text-slate-600 mb-6">{t.pricing.all_in.desc}</p>
            <Button variant="outline" className="w-full mb-8">{t.pricing.all_in.cta}</Button>
            <ul className="space-y-3 text-sm text-slate-700">
               {t.pricing.all_in.features.map((feature, i) => (
                 <li key={i} className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> {feature}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}