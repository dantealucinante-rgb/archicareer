import { sitemapXml } from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const xml = await sitemapXml(id.replace(/\.xml$/, ""));
        if (!xml) return new Response("Not found", { status: 404 });
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
    } catch {
        return new Response("Sitemap is temporarily unavailable.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }
}
