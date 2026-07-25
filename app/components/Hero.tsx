'use client';
import Link from 'next/link';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Hero() {
  const { language, t } = useLanguage();
  const nl = language !== 'en';

  // Honest product illustration — a sample case-status card, clearly a demo.
  const steps = nl
    ? [
        { label: 'Documenten compleet', state: 'done' as const },
        { label: 'Bibob-toets ingediend', state: 'active' as const },
        { label: 'Besluit gemeente', state: 'todo' as const },
      ]
    : [
        { label: 'Documents complete', state: 'done' as const },
        { label: 'Bibob screening filed', state: 'active' as const },
        { label: 'Municipality decision', state: 'todo' as const },
      ];

  return (
    <section className="pt-32 pb-16 md:pt-48 md:pb-32 bg-slate-900 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-800/50 skew-x-12 transform origin-top-right" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* NOT animated on entry, deliberately.
              The <h1> here is the page's LCP element. Wrapping it in a Framer
              Motion fade meant the server HTML shipped it at opacity:0 and it
              only became visible once JS hydrated — so Largest Contentful Paint
              was measured from hydration rather than from first paint, on the
              page that has to rank. The visual card beside it still animates;
              nothing that carries the LCP does. */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              {t.hero.badge}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight text-balance">
              {t.hero.headline_start} <br />
              <span className="text-amber-500">{t.hero.headline_end}</span>
            </h1>

            <p className="text-lg text-slate-300 max-w-xl">{t.hero.subheadline}</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  {t.hero.cta_primary} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-white border-slate-700 hover:bg-slate-800 hover:text-white"
                >
                  {t.hero.cta_secondary}
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span>{t.hero.fixed_rates}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span>{t.hero.support}</span>
              </div>
              <Link
                href="/#ai-controle"
                className="flex items-center gap-2 hover:text-amber-500 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t.hero.ai_check}</span>
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 w-full"
          >
            {/* Sample case-status card — an honest illustration of the portal */}
            <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-w-md mx-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    {nl ? 'Uw aanvraag' : 'Your application'}
                  </p>
                  <p className="font-semibold text-slate-900">Exploitatievergunning</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1">
                  <Clock className="w-3 h-3" />
                  {nl ? 'In behandeling' : 'In progress'}
                </span>
              </div>
              <div className="p-5 space-y-3">
                {steps.map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    {step.state === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : step.state === 'active' ? (
                      <span className="relative flex h-5 w-5 items-center justify-center flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                      </span>
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    )}
                    <span
                      className={
                        step.state === 'todo'
                          ? 'text-sm text-slate-400'
                          : 'text-sm text-slate-700 font-medium'
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {nl ? 'Vaste prijs' : 'Fixed price'}
                  </span>
                  <span className="font-bold text-slate-900">€&thinsp;495</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
