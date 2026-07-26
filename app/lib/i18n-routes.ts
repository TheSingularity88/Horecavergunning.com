import type { Language } from '@/app/lib/translations';
import { SITE_URL } from '@/app/lib/site';

/**
 * URL strategy: Dutch is the default locale and lives at the ROOT
 * (/exploitatievergunning), English is prefixed (/en/exploitatievergunning).
 *
 * Dutch keeps its existing URLs on purpose. Moving them to /nl/* would mean
 * 301-ing every page that currently ranks, risking the rankings that matter
 * most, for a purely cosmetic symmetry.
 *
 * Paths MIRROR each other — the English route is exactly the Dutch route with
 * an /en prefix. The permit slugs stay Dutch because the Dutch term is what
 * people search for and what the gemeente calls it on the actual forms; an
 * expat looking this up types "exploitatievergunning" too. Mirroring also makes
 * the hreflang pairs and the language switcher trivially correct rather than
 * a lookup table that can drift.
 */
export const DEFAULT_LOCALE: Language = 'nl';
export const LOCALES: Language[] = ['nl', 'en'];

/** hreflang values. Dutch as spoken in NL; English unqualified (any region). */
export const HREFLANG: Record<Language, string> = {
  nl: 'nl-NL',
  en: 'en',
};

/** Strip the /en prefix to get the shared, locale-independent path. */
export function toBasePath(pathname: string): string {
  if (pathname === '/en') return '/';
  return pathname.startsWith('/en/') ? pathname.slice(3) : pathname;
}

/** The path for a given locale. Dutch is unprefixed, English is /en-prefixed. */
export function localePath(basePath: string, locale: Language): string {
  const clean = basePath === '' ? '/' : basePath;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === '/' ? '/en' : `/en${clean}`;
}

export function localeFromPathname(pathname: string): Language {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'nl';
}

/**
 * `alternates` for Next metadata: a self-referencing canonical plus both
 * language versions and an x-default.
 *
 * x-default points at Dutch: it is the primary market, and it is what an
 * unmatched visitor should land on.
 */
export function alternatesFor(basePath: string, locale: Language) {
  const nl = localePath(basePath, 'nl');
  const en = localePath(basePath, 'en');
  return {
    canonical: localePath(basePath, locale),
    languages: {
      'nl-NL': nl,
      en,
      'x-default': nl,
    },
  };
}

/** Absolute URLs for both versions — used by the sitemap. */
export function absoluteAlternates(basePath: string) {
  return {
    nl: `${SITE_URL}${localePath(basePath, 'nl')}`,
    en: `${SITE_URL}${localePath(basePath, 'en')}`,
  };
}

/**
 * Short label for a permit card.
 *
 * The old code stripped the Dutch words " aanvragen" and " in Amsterdam" off
 * the h1, which silently does nothing to an English headline and left the full
 * sentence in the card. Trim per language instead.
 */
export function shortPermitLabel(h1: string, locale: Language): string {
  if (locale === 'en') {
    return h1
      .replace(/^Appl(?:y|ying) for (?:an?|the) /i, '')
      .replace(/ in Amsterdam$/i, '')
      .replace(/^./, (c) => c.toUpperCase());
  }
  return h1.replace(' aanvragen', '').replace(' in Amsterdam', '');
}
