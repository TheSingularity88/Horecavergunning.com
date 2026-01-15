'use client';
import Link from 'next/link';
import { Button } from './ui/Button';
import { ShieldCheck, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
            <span className="text-xl font-bold text-slate-900">HorecaVergunning</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <Link href="/#services" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.services}</Link>
          <Link href="/#pricing" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.pricing}</Link>
          <Link href="/#faq" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.faq}</Link>
          
          <div className="relative group">
            <button className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">
              Over ons
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top translate-y-2 group-hover:translate-y-0">
              <div className="py-2">
                <Link href="/#about" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-amber-600">Onze Missie</Link>
                <Link href="/blog" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-amber-600">Blog & Nieuws</Link>
                <Link href="/#contact" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-amber-600">Contact</Link>
              </div>
            </div>
          </div>
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