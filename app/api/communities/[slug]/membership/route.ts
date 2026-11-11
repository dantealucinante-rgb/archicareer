import { NextResponse } from "next/server";
import { communityMembershipActionSchema } from "@/lib/community-validation";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: RouteContext<"/api/communities/[slug]/membership">) {
    try {
        const { slug } = await context.params;
        const input = communityMembershipActionSchema.parse(await request.json());
        const client = await createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Sign in to manage community membership" }, { status: 401 });
        const lookup = await getCommunityBySlug(slug);
        if (lookup.error || !lookup.data) return NextResponse.json({ error: "Community not found" }, { status: 404 });
        const { data, error } = await client.rpc("community_manage_member", {
            p_community_id: lookup.data.community.id,
            p_action: input.action,
            p_target_user_id: input.user_id ?? null,
        });
        if (error) {
            const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 400;
            return NextResponse.json({ error: "The membership change was rejected by community permissions" }, { status });
        }
        return NextResponse.json({ ok: true, status: data ?? null }, { status: data === "pending" ? 202 : 200 });
    } catch (error) {
        if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        if (typeof error === "object" && error !== null && "issues" in error) return NextResponse.json({ error: "Membership action is invalid" }, { status: 400 });
        return NextResponse.json({ error: "Unable to update community membership" }, { status: 500 });
    }
}
