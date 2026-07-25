import { MetadataRoute } from 'next';
import { SITE_URL } from '@/app/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/client/', '/login', '/client-register', '/forgot-password', '/reset-password', '/api/'],
    },
    // Derived from SITE_URL so it can never point at a host that redirects.
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
