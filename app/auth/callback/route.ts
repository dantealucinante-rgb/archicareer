import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureProfileForUser } from "@/lib/queries/profiles";
import { getAccountHome, isAccountType } from "@/lib/onboarding";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { GOOGLE_SIGNUP_INTENT_COOKIE, verifyGoogleSignupIntent } from "@/lib/auth/google-signup-intent";

const validAccountTypes = ["student", "professional", "firm", "business"] as const;
type AccountType = (typeof validAccountTypes)[number];

function loginPage(type: string | null) {
    return type === "firm" || type === "business"
        ? `/firms/login?account_type=${type}`
        : `/login?account_type=${type === "professional" ? "professional" : "student"}`;
}

function signupPage(type: AccountType, error?: string) {
    const path = type === "firm" ? "/firms/signup" : type === "business" ? "/business/signup" : "/signup";
    const url = new URL(path, "https://archicareer.invalid");
    url.searchParams.set("account_type", type);
    if (error) url.searchParams.set("oauth_error", error);
    return `${url.pathname}${url.search}`;
}

function safeInternalPath(value: string | null, origin: string) {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
    try {
        const parsed = new URL(value, origin);
        return parsed.origin === origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : null;
    } catch { return null; }
}

function accountTypeForRole(role: string | null | undefined): AccountType | null {
    if (role === "student") return "student";
    if (role === "architect") return "professional";
    if (role === "firm") return "firm";
    return null;
}

function clearIntentCookie(response: NextResponse) {
    response.cookies.set(GOOGLE_SIGNUP_INTENT_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    return response;
}

function callbackRedirect(path: string, origin: string) {
    return clearIntentCookie(NextResponse.redirect(new URL(path, origin)));
}

function log(event: string, detail: Record<string, string | boolean | null>) {
    if (process.env.NODE_ENV !== "development") return;
    console.info("[auth/callback]", JSON.stringify({ event, ...detail }));
}

export async function GET(request: Request) {
    try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const signInType = requestUrl.searchParams.get("signin_type");
    const rawNext = safeInternalPath(requestUrl.searchParams.get("next"), requestUrl.origin);
    const nestedNext = rawNext ? new URL(rawNext, requestUrl.origin) : null;
    const intentCookie = (await cookies()).get(GOOGLE_SIGNUP_INTENT_COOKIE)?.value;
    const signupIntent = verifyGoogleSignupIntent(intentCookie);
    const requestedType = nestedNext?.searchParams.get("account_type");
    const requestedRole = nestedNext?.searchParams.get("role");
    const legacySignupType = validAccountTypes.includes(requestedType as AccountType)
        ? requestedType as AccountType
        : accountTypeForRole(requestedRole);

    log("callback_received", { hasCode: Boolean(code), hasSignupIntent: Boolean(signupIntent), hasSignInType: Boolean(signInType && validAccountTypes.includes(signInType as AccountType)) });

    if (!code) {
        const providerError = requestUrl.searchParams.get("error");
        if (signupIntent) return callbackRedirect(signupPage(signupIntent.account_type, providerError === "access_denied" ? "cancelled" : "authentication_failed"), requestUrl.origin);
        if (legacySignupType && nestedNext?.searchParams.get("intent") === "signup") {
            return callbackRedirect(signupPage(legacySignupType, providerError === "access_denied" ? "cancelled" : "authentication_failed"), requestUrl.origin);
        }
        const type = validAccountTypes.includes(signInType as AccountType) ? signInType : null;
        const target = new URL(loginPage(type), requestUrl.origin);
        target.searchParams.set("error", providerError === "access_denied" ? "cancelled" : "missing_code");
        return callbackRedirect(`${target.pathname}${target.search}`, requestUrl.origin);
    }

    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
        log("session_exchange_failed", { error: exchangeError.code ?? exchangeError.name });
        if (signupIntent) return callbackRedirect(signupPage(signupIntent.account_type, "authentication_failed"), requestUrl.origin);
        if (legacySignupType && nestedNext?.searchParams.get("intent") === "signup") return callbackRedirect(signupPage(legacySignupType, "authentication_failed"), requestUrl.origin);
        const target = new URL(loginPage(validAccountTypes.includes(signInType as AccountType) ? signInType : null), requestUrl.origin);
        target.searchParams.set("error", "authentication_failed");
        return callbackRedirect(`${target.pathname}${target.search}`, requestUrl.origin);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        log("session_user_missing", { error: userError?.name ?? null });
        return callbackRedirect("/auth/recovery?reason=session", requestUrl.origin);
    }
    log("session_established", { userId: user.id });

    const admin = createAdminClient();
    const { data: existingProfile, error: profileReadError } = await admin
        .from("profiles").select("id, user_id, name, slug, role, account_type, school_or_firm, created_at")
        .eq("user_id", user.id).maybeSingle();
    if (profileReadError) {
        log("profile_lookup_failed", { userId: user.id, error: profileReadError.code ?? profileReadError.name });
        return callbackRedirect("/auth/recovery?reason=profile", requestUrl.origin);
    }
    log("profile_lookup_complete", { userId: user.id, profileExists: Boolean(existingProfile) });

    // The authenticated profile remains authoritative for sign-ins. Only a
    // signed signup intent may seed a missing profile or update the row created
    // moments ago by the auth.users trigger.
    const authCreatedAt = Date.parse(user.created_at);
    const recentlyCreatedWithoutRegistrationType = Number.isFinite(authCreatedAt)
        && Date.now() - authCreatedAt >= 0
        && Date.now() - authCreatedAt < 30 * 60 * 1000
        && !isAccountType(user.user_metadata.account_type)
        && user.user_metadata.registration_flow !== "google_signup";
    if (validAccountTypes.includes(signInType as AccountType) && existingProfile && recentlyCreatedWithoutRegistrationType && !signupIntent) {
        await supabase.auth.signOut({ scope: "local" });
        const target = new URL(signupPage(signInType as AccountType, "account_not_found"), requestUrl.origin);
        log("redirect_unregistered_google_identity_to_signup", { userId: user.id, destination: `${target.pathname}${target.search}` });
        return callbackRedirect(`${target.pathname}${target.search}`, requestUrl.origin);
    }
    if (validAccountTypes.includes(signInType as AccountType) && existingProfile) {
        if (existingProfile.account_type !== signInType) {
            await supabase.auth.signOut({ scope: "local" });
            const target = loginPage(isAccountType(existingProfile.account_type) ? existingProfile.account_type : signInType);
            const mismatch = new URL(target, requestUrl.origin);
            mismatch.searchParams.set("error", "account_type_mismatch");
            if (isAccountType(existingProfile.account_type)) mismatch.searchParams.set("selected", existingProfile.account_type);
            log("redirect_account_type_mismatch", { userId: user.id, destination: `${mismatch.pathname}${mismatch.search}` });
            return callbackRedirect(`${mismatch.pathname}${mismatch.search}`, requestUrl.origin);
        }
    } else if (validAccountTypes.includes(signInType as AccountType) && !existingProfile && !signupIntent) {
        await supabase.auth.signOut({ scope: "local" });
        const target = new URL(signupPage(signInType as AccountType, "account_not_found"), requestUrl.origin);
        log("redirect_new_google_user_to_signup", { userId: user.id, destination: `${target.pathname}${target.search}` });
        return callbackRedirect(`${target.pathname}${target.search}`, requestUrl.origin);
    }

    const accountType = signupIntent?.account_type
        ?? (existingProfile && isAccountType(existingProfile.account_type) ? existingProfile.account_type : null)
        ?? (isAccountType(user.user_metadata.account_type) ? user.user_metadata.account_type : null);
    const role = signupIntent?.role ?? (accountType === "professional" ? "architect" : accountType === "firm" || accountType === "business" ? "firm" : accountType === "student" ? "student" : null);
    if (!existingProfile && (!accountType || !role)) {
        log("new_profile_requires_account_type", { userId: user.id });
        return callbackRedirect("/join?auth_error=account_type_required", requestUrl.origin);
    }
    const intentCreatedProfile = Boolean(signupIntent && existingProfile && Number.isFinite(Date.parse(existingProfile.created_at)) && Date.parse(existingProfile.created_at) >= (signupIntent.issued_at ?? 0) - 120_000);
    const canApplySignupIntent = Boolean(signupIntent && (!existingProfile || intentCreatedProfile));

    let profileUser = user;
    if (canApplySignupIntent && signupIntent && accountType && role) {
        const intentMetadata = { ...signupIntent.user_metadata };
        for (const key of ["name", "full_name"] as const) {
            if (typeof intentMetadata[key] !== "string" || !intentMetadata[key].trim()) {
                delete intentMetadata[key];
            }
        }
        const mergedMetadata = { ...user.user_metadata, ...intentMetadata, account_type: accountType, role, registration_flow: "google_signup" };
        const { data, error: metadataError } = await admin.auth.admin.updateUserById(user.id, { user_metadata: mergedMetadata });
        if (metadataError || !data.user) {
            log("signup_metadata_save_failed", { userId: user.id, error: metadataError?.name ?? "missing_user" });
            return callbackRedirect("/auth/recovery?reason=profile", requestUrl.origin);
        }
        profileUser = data.user;
    }

    if (!existingProfile) log("profile_creation_attempted", { userId: user.id, source: signupIntent ? "google_signup" : "authenticated_recovery" });
    const profileResult = existingProfile
        ? { data: existingProfile, error: null }
        : await ensureProfileForUser(profileUser);
    if (profileResult.error || !profileResult.data) {
        log("profile_recovery_failed", { userId: user.id, error: profileResult.error?.name ?? "missing_profile" });
        return callbackRedirect("/auth/recovery?reason=profile", requestUrl.origin);
    }
    let profile = profileResult.data;
    if (!existingProfile) log("profile_creation_succeeded", { userId: user.id });

    if (canApplySignupIntent && accountType && role && existingProfile) {
        const profilePatch: Record<string, unknown> = { role, account_type: accountType };
        const metadata = signupIntent?.user_metadata ?? {};
        if (typeof metadata.name === "string" && metadata.name.trim()) profilePatch.name = metadata.name.trim();
        if (typeof metadata.school_or_firm === "string") profilePatch.school_or_firm = metadata.school_or_firm || null;
        if (typeof metadata.location === "string") profilePatch.location = metadata.location || null;
        if (typeof metadata.bio === "string") profilePatch.bio = metadata.bio || null;
        if (typeof metadata.personal_site_url === "string") profilePatch.personal_site_url = metadata.personal_site_url || null;
        const { error: updateError } = await admin.from("profiles").update(profilePatch).eq("user_id", user.id);
        if (updateError) {
            log("signup_profile_update_failed", { userId: user.id, error: updateError.code ?? updateError.name });
            return callbackRedirect("/auth/recovery?reason=profile", requestUrl.origin);
        }
        const { data: refreshed, error: refreshedError } = await admin
            .from("profiles").select("id, user_id, name, slug, role, account_type, school_or_firm, created_at")
            .eq("user_id", user.id).single();
        if (refreshedError || !refreshed) return callbackRedirect("/auth/recovery?reason=profile", requestUrl.origin);
        profile = refreshed;
    }
    log("profile_ready", { userId: user.id, accountType: isAccountType(profile.account_type) ? profile.account_type : null });

    if (!isAccountType(profile.account_type)) {
        log("account_type_missing", { userId: user.id });
        await supabase.auth.signOut({ scope: "local" });
        return callbackRedirect("/join?auth_error=account_type_required", requestUrl.origin);
    }

    const { data: onboarding, error: onboardingError } = await admin
        .from("profile_onboarding").select("onboarding_completed").eq("user_id", user.id).maybeSingle();
    if (onboardingError) {
        log("onboarding_lookup_failed", { userId: user.id, error: onboardingError.code ?? onboardingError.name });
        return callbackRedirect("/auth/recovery?reason=onboarding", requestUrl.origin);
    }

    let completed = onboarding?.onboarding_completed ?? false;
    if (!onboarding) {
        const createdAt = Date.parse(user.created_at);
        const isNewRegistration = Boolean(signupIntent && (!existingProfile || intentCreatedProfile))
            || (Number.isFinite(createdAt) && Date.now() - createdAt < 30 * 60 * 1000);
        completed = !isNewRegistration;
        const metadata = signupIntent?.user_metadata ?? user.user_metadata;
        const interests = Array.isArray(metadata.professional_interests)
            ? metadata.professional_interests.filter((item): item is string => typeof item === "string").slice(0, 21)
            : [];
        const { error: onboardingCreateError } = await admin.from("profile_onboarding").upsert({
            user_id: user.id,
            profile_id: profile.id,
            onboarding_completed: completed,
            onboarding_step: completed ? 5 : 0,
            onboarding_started_at: profile.created_at,
            onboarding_completed_at: completed ? new Date().toISOString() : null,
            professional_interests: interests,
            professional_interest_other: interests.includes("Other") && typeof metadata.professional_interest_other === "string" ? metadata.professional_interest_other.slice(0, 120) : "",
        }, { onConflict: "user_id", ignoreDuplicates: true });
        if (onboardingCreateError) {
            log("onboarding_recovery_failed", { userId: user.id, error: onboardingCreateError.code ?? onboardingCreateError.name });
            return callbackRedirect("/auth/recovery?reason=onboarding", requestUrl.origin);
        }
        const { data: recoveredState, error: stateError } = await admin.from("profile_onboarding").select("onboarding_completed").eq("user_id", user.id).single();
        if (stateError || !recoveredState) return callbackRedirect("/auth/recovery?reason=onboarding", requestUrl.origin);
        completed = recoveredState.onboarding_completed;
    }

    const destination = completed ? rawNext ?? getAccountHome(profile.account_type) : "/onboarding";
    const { error: markerError } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, onboarding_required: !completed },
    });
    if (markerError) log("onboarding_guard_update_failed", { userId: user.id, error: markerError.name });
    log("redirect_selected", { userId: user.id, onboardingCompleted: completed, destination });
    return callbackRedirect(destination, requestUrl.origin);
    } catch (error) {
        const requestUrl = new URL(request.url);
        log("callback_unhandled_error", { error: error instanceof Error ? error.name : "unknown" });
        return callbackRedirect("/auth/recovery?reason=profile", requestUrl.origin);
    }
}
