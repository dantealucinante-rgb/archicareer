import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    const url = request.nextUrl.clone();

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing extra code here. getUser() refreshes the session token.
    const { data: { user } } = await supabase.auth.getUser();

    const isProtectedRoute =
        url.pathname.startsWith("/profile") ||
        url.pathname.startsWith("/settings");

    if (isProtectedRoute && !user) {
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    const setupExemptRoutes = [
        "/",
        "/about",
        "/login",
        "/signup",
        "/firms/login",
        "/firms/signup",
        "/business/signup",
        "/join",
        "/waitlist",
        "/terms",
        "/privacy",
        "/cookies",
        "/reset-password",
        "/auth/callback",
        "/auth/recovery",
        "/onboarding",
    ];
    const isExempt = url.pathname.startsWith("/api/")
        || setupExemptRoutes.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
    if (user?.app_metadata?.onboarding_required === true && !isExempt) {
        url.pathname = "/onboarding";
        url.search = "";
        const redirectResponse = NextResponse.redirect(url);
        for (const cookie of supabaseResponse.cookies.getAll()) redirectResponse.cookies.set(cookie);
        return redirectResponse;
    }

    return supabaseResponse;
}
