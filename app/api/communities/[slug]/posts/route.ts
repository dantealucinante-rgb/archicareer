import { NextResponse } from "next/server";
import { communityPostSchema } from "@/lib/community-validation";
import { createClient } from "@/lib/supabase/server";
import { getCommunityBySlug, getCommunityPosts } from "@/lib/queries/communities";

export async function GET(request: Request, context: RouteContext<"/api/communities/[slug]/posts">) {
    const { slug } = await context.params;
    const lookup = await getCommunityBySlug(slug);
    if (lookup.error || !lookup.data) return NextResponse.json({ error: "Community not found" }, { status: 404 });
    if (!lookup.data.canView) return NextResponse.json({ error: "Membership is required to view posts" }, { status: 403 });
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20) || 20, 1), 50);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0) || 0, 0);
    const result = await getCommunityPosts({ communityId: lookup.data.community.id, privateMedia: lookup.data.community.visibility === "private", filter: url.searchParams.get("filter") ?? "latest", limit, offset });
    if (result.error || !result.data) return NextResponse.json({ error: "Unable to load community posts" }, { status: 500 });
    return NextResponse.json({ posts: result.data, hasMore: result.data.length === limit });
}

export async function POST(request: Request, context: RouteContext<"/api/communities/[slug]/posts">) {
    try {
        const { slug } = await context.params;
        const input = communityPostSchema.parse(await request.json());
        const client = await createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Sign in to publish" }, { status: 401 });
        const lookup = await getCommunityBySlug(slug);
        if (lookup.error || !lookup.data) return NextResponse.json({ error: "Community not found" }, { status: 404 });
        if (!lookup.data.canView || lookup.data.community.viewer_status !== "active") return NextResponse.json({ error: "Join this community to publish" }, { status: 403 });
        if (["single_image", "image_gallery"].includes(input.post_type)) return NextResponse.json({ error: "Image attachments are temporarily unavailable until the private media policy can be verified" }, { status: 501 });
        const { data, error } = await client.from("posts").insert({
            user_id: user.id,
            community_id: lookup.data.community.id,
            content: input.content?.trim() || null,
            title: input.title?.trim() || null,
            post_type: input.post_type,
            image_url: null,
        }).select("id,user_id,content,image_url,title,post_type,community_id,created_at,updated_at").single();
        if (error) return NextResponse.json({ error: "Unable to publish this post" }, { status: error.code === "42501" ? 403 : 400 });
        return NextResponse.json({ post: data }, { status: 201 });
    } catch (error) {
        if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        if (typeof error === "object" && error !== null && "issues" in error) return NextResponse.json({ error: "Add a title or text and choose a valid post type" }, { status: 400 });
        return NextResponse.json({ error: "Unable to publish this post" }, { status: 500 });
    }
}
