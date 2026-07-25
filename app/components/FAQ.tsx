'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../lib/translations';
import clsx from 'clsx';

export function FAQ() {
  const { language } = useLanguage();
  const t = translations[language].faq;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl divide-y divide-slate-900/10">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-slate-900">
            {t.title}
          </h2>
          <dl className="mt-10 space-y-6 divide-y divide-slate-900/10">
            {t.items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.q} className="pt-6">
                  <dt>
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      className="flex w-full items-start justify-between text-left text-slate-900"
                    >
                      <span className="text-base font-semibold leading-7">
                        {item.q}
                      </span>
                      <span className="ml-6 flex h-7 items-center">
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-6 w-6" aria-hidden="true" />
                        </motion.div>
                      </span>
                    </button>
                  </dt>
                  {/* The answer is ALWAYS in the DOM and only collapsed
                      visually. It used to be mounted/unmounted by
                      AnimatePresence, so the rendered HTML contained the
                      questions and none of the answers — the substance lived
                      only in the FAQPage JSON-LD. Crawlers and answer engines
                      reward extractable on-page answers, and this FAQ is some
                      of the most citable content on the site. */}
                  <motion.dd
                    id={`faq-answer-${index}`}
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden pr-12"
                  >
                    <p className="mt-2 text-base leading-7 text-slate-600 pb-4">
                      {item.a}
                    </p>
                  </motion.dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}
