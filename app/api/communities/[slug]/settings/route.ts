import { NextResponse } from "next/server";
import { communitySettingsSchema } from "@/lib/community-validation";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: RouteContext<"/api/communities/[slug]/settings">) {
    try {
        const { slug } = await context.params;
        const input = communitySettingsSchema.parse(await request.json());
        const client = await createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Sign in to update this community" }, { status: 401 });
        const { data: view, error: lookupError } = await getCommunityBySlug(slug);
        if (lookupError || !view) return NextResponse.json({ error: "Community not found" }, { status: 404 });
        if (!view.isOwner) return NextResponse.json({ error: "Only the owner can change community settings" }, { status: 403 });
        const { data, error } = await client.rpc("community_update_settings", {
            p_community_id: view.community.id,
            p_name: input.name ?? view.community.name,
            p_description: input.description ?? view.community.description,
            p_visibility: input.visibility ?? view.community.visibility,
        });
        if (error) {
            if (error.code === "23505") return NextResponse.json({ error: "That community name or URL is already in use" }, { status: 409 });
            return NextResponse.json({ error: "Unable to save community settings" }, { status: error.code === "42501" ? 403 : 400 });
        }
        return NextResponse.json({ community: data });
    } catch (error) {
        if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        if (typeof error === "object" && error !== null && "issues" in error) return NextResponse.json({ error: "Community settings are invalid" }, { status: 400 });
        return NextResponse.json({ error: "Unable to save community settings" }, { status: 500 });
    }
}
