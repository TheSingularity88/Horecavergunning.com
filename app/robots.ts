import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/client/', '/login', '/client-register', '/forgot-password', '/reset-password', '/api/'],
    },
    sitemap: 'https://horecavergunning.com/sitemap.xml',
  };
}
