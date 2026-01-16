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
      images: [
        {
          url: post.image,
          alt: content.title,
        },
      ],
      publishedTime,
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.excerpt,
      images: [post.image],
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
    image: [new URL(post.image, SITE_URL).toString()],
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
