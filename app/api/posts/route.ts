import { NextResponse } from "next/server";
import { safeMessage } from "@/lib/error-message";
import { createPost, deletePost, FEED_FILTERS, type FeedFilter, getFeed } from "@/lib/queries/posts";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const rawFilter = url.searchParams.get("filter") ?? "all";
    const filter: FeedFilter = (FEED_FILTERS as string[]).includes(rawFilter) ? (rawFilter as FeedFilter) : "all";
    const result = await getFeed(limit, offset, filter);
    if (result.error || !result.data) return NextResponse.json({ error: safeMessage(result.error, "We couldn’t load the feed just now. Please try again.") }, { status: 400 });
    return NextResponse.json({ posts: result.data, hasMore: result.data.length === Math.min(Math.max(Math.floor(limit) || 10, 1), 50) });
}

export async function POST(request: Request) {
    try {
        const result = await createPost(await request.json());
        if (result.error || !result.data) return NextResponse.json({ error: safeMessage(result.error, "We couldn’t publish your post just now. Please try again.") }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
        return NextResponse.json({ post: result.data }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json() as { id?: unknown };
        if (typeof body.id !== "string") return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
        const result = await deletePost(body.id);
        if (result.error || !result.data) return NextResponse.json({ error: safeMessage(result.error, "We couldn’t delete that post just now. Please try again.") }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}
