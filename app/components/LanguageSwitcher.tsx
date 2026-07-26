'use client';
import { useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { localePath, toBasePath } from '../lib/i18n-routes';
import type { Language } from '../lib/translations';

type FlagProps = {
  className?: string;
};

function FlagNL({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#1f4aa8" />
      <rect width="24" height="10.6667" fill="#ffffff" />
      <rect width="24" height="5.3333" fill="#d01c1f" />
    </svg>
  );
}

function FlagUK({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#1b3f8b" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#ffffff" strokeWidth="4" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#c11f2a" strokeWidth="2" />
      <rect x="10" width="4" height="16" fill="#ffffff" />
      <rect y="6" width="24" height="4" fill="#ffffff" />
      <rect x="10.75" width="2.5" height="16" fill="#c11f2a" />
      <rect y="6.75" width="24" height="2.5" fill="#c11f2a" />
    </svg>
  );
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const options = {
    nl: { label: 'Nederlands', Flag: FlagNL },
    en: { label: 'English', Flag: FlagUK },
  };
  const current = options[language] ?? options.nl;
  const CurrentFlag = current.Flag;
  const flagClasses = compact
    ? 'h-4 w-6 rounded-[3px] ring-1 ring-black/10'
    : 'h-4 w-6 rounded-[3px] ring-1 ring-black/10';

  const handleSelect = (next: Language) => {
    // NAVIGATE, don't just flip a cookie.
    //
    // Each language now has its own URL, so the URL is what decides the
    // language. On /en the cookie is ignored entirely, so the old
    // setLanguage-only behaviour left the visitor stranded on an English page
    // having asked for Dutch. Still writing the cookie so the preference
    // survives a later visit to a page that has no translated counterpart.
    setLanguage(next);
    detailsRef.current?.removeAttribute('open');

    const target = localePath(toBasePath(pathname || '/'), next);
    if (target !== pathname) router.push(target);
  };

  return (
    <details ref={detailsRef} className="relative">
      <summary
        className={`flex items-center ${compact ? 'rounded-md p-1.5' : 'rounded-full px-3 py-2 gap-2'} border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 [&::-webkit-details-marker]:hidden`}
      >
        <CurrentFlag className={flagClasses} />
        {!compact ? (
          <svg viewBox="0 0 20 20" className="h-3 w-3 text-slate-500" aria-hidden="true">
            <path d="M5 7.5 L10 12.5 L15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </summary>
      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        {(Object.keys(options) as Array<keyof typeof options>).map((code) => {
          const OptionFlag = options[code].Flag;
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleSelect(code)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
            >
              <OptionFlag className={flagClasses} />
              <span className="flex-1">{options[code].label}</span>
              {code === language ? (
                <svg viewBox="0 0 20 20" className="h-4 w-4 text-emerald-500" aria-hidden="true">
                  <path d="M4 10.5 L8.2 14.5 L16 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}
