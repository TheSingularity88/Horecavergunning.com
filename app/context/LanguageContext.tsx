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

export function LanguageProvider({
  children,
  /**
   * When set, the URL decides the language and the cookie is ignored.
   *
   * The /en routes wrap their subtree in a provider with locale="en", so an
   * English page is English on the server too — which is the whole point of
   * having separate URLs. Without this the page would render Dutch on the
   * server and only flip after hydration, and a crawler would only ever see
   * the Dutch version.
   */
  locale,
}: {
  children: ReactNode;
  locale?: Language;
}) {
  // SSR renders the default ('nl') to match hydration; the stored preference is
  // applied on mount below. A route-provided locale wins over both.
  const [language, setLanguageState] = useState<Language>(locale ?? 'nl');

  useEffect(() => {
    if (locale) return; // URL is authoritative — never let the cookie override it.
    const stored = readStoredLanguage();
    if (stored && stored !== language) {
      setLanguageState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Keep <html lang> honest.
  //
  // The layout hardcodes lang="nl", so switching the UI to English left the
  // document still declaring Dutch. Screen readers pick a pronunciation from
  // this attribute, so an English page announced as Dutch is an accessibility
  // defect, and it is a wrong signal to crawlers too. Updated on the client
  // because the language lives in a cookie, and reading cookies during render
  // would make every page dynamic and lose static generation.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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
