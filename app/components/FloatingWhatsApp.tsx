'use client';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchPublicSettings, DEFAULT_PUBLIC_SETTINGS } from '../lib/public-settings';

export function FloatingWhatsApp() {
  const { t } = useLanguage();
  const [number, setNumber] = useState(DEFAULT_PUBLIC_SETTINGS.whatsappNumber);

  useEffect(() => {
    fetchPublicSettings().then((s) => setNumber(s.whatsappNumber.replace(/\D/g, '')));
  }, []);

  // No configured number means no button. Rendering it anyway pointed every
  // visitor at https://wa.me/ with a placeholder number — at best a dead end,
  // at worst a stranger's WhatsApp receiving our customers' enquiries.
  if (!number) return null;

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center gap-2"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="font-bold hidden md:inline">{t.whatsapp}</span>
    </a>
  );
}
