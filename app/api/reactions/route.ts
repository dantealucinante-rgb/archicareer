import { NextResponse } from "next/server";
import { toggleReaction } from "@/lib/queries/engagement";

export async function POST(request: Request) {
    try {
        const body = await request.json() as { portfolio_item_id?: unknown; post_id?: unknown };
        const portfolioItemId = typeof body.portfolio_item_id === "string" ? body.portfolio_item_id : undefined;
        const postId = typeof body.post_id === "string" ? body.post_id : undefined;
        if (Boolean(portfolioItemId) === Boolean(postId)) return NextResponse.json({ error: "A content target is required" }, { status: 400 });
        const result = await toggleReaction(portfolioItemId ? { portfolio_item_id: portfolioItemId } : { post_id: postId as string });
        if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to update reaction" }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
        return NextResponse.json(result.data);
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}
