import { NextResponse } from "next/server";
import { createJobListing } from "@/lib/queries/jobs";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";
import { jobListingCreateSchema } from "@/lib/validations";

export async function POST(request: Request) {
    try {
        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
        }
        if (!body || Array.isArray(body) || typeof body !== "object") {
            return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
        }
        const { data: profile, error: profileError } = await getCurrentProfile();
        if (profileError || !profile) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }

        if (profile.role !== "firm") {
            return NextResponse.json({ error: "Only firm profiles can post jobs" }, { status: 403 });
        }

        const listingInput = {
            user_id: profile.user_id,
            firm_name: profile.name,
            title: body.title,
            type: body.type,
            description: body.description,
            apply_link_or_email: typeof body.apply_link_or_email === "string" && body.apply_link_or_email.trim()
                ? body.apply_link_or_email.trim()
                : null,
            status: "open" as const,
        };
        const validation = jobListingCreateSchema.safeParse(listingInput);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues.map((issue) => issue.message).join(", ") },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data: allowed, error: limitError } = await supabase
            .rpc("consume_job_posting_slot", { p_user_id: profile.user_id });
        if (limitError) {
            return NextResponse.json({ error: "Unable to verify posting limit" }, { status: 500 });
        }
        if (!allowed) {
            return NextResponse.json({ error: "Posting limit reached. Try again later." }, { status: 429 });
        }

        const result = await createJobListing({
            ...validation.data,
            apply_link_or_email: validation.data.apply_link_or_email ?? null,
        });
        if (result.error || !result.data) {
            const { error: releaseError } = await supabase.rpc("release_job_posting_slot", { p_user_id: profile.user_id });
            if (releaseError) {
                // Retry the compensating update so transient failures do not permanently consume quota.
                await supabase.rpc("release_job_posting_slot", { p_user_id: profile.user_id });
            }
            return NextResponse.json({ error: "Unable to create job listing" }, { status: 400 });
        }
        return NextResponse.json({ listing: result.data }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
