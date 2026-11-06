import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getProfileOnboardingState } from "@/lib/onboarding";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return NextResponse.json({ error: "Sign in to start setup." }, { status: 401 });
        const [{ data: profile }, onboarding] = await Promise.all([getCurrentProfile(), getProfileOnboardingState(user.id)]);
        if (!profile) return NextResponse.json({ error: "Your profile could not be loaded." }, { status: 404 });
        if (onboarding.error || !onboarding.data) return NextResponse.json({ error: "Setup is temporarily unavailable. Refresh or contact hello@archicareer.ng." }, { status: 503 });
        const { error: updateError } = await createAdminClient().auth.admin.updateUserById(user.id, {
            app_metadata: { ...user.app_metadata, onboarding_required: !onboarding.data.onboarding_completed },
        });
        if (updateError) return NextResponse.json({ error: "We could not prepare your setup yet. Please retry." }, { status: 503 });
        return NextResponse.json({ ok: true, complete: onboarding.data.onboarding_completed });
    } catch {
        return NextResponse.json({ error: "Unable to prepare setup." }, { status: 500 });
    }
}
