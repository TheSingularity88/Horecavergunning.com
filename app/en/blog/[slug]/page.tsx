import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostPage, { generateMetadata as postMetadata } from '@/app/blog/[slug]/page';
import { blogPosts } from '@/app/lib/blog-data';

/**
 * English article pages.
 *
 * Only posts with a real English body are published. Every current post has
 * one, but the guard is what stops a future Dutch-only post from appearing
 * under an English URL with empty or Dutch content.
 */
const englishPosts = blogPosts.filter((p) => (p.content.en?.body ?? '').trim().length > 0);

export function generateStaticParams() {
  return englishPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!englishPosts.some((p) => p.slug === slug)) return {};
  return postMetadata({ params, locale: 'en' });
}

export default async function EnglishBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!englishPosts.some((p) => p.slug === slug)) notFound();
  return <BlogPostPage params={params} locale="en" />;
}
