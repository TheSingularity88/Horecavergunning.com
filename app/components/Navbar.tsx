'use client';
import Link from 'next/link';
import { Button } from './ui/Button';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-amber-500" />
          <span className="text-xl font-bold text-slate-900">HorecaVergunning</span>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <Link href="#services" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.services}</Link>
          <Link href="#pricing" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.pricing}</Link>
          <Link href="#faq" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.faq}</Link>
          <Link href="#about" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.about}</Link>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            {t.navbar.login}
          </Button>
          <Button>{t.navbar.book}</Button>
        </div>
      </div>
    </nav>
  );
}