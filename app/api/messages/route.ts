import { NextResponse } from "next/server";
import { safeMessage } from "@/lib/error-message";
import { getThread, markThreadRead, sendMessage } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/server";

async function currentUserId() {
    const { data: { user } } = await (await createClient()).auth.getUser();
    return user?.id ?? null;
}

export async function GET(request: Request) {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "You need to sign in to read your messages." }, { status: 401 });
    const withUserId = new URL(request.url).searchParams.get("with") ?? "";
    const messages = await getThread(userId, withUserId);
    return NextResponse.json({ messages });
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as { recipient_id?: unknown; content?: unknown };
        if (typeof body.recipient_id !== "string" || typeof body.content !== "string") {
            return NextResponse.json({ error: "Write a message first." }, { status: 400 });
        }
        const result = await sendMessage(body.recipient_id, body.content);
        if (result.error || !result.data) {
            return NextResponse.json(
                { error: safeMessage(result.error, "We couldn’t send that message just now. Please try again.") },
                { status: result.error?.message === "Unauthenticated" ? 401 : 400 },
            );
        }
        return NextResponse.json({ message: result.data }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json() as { with?: unknown };
        if (typeof body.with !== "string") return NextResponse.json({ error: "A conversation is required." }, { status: 400 });
        await markThreadRead(body.with);
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}
