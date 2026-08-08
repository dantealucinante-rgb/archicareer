import type { MetadataRoute } from "next";
import { searchProfiles } from "@/lib/queries/profiles";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const { data: profiles } = await searchProfiles(
        {},
        { limit: 1000, offset: 0 },
        { sortBy: "created_at", ascending: false },
    );

    const staticPages: MetadataRoute.Sitemap = [
        { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
        { url: absoluteUrl("/discover"), changeFrequency: "daily", priority: 0.8 },
        { url: absoluteUrl("/jobs"), changeFrequency: "daily", priority: 0.9 },
        { url: absoluteUrl("/feed"), changeFrequency: "hourly", priority: 0.8 },
        { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
        { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
        { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
    ];

    const profilePages: MetadataRoute.Sitemap = (profiles ?? []).map((profile) => ({
        url: absoluteUrl(`/p/${profile.slug}`),
        lastModified: profile.updated_at,
        changeFrequency: "weekly",
        priority: profile.role === "firm" ? 0.8 : 0.7,
    }));

    return [...staticPages, ...profilePages];
}
