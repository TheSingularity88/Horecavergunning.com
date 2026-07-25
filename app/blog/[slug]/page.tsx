import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts } from "@/app/lib/blog-data";
import BlogPostContent from "./BlogPostContent";
import { SITE_NAME, SITE_URL } from "@/app/lib/site";

const toIsoDate = (value: string) => {
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) {
    return new Date().toISOString();
  }
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Artikel niet gevonden",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const content = post.content.nl;
  const publishedTime = toIsoDate(post.date);
  const url = `/blog/${post.slug}`;

  return {
    title: content.title,
    description: content.excerpt,
    authors: [{ name: post.author }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      title: content.title,
      description: content.excerpt,
      url,
      siteName: SITE_NAME,
      locale: "nl_NL",
      // No explicit `images` here on purpose: an explicit entry overrides the
      // file-based opengraph-image.tsx in this folder, and the old value
      // pointed at an SVG, which no social platform renders. Letting the
      // convention win gives every article a real generated PNG card.
      publishedTime,
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts.filter(p => p.slug !== slug).slice(0, 2);
  const content = post.content.nl;
  const publishedTime = toIsoDate(post.date);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: content.title,
    description: content.excerpt,
    datePublished: publishedTime,
    dateModified: publishedTime,
    author: {
      "@type": "Person",
      name: post.author,
    },
    // Points at the generated PNG, not the /blog/*.svg illustration — Google's
    // image surfaces reject SVG, so the old value made this field dead weight.
    image: [`${SITE_URL}/blog/${post.slug}/opengraph-image`],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostContent post={post} relatedPosts={relatedPosts} />
    </>
  );
}
