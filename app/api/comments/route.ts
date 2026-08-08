import { NextResponse } from "next/server";
import { addComment, deleteComment, getComments, updateComment } from "@/lib/queries/engagement";

function targetFromRequest(request: Request) {
    const url = new URL(request.url);
    const portfolioItemId = url.searchParams.get("portfolio_item_id");
    const postId = url.searchParams.get("post_id");
    if (Boolean(portfolioItemId) === Boolean(postId)) return null;
    return portfolioItemId ? { portfolio_item_id: portfolioItemId } : { post_id: postId as string };
}

export async function GET(request: Request) {
    const target = targetFromRequest(request);
    if (!target) return NextResponse.json({ error: "A content target is required" }, { status: 400 });
    const result = await getComments(target);
    if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to load comments" }, { status: 400 });
    return NextResponse.json({ comments: result.data });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = await addComment(body);
        if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to add comment" }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
        return NextResponse.json({ comment: result.data }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json() as { id?: unknown };
        if (typeof body.id !== "string") return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
        const result = await deleteComment(body.id);
        if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to delete comment" }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json() as { id?: unknown; content?: unknown };
        if (typeof body.id !== "string") return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
        const result = await updateComment(body.id, { content: body.content });
        if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to update comment" }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
        return NextResponse.json({ comment: result.data });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}
