import { NextResponse } from "next/server";
import { setReaction, toggleReaction } from "@/lib/queries/engagement";

export async function POST(request: Request) {
    try {
        const body = await request.json() as { portfolio_item_id?: unknown; post_id?: unknown; comment_id?: unknown; reacted?: unknown };
        const portfolioItemId = typeof body.portfolio_item_id === "string" ? body.portfolio_item_id : undefined;
        const postId = typeof body.post_id === "string" ? body.post_id : undefined;
        const commentId = typeof body.comment_id === "string" ? body.comment_id : undefined;
        if ([portfolioItemId, postId, commentId].filter(Boolean).length !== 1) return NextResponse.json({ error: "A content target is required" }, { status: 400 });
        const target = portfolioItemId ? { portfolio_item_id: portfolioItemId } : postId ? { post_id: postId } : { comment_id: commentId as string };
        const result = typeof body.reacted === "boolean"
            ? await setReaction(target, body.reacted)
            : await toggleReaction(target);
        if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to update reaction" }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
        return NextResponse.json(result.data);
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}
