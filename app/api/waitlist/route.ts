import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { WAITLIST_ACCOUNT_TYPES, WAITLIST_CATEGORIES } from "@/lib/waitlist-categories";

const signupSchema = z.object({
    full_name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    account_type: z.enum(WAITLIST_ACCOUNT_TYPES),
    profession_category: z.enum(WAITLIST_CATEGORIES).default("other"),
    consent: z.literal(true),
    website: z.string().max(200).optional(),
}).strict();

function getRequestIp(request: Request) {
    const directIp = request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip");
    const forwardedFor = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for");
    return (directIp ?? forwardedFor?.split(",").at(-1))?.trim() || null;
}

function isSameSiteRequest(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin) return false;

    try {
        const requestOrigin = new URL(request.url).origin;
        const allowedOrigins = new Set([requestOrigin]);
        const configuredSite = process.env.NEXT_PUBLIC_SITE_URL;
        if (configuredSite) allowedOrigins.add(new URL(configuredSite).origin);
        return allowedOrigins.has(new URL(origin).origin);
    } catch {
        return false;
    }
}

export async function POST(request: Request) {
    if (!isSameSiteRequest(request)) {
        return NextResponse.json({ error: "This request could not be verified. Refresh the page and try again." }, { status: 403 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 8_192) {
        return NextResponse.json({ error: "The submission is too large." }, { status: 413 });
    }

    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json({ error: "Please enter your name, a valid email, choose an account type, and agree to the launch update." }, { status: 400 });
    }
    if (parsed.data.website) {
        return NextResponse.json({ error: "This submission could not be verified." }, { status: 400 });
    }

    const ip = getRequestIp(request);
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!ip || !secret) {
        return NextResponse.json({ error: "Waitlist signups are temporarily unavailable. Please try again shortly." }, { status: 503 });
    }

    const ipHash = createHmac("sha256", secret).update(ip).digest("hex");

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.rpc("register_waitlist_signup", {
            p_full_name: parsed.data.full_name,
            p_email: parsed.data.email,
            p_profession_category: parsed.data.profession_category,
            p_ip_hash: ipHash,
            p_consent: parsed.data.consent,
            p_account_type: parsed.data.account_type,
        });

        if (error) {
            console.error("[waitlist] Signup could not be saved:", error.message);
            return NextResponse.json({ error: "We couldn't save your signup just now. Please try again shortly." }, { status: 503 });
        }
        if (data === "duplicate") {
            return NextResponse.json({ error: "That email is already on the waitlist.", code: "WAITLIST_DUPLICATE" }, { status: 409 });
        }
        if (data === "rate_limited") {
            return NextResponse.json({ error: "Too many attempts from this connection. Please try again in about an hour." }, { status: 429, headers: { "Retry-After": "3600" } });
        }
        if (data !== "joined") {
            return NextResponse.json({ error: "We couldn't verify this signup. Please try again." }, { status: 400 });
        }

        return NextResponse.json({ ok: true, message: "You’re on the list. We’ll be in touch when ArchiCareer is ready." }, { status: 201 });
    } catch (error) {
        console.error("[waitlist] Signup service is unavailable:", error instanceof Error ? error.message : error);
        return NextResponse.json({ error: "Waitlist signups are temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
}
