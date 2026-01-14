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
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#services" className="text-sm font-medium text-slate-600 hover:text-slate-900">{t.navbar.services}</Link>
          <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">{t.navbar.pricing}</Link>
          <Link href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900">{t.navbar.about}</Link>
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