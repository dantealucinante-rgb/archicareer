import { NextResponse } from "next/server";
import { communityCreateSchema } from "@/lib/community-validation";
import { getCommunityDirectory } from "@/lib/queries/communities";
import { createClient } from "@/lib/supabase/server";
import { verifyStoredAsset } from "@/lib/storage-validation";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const result = await getCommunityDirectory({
        query: url.searchParams.get("q") ?? "",
        sort: (url.searchParams.get("sort") ?? "recent") as "trending" | "recent" | "joined" | "suggested",
        limit: Number(url.searchParams.get("limit") ?? 24),
        offset: Number(url.searchParams.get("offset") ?? 0),
    });
    if (result.error || !result.data) return NextResponse.json({ error: "Unable to load communities" }, { status: 500 });
    return NextResponse.json({ communities: result.data, hasMore: result.data.length === Math.min(Math.max(Number(url.searchParams.get("limit") ?? 24), 1), 50) });
}

export async function POST(request: Request) {
    try {
        const input = communityCreateSchema.parse(await request.json());
        const client = await createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Sign in to create a community" }, { status: 401 });
        if (input.avatar_url && !(await verifyStoredAsset(input.avatar_url, "avatars", user.id, "image"))) {
            return NextResponse.json({ error: "Choose a valid uploaded community image" }, { status: 400 });
        }
        const { data, error } = await client.rpc("create_community", {
            p_name: input.name,
            p_slug: input.slug,
            p_description: input.description,
            p_visibility: input.visibility,
            p_avatar_url: input.avatar_url ?? null,
        });
        if (error) {
            if (error.code === "23505") return NextResponse.json({ error: "That community name or URL is already in use" }, { status: 409 });
            if (error.code === "42501") return NextResponse.json({ error: "Your account cannot create a community" }, { status: 403 });
            return NextResponse.json({ error: "Unable to create this community" }, { status: 400 });
        }
        const community = Array.isArray(data) ? data[0] : data;
        if (!community?.slug) return NextResponse.json({ error: "The community was not returned after creation" }, { status: 500 });
        return NextResponse.json({ community }, { status: 201 });
    } catch (error) {
        if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        if (typeof error === "object" && error !== null && "issues" in error) {
            const issues = (error as { issues?: { message: string }[] }).issues;
            return NextResponse.json({ error: issues?.[0]?.message ?? "Community details are invalid" }, { status: 400 });
        }
        return NextResponse.json({ error: "Unable to create this community" }, { status: 500 });
    }
}
