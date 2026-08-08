import { NextResponse } from "next/server";
import { updateApplicationStatus } from "@/lib/queries/applications";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await updateApplicationStatus(id, await request.json());
        if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to update application" }, { status: result.error?.message === "Unauthenticated" ? 401 : 400 });
        return NextResponse.json({ application: result.data });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}
