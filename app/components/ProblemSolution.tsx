'use client';
import { XCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function ProblemSolution() {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problem */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="p-2 bg-red-100 rounded-lg text-red-600"><XCircle size={20} /></span>
              {t.problem_solution.problem_title}
            </h3>
            <ul className="space-y-4 text-slate-600">
              <li className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{t.problem_solution.problem_1}</span>
              </li>
              <li className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{t.problem_solution.problem_2}</span>
              </li>
              <li className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{t.problem_solution.problem_3}</span>
              </li>
            </ul>
          </div>

          {/* Solution */}
          <div className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <span className="p-2 bg-amber-500 rounded-lg text-slate-900"><CheckCircle size={20} /></span>
              {t.problem_solution.solution_title}
            </h3>
            <ul className="space-y-4 text-slate-300 relative z-10">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>{t.problem_solution.solution_1}</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>{t.problem_solution.solution_2}</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>{t.problem_solution.solution_3}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}