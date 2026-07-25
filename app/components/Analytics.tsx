'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Script from 'next/script';
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  parseConsent,
  subscribeConsent,
} from '@/app/lib/consent';

const GA_ID = 'G-V9T4HXT3C0';

/**
 * Google Analytics, loaded ONLY after the visitor consents.
 *
 * This used to sit unconditionally in the root layout, so _ga and _ga_<id>
 * were written on first paint with nothing asked — analytics cookies are not
 * strictly necessary, so under the AVG/ePrivacy that needs prior consent.
 * Blocking the script outright (rather than loading it in a "denied" consent
 * mode) is the version that is simplest to defend: no request to Google is
 * made at all until the visitor opts in.
 */
export function Analytics() {
  const raw = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );
  const consent = useMemo(() => parseConsent(raw), [raw]);

  if (!consent?.analytics) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
