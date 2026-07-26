import { MetadataRoute } from "next";
import { blogPosts } from "./lib/blog-data";
import { SITE_URL } from "./lib/site";
import { PERMIT_SLUGS, PERMIT_SLUGS_EN } from "./lib/permit-content";
import { STARTEN_SLUG } from "./lib/starten-content";
import { createPublicClient } from "./lib/supabase/public";

const toIsoDate = (value: string) => {
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) {
    return CONTENT_LAST_UPDATED;
  }
  return new Date(Date.UTC(year, month - 1, day));
};

/**
 * When the marketing/permit copy was last materially changed.
 *
 * These entries used to report `new Date()`, i.e. build time — so every deploy,
 * including one that only touched the client portal, told Google that every
 * page had just changed. Crawlers learn to distrust a lastmod that always says
 * "just now", and it wastes crawl budget re-fetching identical pages.
 *
 * Bump this by hand when the permit or homepage copy actually changes.
 */
const CONTENT_LAST_UPDATED = new Date(Date.UTC(2026, 6, 26));

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

  const newestPostDate = blogEntries.reduce<Date>(
    (newest, entry) => (entry.lastModified > newest ? entry.lastModified : newest),
    CONTENT_LAST_UPDATED
  );

  const active = await activePermitSlugs();

  const permitEntries = active.map((slug) => ({
    url: `${base}/${slug}`,
    lastModified: CONTENT_LAST_UPDATED,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  // English pages, listed only for slugs that actually have English copy.
  // Advertising an English URL we do not serve would just generate 404s in
  // Search Console.
  const englishEntries = [
    {
      url: `${base}/en`,
      lastModified: CONTENT_LAST_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${base}/en/vergunningen`,
      lastModified: CONTENT_LAST_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${base}/en/contact`,
      lastModified: CONTENT_LAST_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    {
      url: `${base}/en/${STARTEN_SLUG}`,
      lastModified: CONTENT_LAST_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${base}/en/blog`,
      lastModified: newestPostDate,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    ...active
      .filter((slug) => PERMIT_SLUGS_EN.includes(slug))
      .map((slug) => ({
        url: `${base}/en/${slug}`,
        lastModified: CONTENT_LAST_UPDATED,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    // Only posts that actually have an English body.
    ...blogPosts
      .filter((post) => (post.content.en?.body ?? "").trim().length > 0)
      .map((post) => ({
        url: `${base}/en/blog/${post.slug}`,
        lastModified: toIsoDate(post.date),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
  ];

  return [
    {
      url: base,
      lastModified: CONTENT_LAST_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/vergunningen`,
      lastModified: CONTENT_LAST_UPDATED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...permitEntries,
    {
      url: `${base}/${STARTEN_SLUG}`,
      lastModified: CONTENT_LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/contact`,
      lastModified: CONTENT_LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${base}/blog`,
      // The index is only as fresh as its newest post.
      lastModified: newestPostDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogEntries,
    ...englishEntries,
  ];
}
