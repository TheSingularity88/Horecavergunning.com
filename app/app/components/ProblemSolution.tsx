import { XCircle, CheckCircle } from 'lucide-react';

export function ProblemSolution() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problem */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="p-2 bg-red-100 rounded-lg text-red-600"><XCircle size={20} /></span>
              The Struggle
            </h3>
            <ul className="space-y-4 text-slate-600">
              <li className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>Endless paperwork and unclear government forms</span>
              </li>
              <li className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>Stress about Bibob investigations and inspections</span>
              </li>
              <li className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>Unpredictable legal costs and hourly bills</span>
              </li>
            </ul>
          </div>

          {/* Solution */}
          <div className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <span className="p-2 bg-amber-500 rounded-lg text-slate-900"><CheckCircle size={20} /></span>
              The Horeca Brigade Way
            </h3>
            <ul className="space-y-4 text-slate-300 relative z-10">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>We handle all filings, permits, and deadlines</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>Proactive Bibob management and compliance checks</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>Fixed monthly fee. Unlimited advice. Peace of mind.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
