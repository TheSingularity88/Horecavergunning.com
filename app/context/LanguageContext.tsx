'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { translations, Language } from '../lib/translations';

/**
 * Paths where the cookie still decides the language, because they have no
 * localized URL counterpart. The client portal and auth screens are noindex,
 * so giving them their own /en routes would buy nothing.
 */
const COOKIE_DRIVEN_PREFIXES = ['/dashboard', '/client', '/login', '/forgot-password', '/reset-password'];

function localeFromPath(pathname: string | null): Language | null {
  if (!pathname) return null;
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  if (COOKIE_DRIVEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null; // let the cookie decide
  }
  // Every other public path is the Dutch version by definition.
  return 'nl';
}

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
  // The URL is the source of truth for public pages.
  //
  // Deriving it here rather than only in the /en layout matters because
  // components rendered by the ROOT layout — the cookie banner, analytics —
  // sit outside that nested provider. Before this they always read Dutch, so
  // an English page showed a Dutch consent banner, and the root provider's
  // <html lang> effect overwrote the nested one's value with 'nl'.
  const pathname = usePathname();
  const routeLocale = locale ?? localeFromPath(pathname);

  const [language, setLanguageState] = useState<Language>(routeLocale ?? 'nl');

  // Keep in step when the route changes (client-side navigation).
  useEffect(() => {
    if (routeLocale && routeLocale !== language) setLanguageState(routeLocale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocale]);

  useEffect(() => {
    if (routeLocale) return; // URL is authoritative — never let the cookie override it.
    const stored = readStoredLanguage();
    if (stored && stored !== language) {
      setLanguageState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocale]);

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
