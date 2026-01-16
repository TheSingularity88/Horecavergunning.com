import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME } from "../lib/site";

const title = "HorecaKennis & Nieuws";
const description =
  "Praktische artikelen en updates over horecavergunningen, Bibob, exploitatie en ondernemen in de horeca.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title,
    description,
    url: "/blog",
    siteName: SITE_NAME,
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
