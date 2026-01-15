import { notFound } from 'next/navigation';
import { blogPosts } from '@/app/lib/blog-data';
import BlogPostContent from './BlogPostContent';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts.filter(p => p.slug !== slug).slice(0, 2);

  return <BlogPostContent post={post} relatedPosts={relatedPosts} />;
}
