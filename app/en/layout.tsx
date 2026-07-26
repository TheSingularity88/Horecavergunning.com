import { LanguageProvider } from '@/app/context/LanguageContext';

/**
 * English subtree.
 *
 * Wrapping in a provider with an explicit locale means these pages render
 * English on the SERVER. That is the entire point of giving English its own
 * URLs: with the old cookie-only approach a crawler always received the Dutch
 * version no matter which language a human had chosen, so the English content
 * was unindexable and hreflang was impossible.
 *
 * The nested provider shadows the cookie-driven one from the root layout for
 * everything below /en.
 */
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider locale="en">{children}</LanguageProvider>;
}
