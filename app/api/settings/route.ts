import { NextResponse } from "next/server";
import { getCurrentProfile, updateProfile } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";

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
        if (typeof body.marketing_emails !== "boolean" || typeof body.search_indexable !== "boolean") {
            return NextResponse.json({ error: "marketing_emails and search_indexable must be booleans" }, { status: 400 });
        }

        const { data: profile, error: profileError } = await getCurrentProfile();
        if (profileError || !profile) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }
        const supabase = await createClient();
        const { data: allowed, error: limitError } = await supabase.rpc("consume_user_rate_limit", { p_action: "profile_update", p_limit: 30 });
        if (limitError) return NextResponse.json({ error: "Unable to verify request limit" }, { status: 500 });
        if (!allowed) return NextResponse.json({ error: "Too many profile updates. Try again later." }, { status: 429 });

        const { data, error } = await updateProfile(profile.id, {
            marketing_emails: body.marketing_emails,
            search_indexable: body.search_indexable,
        });
        if (error || !data) {
            return NextResponse.json({ error: "Unable to save settings" }, { status: 400 });
        }

        return NextResponse.json({ settings: { marketing_emails: data.marketing_emails, search_indexable: data.search_indexable } });
    } catch {
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
