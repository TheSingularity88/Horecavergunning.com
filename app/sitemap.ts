import { MetadataRoute } from "next";
import { blogPosts } from "./lib/blog-data";
import { SITE_URL } from "./lib/site";
import { PERMIT_SLUGS } from "./lib/permit-content";
import { createPublicClient } from "./lib/supabase/public";

const toIsoDate = (value: string) => {
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) {
    return new Date();
  }
  return new Date(Date.UTC(year, month - 1, day));
};

// Only include permit pages that are both active in the DB and have content.
async function activePermitSlugs(): Promise<string[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("permit_types")
      .select("slug")
      .eq("is_active", true);
    const active = new Set((data || []).map((r) => (r as { slug: string }).slug));
    return PERMIT_SLUGS.filter((s) => active.has(s));
  } catch {
    return PERMIT_SLUGS;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const blogEntries = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: toIsoDate(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const permitEntries = (await activePermitSlugs()).map((slug) => ({
    url: `${base}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/vergunningen`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...permitEntries,
    {
      url: `${base}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
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
