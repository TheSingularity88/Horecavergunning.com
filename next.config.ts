import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * Deliberate trade-off on `'unsafe-inline'` in script-src: the strict
 * alternative is a per-request nonce, but nonces force every page to render
 * dynamically, which would drop the static/ISR generation the marketing and
 * permit pages rely on. Those pages are the organic-lead engine, so trading
 * their Core Web Vitals for a stricter script policy is the wrong call here.
 * Hashes are not an option either — the JSON-LD blocks are generated per page
 * from live data, so their hashes are not stable.
 *
 * What this still buys us: no third-party script origins beyond Google
 * Analytics, no framing (clickjacking), no plugins/objects, no base-tag
 * hijacking, and form posts locked to our own origin.
 */
const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  // GA (gtag) plus the inline gtag config and per-page JSON-LD blocks.
  // 'unsafe-eval' is DEV ONLY: React uses eval() for debugging features in
  // development and never in production, so it must not reach the real site.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  // Tailwind/framer-motion write inline styles; next/font injects a <style>.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com",
  "font-src 'self' data:",
  // Supabase REST/auth/storage/realtime + GA collect endpoints.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  // Redundant with frame-ancestors on modern browsers; still worth sending.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework to scanners looking for version-specific CVEs.
  poweredByHeader: false,

  async headers() {
    // Keep the private portal + auth routes out of search indexes.
    const noindex = {
      key: "X-Robots-Tag",
      value: "noindex, nofollow",
    };
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/dashboard/:path*", headers: [noindex] },
      { source: "/client/:path*", headers: [noindex] },
      { source: "/login", headers: [noindex] },
      { source: "/client-register", headers: [noindex] },
      { source: "/forgot-password", headers: [noindex] },
      { source: "/reset-password", headers: [noindex] },
    ];
  },
};

export default nextConfig;
