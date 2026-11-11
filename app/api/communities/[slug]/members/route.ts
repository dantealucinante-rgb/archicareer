import { NextResponse } from "next/server";
import { getCommunityBySlug, getCommunityMembers } from "@/lib/queries/communities";

export async function GET(request: Request, context: RouteContext<"/api/communities/[slug]/members">) {
    const { slug } = await context.params;
    const communityResult = await getCommunityBySlug(slug);
    const view = communityResult.data;
    if (communityResult.error || !view) return NextResponse.json({ error: "Community not found" }, { status: 404 });
    if (!view.canView) return NextResponse.json({ error: "Request membership to view this community" }, { status: 403 });
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const includePending = view.canModerate;
    const result = await getCommunityMembers(view.community.id, includePending, limit, offset);
    if (result.error || !result.data) return NextResponse.json({ error: "Unable to load members" }, { status: 500 });
    return NextResponse.json({ members: result.data, hasMore: result.data.length === Math.min(Math.max(Math.floor(limit), 1), 100) });
}
