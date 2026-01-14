'use client';
import { useState } from 'react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Quiz() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  
  const questions = [
    {
      question: t.quiz.q1,
      options: t.quiz.q1_opt
    },
    {
      question: t.quiz.q2,
      options: t.quiz.q2_opt
    },
    {
      question: t.quiz.q3,
      options: t.quiz.q3_opt
    }
  ];

  const handleOptionClick = () => {
    if (step < questions.length) {
      setStep(step + 1);
    }
  };

  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16549766b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-10" />
      
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
                <div className="mb-8">
                  <span className="text-amber-500 font-medium uppercase tracking-widest text-sm">{t.quiz.step_label} {step + 1}/{questions.length}</span>
                  <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-12">{questions[step].question}</h2>
                  
                  <div className="grid gap-4 max-w-md mx-auto">
                    {questions[step].options.map((option, i) => (
                      <button
                        key={i}
                        onClick={handleOptionClick}
                        className="group flex items-center justify-between p-6 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-amber-500 hover:border-amber-500 transition-all duration-300 text-left"
                      >
                        <span className="text-lg font-medium group-hover:text-slate-900">{option}</span>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white text-slate-900 rounded-3xl p-12 shadow-2xl"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t.quiz.result_title}</h3>
                <p className="text-slate-600 mb-8" dangerouslySetInnerHTML={{ __html: t.quiz.result_desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg">{t.quiz.result_cta}</Button>
                  <Button variant="outline" size="lg">{t.quiz.result_download}</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
}