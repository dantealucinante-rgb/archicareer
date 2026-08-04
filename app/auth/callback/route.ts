import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const requestedNext = requestUrl.searchParams.get("next") || "/profile";
    // Only allow relative in-app redirects after authentication.
    let next = "/profile";
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

    // OAuth does not carry the selected role in the same way as email signup.
    // Firm routes are an explicit account context, so enforce the firm role
    // before sending the user into the firm experience.
    if (next.startsWith("/firms")) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const admin = createAdminClient();
            await admin.auth.admin.updateUserById(user.id, {
                user_metadata: { ...user.user_metadata, role: "firm" },
            });
            await admin.from("profiles").update({ role: "firm" }).eq("user_id", user.id);
        }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
