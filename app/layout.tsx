import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import { Analytics } from "./components/Analytics";
import { CookieConsent } from "./components/CookieConsent";
import { SITE_NAME, SITE_URL } from "./lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title =
  "Horecavergunning & Exploitatievergunning Aanvragen | HorecaVergunning.com";
const description =
  "Professionele hulp bij uw horecavergunning en exploitatievergunning aanvragen. Wij regelen uw Bibob toets, alcoholvergunning en administratie. Vaste tarieven, geen verrassingen.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: "%s | HorecaVergunning.com",
  },
  description,
  keywords: [
    "horecavergunning",
    "exploitatievergunning",
    "horeca vergunning aanvragen",
    "bibob horeca",
    "alcoholvergunning",
    "drank en horecavergunning",
    "horeca starten",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: SITE_NAME,
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
          {/* Analytics mounts only after consent; the banner is what grants it.
              Previously gtag sat in <head> and ran unconditionally, so _ga and
              _ga_<id> were written on first paint with nothing asked. */}
          <Analytics />
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
