import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import Script from 'next/script';
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
    card: "summary",
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
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-V9T4HXT3C0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-V9T4HXT3C0');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
