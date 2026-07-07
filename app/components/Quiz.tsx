'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Spinner } from './ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { PermitType } from '../lib/types/database';

interface QuizProps {
  permitTypes: PermitType[];
}

export function Quiz({ permitTypes }: QuizProps) {
  const { language, t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = [
    { question: t.quiz.q1, options: t.quiz.q1_opt },
    { question: t.quiz.q2, options: t.quiz.q2_opt },
    { question: t.quiz.q3, options: t.quiz.q3_opt },
  ];

  // Best-effort: match the "what do you need help with" answer (q2) to a
  // permit type by name; otherwise recommend the first active type.
  const recommended: PermitType | null = (() => {
    if (permitTypes.length === 0) return null;
    const needle = (answers[1] || '').toLowerCase();
    const match = permitTypes.find(
      (p) =>
        needle.includes(p.name_en.toLowerCase()) ||
        needle.includes(p.name_nl.toLowerCase()) ||
        p.name_en.toLowerCase().includes(needle) ||
        p.name_nl.toLowerCase().includes(needle)
    );
    return match ?? permitTypes[0];
  })();

  const handleOptionClick = (option: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = option;
      return next;
    });
    setStep((s) => s + 1);
  };

  const handleBack = () => step > 0 && setStep((s) => s - 1);
  const handleRestart = () => {
    setStep(0);
    setAnswers([]);
    setSubmitted(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'quiz',
          name: form.name,
          email: form.email,
          phone: form.phone,
          permit_type_slug: recommended?.slug || '',
          quiz_answers: {
            q1: answers[0] ?? null,
            q2: answers[1] ?? null,
            q3: answers[2] ?? null,
          },
          locale: language,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t.quiz.errorMsg);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.quiz.errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormStep = step === questions.length && !submitted;

  return (
    <section id="quiz" className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" />
      <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_20%_20%,#f59e0b_0,transparent_40%),radial-gradient(circle_at_80%_60%,#f59e0b_0,transparent_35%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatePresence mode="wait">
            {step < questions.length ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 relative">
                  {step > 0 && (
                    <button
                      onClick={handleBack}
                      className="absolute left-0 top-1 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                      ← {t.quiz.back}
                    </button>
                  )}
                  <span className="text-amber-500 font-medium uppercase tracking-widest text-sm">
                    {t.quiz.step_label} {step + 1}/{questions.length}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-12">
                    {questions[step].question}
                  </h2>

                  <div className="grid gap-4 max-w-md mx-auto">
                    {questions[step].options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(option)}
                        className="group flex items-center justify-between p-6 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-amber-500 hover:border-amber-500 transition-all duration-300 text-left"
                      >
                        <span className="text-lg font-medium group-hover:text-slate-900">
                          {option}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : isFormStep ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white text-slate-900 rounded-3xl p-8 md:p-12 shadow-2xl text-left"
              >
                <button
                  onClick={handleBack}
                  className="text-slate-400 hover:text-slate-700 text-sm font-medium mb-4"
                >
                  ← {t.quiz.back}
                </button>
                {recommended && (
                  <div className="mb-6 inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full">
                    <Check className="w-4 h-4" />
                    {t.quiz.recommendation}:{' '}
                    {language === 'en' ? recommended.name_en : recommended.name_nl}
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-6">{t.quiz.formTitle}</h3>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder={t.quiz.namePlaceholder}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <Input
                    type="email"
                    placeholder={t.quiz.emailPlaceholder}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                  <Input
                    type="tel"
                    placeholder={t.quiz.phonePlaceholder}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Spinner size="sm" className="text-slate-900" />
                        {t.quiz.submitting}
                      </span>
                    ) : (
                      t.quiz.submit
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white text-slate-900 rounded-3xl p-12 shadow-2xl"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t.quiz.successTitle}</h3>
                <p className="text-slate-600 mb-8">{t.quiz.successDesc}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/client-register">
                    <Button size="lg">{t.quiz.createAccount}</Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg">
                      {t.quiz.contactUs}
                    </Button>
                  </Link>
                </div>
                <button
                  onClick={handleRestart}
                  className="mt-8 text-slate-500 hover:text-slate-900 text-sm font-medium underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 transition-all"
                >
                  {t.quiz.restart}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
