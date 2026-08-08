import { NextResponse } from "next/server";
import { createApplication } from "@/lib/queries/applications";

export async function POST(request: Request) {
    try {
        const result = await createApplication(await request.json());
        if (result.error || !result.data) {
            const status = result.error?.message === "Unauthenticated" ? 401 : result.error?.message.includes("already applied") ? 409 : result.error?.message.includes("limit reached") ? 429 : 400;
            return NextResponse.json({ error: result.error?.message ?? "Unable to submit application" }, { status });
        }
        return NextResponse.json({ application: result.data }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
}
