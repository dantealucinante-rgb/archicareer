import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const requestedNext = requestUrl.searchParams.get("next") || "/feed";
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
        return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(new URL("/login?error=authentication_failed", requestUrl.origin));
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

    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
