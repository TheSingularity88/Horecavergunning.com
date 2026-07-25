'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  clearAnalyticsCookies,
  getConsentServerSnapshot,
  getConsentSnapshot,
  isConsentUnknown,
  parseConsent,
  subscribeConsent,
  writeConsent,
} from '@/app/lib/consent';

/** Any component can ask for the banner back: window.dispatchEvent(new Event(OPEN_CONSENT_EVENT)) */
export const OPEN_CONSENT_EVENT = 'hv:open-consent';

/**
 * Cookie consent banner.
 *
 * Deliberate compliance choices, because the Autoriteit Persoonsgegevens is
 * strict about exactly these:
 *  - "Weigeren" and "Accepteren" are the same size, weight and prominence —
 *    a refuse button that is harder to find than accept is a dark pattern and
 *    invalidates the consent.
 *  - Nothing is pre-ticked; no choice is stored until the visitor picks one.
 *  - Dismissing without choosing is not consent, so there is no bare "×".
 *  - The site stays fully usable behind the banner (no cookie wall) — it is a
 *    bar, not a blocking modal, and it does not trap focus.
 */
export function CookieConsent() {
  const { t } = useLanguage();
  // Consent is external (a cookie), so it is read as an external store rather
  // than synced into state by an effect.
  const raw = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );
  const consent = useMemo(() => parseConsent(raw), [raw]);
  // Only for re-opening the banner after a choice was already recorded.
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  const choose = useCallback((analytics: boolean) => {
    if (!analytics) {
      // Withdrawing has to actually remove what was already set, otherwise the
      // "revoke" is cosmetic.
      clearAnalyticsCookies();
    }
    writeConsent(analytics);
    setReopened(false);
  }, []);

  // Nothing renders until we have actually read the cookie, so a visitor who
  // already chose never sees the banner flash before hydration removes it.
  const visible = !isConsentUnknown(raw) && (reopened || !consent);
  if (!visible) return null;

  const c = t.cookies;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
            <Cookie className="w-5 h-5 text-amber-600" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="cookie-consent-title" className="font-semibold text-slate-900">
              {c.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              {c.body}{' '}
              <Link href="/cookies" className="text-amber-600 hover:text-amber-700 underline">
                {c.readMore}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          {/* Equal prominence on purpose — same variant, same size, same width. */}
          <button
            type="button"
            onClick={() => choose(false)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            {c.refuse}
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            {c.accept}
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">{c.necessaryNote}</p>
      </div>
    </div>
  );
}

/** Footer entry point so a visitor can change their mind later. */
export function CookiePreferencesLink({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={className}
    >
      {t.cookies.managePreferences}
    </button>
  );
}
