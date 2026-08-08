import { NextResponse } from "next/server";
import { getApplicationMessages, sendApplicationMessage } from "@/lib/queries/applications";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getApplicationMessages(id);
    if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to load messages" }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
    return NextResponse.json({ messages: result.data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await sendApplicationMessage(id, await request.json());
    if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to send message" }, { status: result.error?.message === "Unauthenticated" ? 401 : result.error?.message.includes("limit reached") ? 429 : 400 });
        return NextResponse.json({ message: result.data }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}
