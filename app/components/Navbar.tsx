'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { ShieldCheck, ChevronDown, Menu, User, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AnimatePresence, motion } from 'framer-motion';

export function Navbar() {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      {/* Desktop Navbar */}
      <div className="hidden md:flex container mx-auto px-4 h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
            <span className="text-xl font-bold text-slate-900">HorecaVergunning</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/#services" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.services}</Link>
          <Link href="/#pricing" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.pricing}</Link>
          <Link href="/#faq" className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">{t.navbar.faq}</Link>
          
          <div className="relative group">
            <button className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">
              {t.navbar.about}
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

      {/* Mobile Navbar */}
      <div className="md:hidden container mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Left: Hamburger Menu */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
           {/* Pointer events none to allow clicks to pass through if overlapping invisible areas, though content should be clicked. 
               Actually, we want the logo to be clickable. pointer-events-auto for the link. */}
          <Link href="/" className="flex items-center gap-2 pointer-events-auto" onClick={() => setIsMobileMenuOpen(false)}>
            <ShieldCheck className="w-8 h-8 text-amber-500" />
            <span className="text-xl font-bold text-slate-900">HorecaVergunning</span>
          </Link>
        </div>

        {/* Right: Language + User/Login Icon */}
        <div className="flex items-center gap-1 -mr-2 z-20 relative">
          <LanguageSwitcher compact={true} />
          
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="User menu"
            >
              <User className="w-6 h-6" />
            </button>

            {/* User Dropdown */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-20 origin-top-right overflow-hidden"
                  >
                    <div className="py-1">
                      <Link 
                        href="/login" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-amber-600 border-b border-slate-50"
                      >
                        {t.navbar.login}
                      </Link>
                      <Link 
                        href="/#book" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-amber-600"
                      >
                        {t.navbar.book}
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-xl md:hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between h-16">
                 <span className="font-bold text-lg text-slate-900">Menu</span>
                 <button 
                   onClick={() => setIsMobileMenuOpen(false)} 
                   className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4">
                <div className="flex flex-col">
                  <Link href="/#services" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-50 hover:text-amber-600 transition-colors border-b border-slate-50">{t.navbar.services}</Link>
                  <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-50 hover:text-amber-600 transition-colors border-b border-slate-50">{t.navbar.pricing}</Link>
                  <Link href="/#faq" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-50 hover:text-amber-600 transition-colors border-b border-slate-50">{t.navbar.faq}</Link>
                  
                  <div className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">{t.navbar.about}</span>
                      <Link href="/#about" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium hover:text-amber-600">Onze Missie</Link>
                      <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium hover:text-amber-600">Blog & Nieuws</Link>
                      <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium hover:text-amber-600">{t.navbar.pricing}</Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
