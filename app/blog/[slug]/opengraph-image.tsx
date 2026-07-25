import { ImageResponse } from 'next/og';
import { blogPosts } from '@/app/lib/blog-data';

export const alt = 'HorecaVergunning.com — artikel';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

/**
 * Per-article social card, rendered as a real PNG.
 *
 * The posts referenced /blog/*.svg for og:image and for the BlogPosting
 * `image` field. No social platform (Facebook, LinkedIn, X) and no Google image
 * surface accepts SVG, so every share of an article rendered as a bare link and
 * the schema image was silently invalid. Generating the card here also means
 * the card always matches the headline instead of a stock illustration.
 */
export default async function BlogOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  const title = post?.content.nl.title ?? 'HorecaVergunning.com';
  const category = post?.content.nl.category ?? 'Horeca';
  const readTime = post?.content.nl.readTime ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0f172a',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <span style={{ color: '#ffffff', fontSize: 30, fontWeight: 700 }}>
            Horeca<span style={{ color: '#f59e0b' }}>Vergunning</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              color: '#0f172a',
              background: '#f59e0b',
              fontSize: 22,
              fontWeight: 700,
              borderRadius: 999,
              padding: '8px 20px',
            }}
          >
            {category}
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: title.length > 70 ? 48 : 58,
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', color: '#94a3b8', fontSize: 24 }}>
          {[post?.author, readTime].filter(Boolean).join('  ·  ')}
        </div>
      </div>
    ),
    { ...size }
  );
}
