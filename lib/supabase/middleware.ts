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

    return supabaseResponse;
}
