import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const requestedNext = requestUrl.searchParams.get("next") || "/feed";
    const signInType = requestUrl.searchParams.get("signin_type");
    const validAccountTypes = ["student", "professional", "firm", "business"];
    const signInPage = (type: string | null) => type === "firm" || type === "business"
        ? `/firms/login?account_type=${type}`
        : `/login?account_type=${type === "professional" ? "professional" : "student"}`;
    // Only allow relative in-app redirects after authentication.
    let next = "/feed";
    if (requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")) {
        try {
            const candidate = new URL(requestedNext, requestUrl.origin);
            if (candidate.origin === requestUrl.origin) next = requestedNext;
        } catch {
            // Keep the safe default for malformed redirect targets.
        }
    }

    if (!code) {
        const target = signInPage(validAccountTypes.includes(signInType ?? "") ? signInType : null);
        return NextResponse.redirect(new URL(`${target}&error=missing_code`, requestUrl.origin));
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        const target = signInPage(validAccountTypes.includes(signInType ?? "") ? signInType : null);
        return NextResponse.redirect(new URL(`${target}&error=authentication_failed`, requestUrl.origin));
    }

    // Sign-in callbacks must use the authenticated profile as the source of
    // truth. The URL only describes which sign-in page initiated the flow.
    if (validAccountTypes.includes(signInType ?? "")) {
        const { data: { user } } = await supabase.auth.getUser();
        const admin = createAdminClient();
        const { data: profile } = user
            ? await admin.from("profiles").select("account_type").eq("user_id", user.id).maybeSingle()
            : { data: null };
        const actualType = profile?.account_type;
        if (actualType !== signInType) {
            await supabase.auth.signOut({ scope: "local" });
            const attempted = signInPage(signInType);
            const target = validAccountTypes.includes(actualType ?? "") ? signInPage(actualType) : attempted;
            const mismatch = new URL(target, requestUrl.origin);
            mismatch.searchParams.set("error", actualType ? "account_type_mismatch" : "account_type_unavailable");
            if (actualType) mismatch.searchParams.set("selected", actualType);
            return NextResponse.redirect(mismatch);
        }
    }

    const callbackUrl = new URL(next, requestUrl.origin);
    const requestedRole = callbackUrl.searchParams.get("role");
    const role = requestedRole === "firm" || requestedRole === "architect" || requestedRole === "student" ? requestedRole : null;
    const requestedAccountType = callbackUrl.searchParams.get("account_type");
    const accountType = ["student", "professional", "firm", "business"].includes(requestedAccountType ?? "") ? requestedAccountType : role === "architect" ? "professional" : role === "firm" ? "firm" : role === "student" ? "student" : null;
    let onboardingMetadata: Record<string, unknown> = {};
    try {
        const onboarding = JSON.parse(callbackUrl.searchParams.get("onboarding") ?? "{}") as { account_type?: string; interests?: unknown; interest_other?: string };
        const interests = Array.isArray(onboarding.interests) ? onboarding.interests.filter((item): item is string => typeof item === "string").slice(0, 21) : [];
        const interestAccountType = ["student", "professional", "firm", "business"].includes(onboarding.account_type ?? "") ? onboarding.account_type : accountType;
        onboardingMetadata = { account_type: interestAccountType, professional_interests: interests, professional_interest_other: interests.includes("Other") && typeof onboarding.interest_other === "string" ? onboarding.interest_other.slice(0, 120) : "" };
    } catch { /* Ignore malformed optional onboarding context. */ }

    // OAuth does not receive signup form metadata. Signup callbacks carry an
    // explicit account context; ordinary sign-in callbacks leave profile type alone.
    if (role) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const createdAt = Date.parse(user.created_at);
            const justCreated = Number.isFinite(createdAt) && Date.now() - createdAt >= 0 && Date.now() - createdAt < 10 * 60 * 1000;
            const missingAccountContext = typeof user.user_metadata.account_type !== "string";
            if (justCreated && (missingAccountContext || user.user_metadata.account_type === accountType)) {
                const admin = createAdminClient();
                await admin.auth.admin.updateUserById(user.id, {
                    user_metadata: { ...user.user_metadata, role, ...onboardingMetadata },
                });
                await admin.from("profiles").update({ role, account_type: accountType }).eq("user_id", user.id);
            }
        }
    }

    const { data: { user: callbackUser } } = await supabase.auth.getUser();
    if (callbackUser) {
        const admin = createAdminClient();
        const [{ data: profile }, { data: onboarding, error: onboardingError }] = await Promise.all([
            admin.from("profiles").select("id, created_at").eq("user_id", callbackUser.id).maybeSingle(),
            admin.from("profile_onboarding").select("onboarding_completed").eq("user_id", callbackUser.id).maybeSingle(),
        ]);
        const createdAt = Date.parse(callbackUser.created_at);
        const newlyCreated = Number.isFinite(createdAt) && Date.now() - createdAt >= 0 && Date.now() - createdAt < 30 * 60 * 1000;
        let onboardingRequired = onboarding ? !onboarding.onboarding_completed : newlyCreated;

        // The migration trigger creates this row. Recover safely if a newly
        // registered profile was created during a brief database interruption.
        if (!onboarding && !onboardingError && newlyCreated && profile) {
            const { error: insertError } = await admin.from("profile_onboarding").insert({ user_id: callbackUser.id, profile_id: profile.id });
            if (!insertError) onboardingRequired = true;
        }
        if (onboardingError && newlyCreated) onboardingRequired = true;

        if (onboardingRequired || callbackUser.app_metadata.onboarding_required === true) {
            const { error: metadataError } = await admin.auth.admin.updateUserById(callbackUser.id, {
                app_metadata: { ...callbackUser.app_metadata, onboarding_required: onboardingRequired },
            });
            if (metadataError) console.error("[auth/callback] Could not refresh onboarding route guard:", metadataError.message);
        }
        if (onboardingRequired) next = "/onboarding";
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
