import { NextResponse } from "next/server";
import { communityReportSchema } from "@/lib/community-validation";
import { createClient } from "@/lib/supabase/server";
import { getCommunityBySlug } from "@/lib/queries/communities";

export async function POST(request: Request, context: RouteContext<"/api/communities/[slug]/reports">) {
    try {
        const { slug } = await context.params;
        const input = communityReportSchema.parse(await request.json());
        const client = await createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Sign in to report community content" }, { status: 401 });
        const view = await getCommunityBySlug(slug);
        if (view.error || !view.data) return NextResponse.json({ error: "Community not found" }, { status: 404 });
        if (!view.data.canView && input.target_type !== "community") return NextResponse.json({ error: "This content is unavailable" }, { status: 403 });

        if (input.target_type === "community") {
            if (input.target_id !== view.data.community.id) return NextResponse.json({ error: "Invalid community report target" }, { status: 400 });
        } else if (input.target_type === "post") {
            const { data } = await client.from("posts").select("id").eq("id", input.target_id).eq("community_id", view.data.community.id).maybeSingle();
            if (!data) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        } else {
            const { data } = await client.from("comments").select("id,post_id").eq("id", input.target_id).maybeSingle();
            if (!data?.post_id) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
            const { data: post } = await client.from("posts").select("id").eq("id", data.post_id).eq("community_id", view.data.community.id).maybeSingle();
            if (!post) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        const { error } = await client.from("moderation_reports").insert({
            reporter_id: user.id,
            target_type: input.target_type,
            target_id: input.target_id,
            category: input.category,
            details: input.details,
        });
        if (error) return NextResponse.json({ error: "Unable to submit this report" }, { status: error.code === "42501" ? 403 : 400 });
        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        if (typeof error === "object" && error !== null && "issues" in error) return NextResponse.json({ error: "Report details are invalid" }, { status: 400 });
        return NextResponse.json({ error: "Unable to submit this report" }, { status: 500 });
    }
}
