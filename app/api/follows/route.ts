import { NextResponse } from "next/server";
import { followUser, unfollowUser } from "@/lib/queries/follows";

async function followingIdFromRequest(request: Request) {
    try {
        const body = await request.json() as { followingId?: unknown };
        return typeof body.followingId === "string" ? body.followingId : null;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    const followingId = await followingIdFromRequest(request);
    if (!followingId) return NextResponse.json({ error: "A following profile is required" }, { status: 400 });
    const result = await followUser(followingId);
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: result.error.message === "Unauthenticated" ? 401 : 400 });
    return NextResponse.json({ following: true }, { status: 201 });
}

export async function DELETE(request: Request) {
    const followingId = await followingIdFromRequest(request);
    if (!followingId) return NextResponse.json({ error: "A following profile is required" }, { status: 400 });
    const result = await unfollowUser(followingId);
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: result.error.message === "Unauthenticated" ? 401 : 400 });
    return NextResponse.json({ following: false });
}
