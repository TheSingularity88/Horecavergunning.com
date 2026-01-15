'use client';
import Link from 'next/link';
import { ShieldCheck, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <span className="text-lg font-bold">HorecaVergunning</span>
            </div>
            <p className="text-sm">
              {t.footer.tagline}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">{t.footer.services}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-amber-500 transition-colors">Permits & Bibob</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Legal Contracts</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Financial Admin</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Renovation Project</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{t.footer.company}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-amber-500 transition-colors">{t.navbar.about}</a></li>
              <li><a href="#faq" className="hover:text-amber-500 transition-colors">{t.navbar.faq}</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Careers</a></li>
              <li><Link href="/blog" className="hover:text-amber-500 transition-colors">Blog</Link></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">{t.footer.contact}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{t.footer.contact}</h4>
            <ul className="space-y-2 text-sm">
              <li>Keizersgracht 123</li>
              <li>1015 CJ Amsterdam</li>
              <li className="pt-2">020 - 123 45 67</li>
              <li>info@horecavergunning.nl</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            {t.footer.rights}
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}