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
    const role = next.startsWith("/firms") ? "firm" : requestedRole === "architect" ? "architect" : requestedRole === "student" ? "student" : null;

    // OAuth does not receive signup form metadata. Carry the explicit, validated
    // account context through the callback before onboarding creates a profile.
    if (role) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const admin = createAdminClient();
            await admin.auth.admin.updateUserById(user.id, {
                user_metadata: { ...user.user_metadata, role },
            });
            await admin.from("profiles").update({ role }).eq("user_id", user.id);
        }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
