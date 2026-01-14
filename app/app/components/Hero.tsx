'use client';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-32 pb-16 md:pt-48 md:pb-32 bg-slate-900 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-800/50 skew-x-12 transform origin-top-right" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Now accepting new clients for 2026
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Focus on Your Guests. <br/>
              <span className="text-amber-500">We Handle the Government.</span>
            </h1>
            
            <p className="text-lg text-slate-300 max-w-xl">
              Complete legal, financial, and permit support for Dutch hospitality entrepreneurs. 
              Fixed monthly rates. No hourly surprises.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2">
                Book Free Intake <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-white border-slate-700 hover:bg-slate-800 hover:text-white">
                View Packages
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span>Fixed Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span>24/7 Support</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 w-full"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl">
              {/* Abstract Dashboard UI Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                   <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
                   <div className="h-8 w-8 rounded-full bg-amber-500/20" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 h-32 bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="h-2 w-12 bg-amber-500/50 rounded" />
                    <div className="h-6 w-20 bg-slate-600 rounded" />
                  </div>
                  <div className="flex-1 h-32 bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="h-2 w-12 bg-green-500/50 rounded" />
                    <div className="h-6 w-20 bg-slate-600 rounded" />
                  </div>
                </div>
                <div className="h-full bg-slate-700/30 rounded-lg border border-slate-600/50 p-4">
                   <div className="h-3 w-3/4 bg-slate-600 rounded mb-2" />
                   <div className="h-3 w-1/2 bg-slate-600 rounded" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
