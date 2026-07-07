'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchPublicSettings, DEFAULT_PUBLIC_SETTINGS, type PublicSettings } from '../lib/public-settings';

const PERMIT_LINKS = [
  { href: '/exploitatievergunning', label: 'Exploitatievergunning' },
  { href: '/alcoholvergunning', label: 'Alcoholvergunning' },
  { href: '/terrasvergunning', label: 'Terrasvergunning' },
  { href: '/bibob', label: 'Bibob-toets' },
];

export function Footer() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);

  useEffect(() => {
    fetchPublicSettings().then(setSettings);
  }, []);

  const telHref = `tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`;

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <span className="text-lg font-bold">HorecaVergunning</span>
            </div>
            <p className="text-sm">{t.footer.tagline}</p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{t.footer.services}</h4>
            <ul className="space-y-2 text-sm">
              {PERMIT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-amber-500 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/vergunningen" className="hover:text-amber-500 transition-colors">
                  {t.services.viewAll || 'Alle vergunningen'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{t.footer.company}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#services" className="hover:text-amber-500 transition-colors">{t.navbar.services}</Link></li>
              <li><Link href="/#faq" className="hover:text-amber-500 transition-colors">{t.navbar.faq}</Link></li>
              <li><Link href="/blog" className="hover:text-amber-500 transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-amber-500 transition-colors">{t.footer.contact}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{t.footer.contact}</h4>
            <ul className="space-y-2 text-sm">
              <li>{settings.contactAddress}</li>
              <li className="pt-2">
                <a href={telHref} className="hover:text-amber-500 transition-colors">
                  {settings.contactPhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-amber-500 transition-colors">
                  {settings.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">{t.footer.rights}</div>
        </div>
      </div>
    </footer>
  );
}
