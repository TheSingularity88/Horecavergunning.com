import { MetadataRoute } from "next";
import { blogPosts } from "./lib/blog-data";
import { SITE_URL } from "./lib/site";

const toIsoDate = (value: string) => {
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) {
    return new Date();
  }
  return new Date(Date.UTC(year, month - 1, day));
};

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const blogEntries = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: toIsoDate(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogEntries,
  ];
}
