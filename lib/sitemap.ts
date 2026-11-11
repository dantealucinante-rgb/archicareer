import { absoluteUrl } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/server";

const MAX_URLS_PER_SITEMAP = 45_000;
const PAGE_SIZE = 1_000;
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const URLSET_OPEN = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

type SitemapKind = "profiles" | "projects" | "jobs" | "firms" | "communities";
type SitemapItem = { loc: string; lastModified?: string | null };

const staticUrls = ["/", "/discover", "/jobs", "/feed", "/communities", "/about", "/pricing", "/waitlist", "/privacy", "/terms", "/cookies"];

function escapeXml(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function serializeUrlset(items: SitemapItem[]): string {
    const entries = items.map(({ loc, lastModified }) => `<url><loc>${escapeXml(loc)}</loc>${lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ""}</url>`).join("");
    return `${XML_HEADER}${URLSET_OPEN}${entries}</urlset>`;
}

async function countItems(kind: SitemapKind): Promise<number> {
    const supabase = createPublicClient();
    let query;
    if (kind === "profiles") {
        query = supabase.from("profiles").select("id", { count: "exact", head: true }).eq("search_indexable", true).eq("account_status", "active");
    } else if (kind === "projects") {
        query = supabase.from("portfolio_items").select("id, profiles!inner(id)", { count: "exact", head: true }).eq("moderation_status", "active").eq("profiles.search_indexable", true).eq("profiles.account_status", "active");
    } else if (kind === "jobs") {
        query = supabase.from("job_listings").select("id", { count: "exact", head: true }).eq("status", "open").eq("moderation_status", "active");
    } else if (kind === "firms") {
        query = supabase.from("firms").select("id", { count: "exact", head: true });
    } else {
        query = supabase.from("communities").select("id", { count: "exact", head: true }).eq("visibility", "public");
    }
    const { count, error } = await query;
    if (error) throw new Error(`Unable to count public ${kind} for sitemap`);
    return count ?? 0;
}

export async function sitemapIndexXml(): Promise<string> {
    const kinds: SitemapKind[] = ["profiles", "projects", "jobs", "firms", "communities"];
    const counts = await Promise.all(kinds.map(async (kind) => ({ kind, count: await countItems(kind) })));
    const sitemapPaths = ["/sitemap/static.xml"];
    for (const { kind, count } of counts) {
        const sitemapCount = Math.ceil(count / MAX_URLS_PER_SITEMAP);
        for (let page = 0; page < sitemapCount; page += 1) sitemapPaths.push(`/sitemap/${kind}-${page}.xml`);
    }
    const entries = sitemapPaths.map((path) => `<sitemap><loc>${escapeXml(absoluteUrl(path))}</loc></sitemap>`).join("");
    return `${XML_HEADER}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

async function getPage(kind: SitemapKind, offset: number, limit: number): Promise<SitemapItem[]> {
    const supabase = createPublicClient();
    const end = offset + limit - 1;
    if (kind === "profiles") {
        const { data, error } = await supabase.from("profiles").select("slug, updated_at").eq("search_indexable", true).eq("account_status", "active").order("id", { ascending: true }).range(offset, end);
        if (error) throw new Error("Unable to load public profiles for sitemap");
        return (data ?? []).map((profile) => ({ loc: absoluteUrl(`/p/${encodeURIComponent(profile.slug)}`), lastModified: profile.updated_at }));
    }
    if (kind === "projects") {
        const { data, error } = await supabase.from("portfolio_items").select("id, updated_at, profiles!inner(slug, search_indexable, account_status)").eq("moderation_status", "active").eq("profiles.search_indexable", true).eq("profiles.account_status", "active").order("id", { ascending: true }).range(offset, end);
        if (error) throw new Error("Unable to load public projects for sitemap");
        return (data ?? []).flatMap((project) => {
            const relation = project.profiles;
            const profile = Array.isArray(relation) ? relation[0] : relation;
            if (!profile?.slug) return [];
            return [{ loc: absoluteUrl(`/p/${encodeURIComponent(profile.slug)}/projects/${encodeURIComponent(project.id)}`), lastModified: project.updated_at }];
        });
    }
    if (kind === "jobs") {
        const { data, error } = await supabase.from("job_listings").select("id, updated_at").eq("status", "open").eq("moderation_status", "active").order("id", { ascending: true }).range(offset, end);
        if (error) throw new Error("Unable to load public job listings for sitemap");
        return (data ?? []).map((job) => ({ loc: absoluteUrl(`/jobs/${encodeURIComponent(job.id)}`), lastModified: job.updated_at }));
    }
    if (kind === "firms") {
        const { data, error } = await supabase.from("firms").select("slug, updated_at").order("id", { ascending: true }).range(offset, end);
        if (error) throw new Error("Unable to load public firms for sitemap");
        return (data ?? []).map((firm) => ({ loc: absoluteUrl(`/firms/${encodeURIComponent(firm.slug)}`), lastModified: firm.updated_at }));
    }
    const { data, error } = await supabase.from("communities").select("slug, updated_at").eq("visibility", "public").order("id", { ascending: true }).range(offset, end);
    if (error) throw new Error("Unable to load public communities for sitemap");
    return (data ?? []).map((community) => ({ loc: absoluteUrl(`/a/${encodeURIComponent(community.slug)}`), lastModified: community.updated_at }));
}

export async function sitemapXml(id: string): Promise<string | null> {
    if (id === "static") {
        return serializeUrlset(staticUrls.map((path) => ({ loc: absoluteUrl(path) })));
    }
    const match = /^(profiles|projects|jobs|firms|communities)-(\d+)$/.exec(id);
    if (!match) return null;
    const kind = match[1] as SitemapKind;
    const page = Number(match[2]);
    if (!Number.isSafeInteger(page) || page < 0) return null;
    const count = await countItems(kind);
    const start = page * MAX_URLS_PER_SITEMAP;
    if (start >= count) return null;
    const items: SitemapItem[] = [];
    for (let offset = start; offset < Math.min(start + MAX_URLS_PER_SITEMAP, count); offset += PAGE_SIZE) {
        items.push(...await getPage(kind, offset, Math.min(PAGE_SIZE, start + MAX_URLS_PER_SITEMAP - offset)));
    }
    return serializeUrlset(items);
}
