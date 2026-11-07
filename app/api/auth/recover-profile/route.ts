import { NextResponse } from "next/server";
import { ensureProfileForUser } from "@/lib/queries/profiles";
import { getAccountHome, isAccountType } from "@/lib/onboarding";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Your session expired. Return to sign-in and try again." }, { status: 401 });

        const metadataType = user.user_metadata.account_type;
        const metadataRole = user.user_metadata.role;
        const accountType = isAccountType(metadataType)
            ? metadataType
            : metadataRole === "architect" ? "professional" : metadataRole === "firm" ? "firm" : metadataRole === "student" ? "student" : null;
        if (!accountType) return NextResponse.json({ error: "Choose an account type to finish setting up your profile.", accountTypeRequired: true }, { status: 409 });

        const profile = await ensureProfileForUser(user);
        if (profile.error || !profile.data) return NextResponse.json({ error: "We still can’t create your profile. Please retry or contact support." }, { status: 503 });

        const admin = createAdminClient();
        const { data: state, error: stateError } = await admin.from("profile_onboarding")
            .select("onboarding_completed").eq("user_id", user.id).maybeSingle();
        if (stateError) return NextResponse.json({ error: "Your setup record is temporarily unavailable. Retry in a moment." }, { status: 503 });

        let completed = state?.onboarding_completed ?? false;
        if (!state) {
            const createdAt = Date.parse(user.created_at);
            const registeredThroughApp = user.user_metadata.registration_flow === "google_signup" || user.app_metadata.onboarding_required === true;
            const isNew = registeredThroughApp || (Number.isFinite(createdAt) && Date.now() - createdAt < 30 * 60 * 1000);
            completed = !isNew;
            const interests = Array.isArray(user.user_metadata.professional_interests)
                ? user.user_metadata.professional_interests.filter((item): item is string => typeof item === "string").slice(0, 21)
                : [];
            const { error: insertError } = await admin.from("profile_onboarding").upsert({
                user_id: user.id,
                profile_id: profile.data.id,
                onboarding_completed: completed,
                onboarding_step: completed ? 5 : 0,
                onboarding_started_at: profile.data.created_at,
                onboarding_completed_at: completed ? new Date().toISOString() : null,
                professional_interests: interests,
                professional_interest_other: interests.includes("Other") && typeof user.user_metadata.professional_interest_other === "string" ? user.user_metadata.professional_interest_other.slice(0, 120) : "",
            }, { onConflict: "user_id", ignoreDuplicates: true });
            if (insertError) return NextResponse.json({ error: "Your setup record could not be restored. Retry in a moment." }, { status: 503 });
            const { data: recovered, error: recoveredError } = await admin.from("profile_onboarding").select("onboarding_completed").eq("user_id", user.id).single();
            if (recoveredError || !recovered) return NextResponse.json({ error: "Your setup record could not be reloaded. Retry in a moment." }, { status: 503 });
            completed = recovered.onboarding_completed;
        }

        const { error: markerError } = await admin.auth.admin.updateUserById(user.id, {
            app_metadata: { ...user.app_metadata, onboarding_required: !completed },
        });
        if (markerError) return NextResponse.json({ error: "Your profile was restored, but access could not be refreshed. Retry once more." }, { status: 503 });
        return NextResponse.json({ ok: true, destination: completed ? getAccountHome(accountType) : "/onboarding" });
    } catch {
        return NextResponse.json({ error: "Profile recovery is temporarily unavailable. Try again shortly." }, { status: 500 });
    }
}
