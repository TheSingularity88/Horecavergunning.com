// MUST match the host that actually serves the site. Vercel 301-redirects
// horecavergunning.com -> www.horecavergunning.com, so www is canonical.
// With the non-www value here, every <link rel="canonical">, og:url and
// sitemap entry pointed at a URL that redirects — telling Google to
// canonicalise to a redirect and filling the sitemap with 301s.
export const SITE_URL = "https://www.horecavergunning.com";
export const SITE_NAME = "HorecaVergunning.com";
