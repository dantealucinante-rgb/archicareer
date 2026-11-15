import { NextResponse } from "next/server";
import { updateJobListing } from "@/lib/queries/jobs";

export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { id } = await params;
 const body = await request.json();
 const result = await updateJobListing(id, body);
 if (result.error || !result.data) {
 const status = result.error?.message === "Unauthenticated" ? 401 : 400;
 return NextResponse.json({ error: result.error?.message ?? "Unable to update job" }, { status });
 }
 return NextResponse.json({ listing: result.data });
 } catch {
 return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
 }
}
