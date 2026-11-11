import { NextResponse } from "next/server";
import { communityModerationActionSchema } from "@/lib/community-validation";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { createClient } from "@/lib/supabase/server";

async function authorizedCommunity(slug: string) {
    const result = await getCommunityBySlug(slug);
    if (!result.data) return { error: NextResponse.json({ error: "Community not found" }, { status: 404 }) };
    if (!result.data.canModerate) return { error: NextResponse.json({ error: "Moderation access is required" }, { status: 403 }) };
    return { community: result.data.community };
}

export async function GET(_request: Request, context: RouteContext<"/api/communities/[slug]/moderation">) {
    const { slug } = await context.params;
    const access = await authorizedCommunity(slug);
    if (access.error) return access.error;
    const client = await createClient();
    const { data, error } = await client.rpc("community_moderation_queue", { p_community_id: access.community!.id });
    if (error) return NextResponse.json({ error: "Unable to load reports. Apply the community security migration first." }, { status: 503 });
    return NextResponse.json({ reports: data ?? [] });
}

export async function POST(request: Request, context: RouteContext<"/api/communities/[slug]/moderation">) {
    try {
        const { slug } = await context.params;
        const input = communityModerationActionSchema.parse(await request.json());
        const access = await authorizedCommunity(slug);
        if (access.error) return access.error;
        const client = await createClient();
        const result = input.action === "remove_content"
            ? await client.rpc("community_remove_content", { p_community_id: access.community!.id, p_target_type: input.target_type, p_target_id: input.target_id })
            : await client.rpc("community_resolve_report", { p_community_id: access.community!.id, p_report_id: input.report_id, p_action: input.status, p_reason: input.reason || null });
        if (result.error) return NextResponse.json({ error: "The moderation action was rejected by community permissions" }, { status: result.error.code === "42501" ? 403 : 400 });
        if (result.data !== true) return NextResponse.json({ error: "This content or report is no longer available" }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error) {
        if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        if (typeof error === "object" && error !== null && "issues" in error) return NextResponse.json({ error: "Moderation action is invalid" }, { status: 400 });
        return NextResponse.json({ error: "Unable to complete moderation action" }, { status: 500 });
    }
}
