import { Check } from 'lucide-react';
import { Button } from './ui/Button';

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Transparent, Fixed Monthly Rates</h2>
          <p className="text-slate-600">No hourly billing. Choose the package that fits your stage.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          
          {/* Starter */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900">Starter</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-slate-900">€295</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-600 mb-6">Essential compliance for new venues.</p>
            <Button variant="outline" className="w-full mb-8">Get Started</Button>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> Permit Application</li>
              <li className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> Basic Administration</li>
              <li className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> Quarterly Tax Filing</li>
            </ul>
          </div>

          {/* Growth (Highlight) */}
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl relative transform md:-translate-y-4">
            <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500 rounded-t-2xl" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-xs font-bold px-3 py-1 rounded-full text-slate-900 uppercase tracking-wide">
              Most Popular
            </div>
            
            <h3 className="font-bold text-lg text-white">Growth</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-white">€495</span>
              <span className="text-slate-400">/mo</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">Full peace of mind for established businesses.</p>
            <Button className="w-full mb-8">Get Started</Button>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-3"><Check className="w-4 h-4 text-amber-500" /> Everything in Starter</li>
              <li className="flex gap-3"><Check className="w-4 h-4 text-amber-500" /> Monthly Financial Reports</li>
              <li className="flex gap-3"><Check className="w-4 h-4 text-amber-500" /> Unlimited Legal Advice</li>
              <li className="flex gap-3"><Check className="w-4 h-4 text-amber-500" /> Payroll (up to 5 staff)</li>
            </ul>
          </div>

          {/* Enterprise */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900">All-in</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-slate-900">Custom</span>
            </div>
            <p className="text-sm text-slate-600 mb-6">For groups and complex takeovers.</p>
            <Button variant="outline" className="w-full mb-8">Contact Sales</Button>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> Multi-venue Support</li>
              <li className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> Dedicated Account Manager</li>
              <li className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> M&A Support</li>
              <li className="flex gap-3"><Check className="w-4 h-4 text-green-500" /> Crisis Management</li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
