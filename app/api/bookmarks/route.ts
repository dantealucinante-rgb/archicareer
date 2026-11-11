import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const body = await request.json() as { post_id?: unknown; bookmarked?: unknown };
        if (typeof body.post_id !== "string" || typeof body.bookmarked !== "boolean") return NextResponse.json({ error: "A post and bookmark state are required" }, { status: 400 });
        const client = await createClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return NextResponse.json({ error: "Sign in to save posts" }, { status: 401 });
        const result = body.bookmarked
            ? await client.from("post_bookmarks").upsert({ user_id: user.id, post_id: body.post_id }, { onConflict: "user_id,post_id", ignoreDuplicates: true })
            : await client.from("post_bookmarks").delete().eq("user_id", user.id).eq("post_id", body.post_id);
        if (result.error) return NextResponse.json({ error: "Unable to update saved posts" }, { status: result.error.code === "42501" ? 403 : 400 });
        return NextResponse.json({ ok: true, bookmarked: body.bookmarked });
    } catch { return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 }); }
}
