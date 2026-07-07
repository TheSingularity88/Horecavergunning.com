'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, Language } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'hv_lang';

function readStoredLanguage(): Language | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)hv_lang=(nl|en)/);
  if (match) return match[1] as Language;
  const ls = window.localStorage.getItem(STORAGE_KEY);
  return ls === 'nl' || ls === 'en' ? ls : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR renders the default ('nl') to match hydration; the stored preference is
  // applied on mount below.
  const [language, setLanguageState] = useState<Language>('nl');

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored && stored !== language) {
      setLanguageState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof document !== 'undefined') {
      // 1-year cookie so both server and client can read the preference.
      document.cookie = `hv_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
