'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  ScanSearch,
  ListChecks,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PILLAR_ICONS = [ScanSearch, ListChecks, UserCheck];

export function AiReview() {
  const { t } = useLanguage();
  const copy = t.ai_review;

  return (
    <section
      id="ai-controle"
      className="py-24 bg-slate-900 relative overflow-hidden"
    >
      {/* Ambient glow — same motif as the solution card in ProblemSolution. */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Narrative */}
          <motion.div
            // min-w-0: grid items default to min-width:auto, so without this the
            // track is forced to the widest min-content in the column (the
            // nowrap card title) and the text overflows on mobile.
            className="min-w-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {copy.badge}
            </div>

            <h2 className="mt-6 text-3xl md:text-4xl font-bold text-white leading-tight text-balance">
              {copy.title_start}{' '}
              <span className="text-amber-500">{copy.title_accent}</span>
            </h2>

            <p className="mt-5 text-lg text-slate-300 max-w-xl">{copy.subtitle}</p>

            <ul className="mt-10 space-y-6">
              {copy.pillars.map((pillar, i) => {
                const Icon = PILLAR_ICONS[i] ?? ListChecks;
                return (
                  <li key={pillar.title} className="flex gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{pillar.title}</h3>
                      <p className="mt-1 text-slate-400 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Illustration — a sample check, explicitly labelled as an example
              (same honesty convention as the Hero's status card). */}
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-w-md mx-auto lg:ml-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="font-semibold text-slate-900 truncate min-w-0">
                    {copy.demo_title}
                  </p>
                </div>
                <span className="flex-shrink-0 ml-3 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1">
                  {copy.demo_label}
                </span>
              </div>

              <ul className="p-5 space-y-4">
                {copy.demo_items.map((item) => {
                  const isWarning = item.state === 'warn';
                  return (
                    <li key={item.label} className="flex items-start gap-3">
                      {isWarning ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {item.label}
                        </p>
                        <p
                          className={
                            isWarning
                              ? 'text-sm text-amber-600'
                              : 'text-sm text-slate-500'
                          }
                        >
                          {item.note}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-600">{copy.demo_footer}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Privacy commitment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-2xl border border-slate-800 bg-slate-800/40 p-6 sm:p-8 flex flex-col sm:flex-row gap-5 sm:items-center"
        >
          <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </span>
          <div>
            <h3 className="font-semibold text-white">{copy.privacy_title}</h3>
            <p className="mt-1 text-slate-400 leading-relaxed">
              {copy.privacy_desc}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
