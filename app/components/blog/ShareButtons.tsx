'use client';
import { Facebook, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

export default function ShareButtons() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center space-x-2 my-6">
      <span className="text-sm font-semibold text-slate-700 mr-2">{t.blog.share_article}</span>
      <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" aria-label="Share on Facebook">
        <Facebook className="w-4 h-4" />
      </button>
      <button className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors" aria-label="Share on Twitter">
        <Twitter className="w-4 h-4" />
      </button>
      <button className="p-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors" aria-label="Share on LinkedIn">
        <Linkedin className="w-4 h-4" />
      </button>
      <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors" aria-label="Share on WhatsApp">
        <MessageCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
