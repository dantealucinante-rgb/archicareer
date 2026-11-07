import { NextResponse } from "next/server";
import { z } from "zod";
import { GOOGLE_SIGNUP_INTENT_COOKIE, INTENT_MAX_AGE_SECONDS, signGoogleSignupIntent } from "@/lib/auth/google-signup-intent";

const accountTypes = ["student", "professional", "firm", "business"] as const;
const shortText = (max: number) => z.string().trim().max(max).optional();
const registrationDetailsSchema = z.object({
    first_name: shortText(80), last_name: shortText(80), discipline: shortText(100), primary_industry: shortText(100),
    academic_level: shortText(40), graduation_year: shortText(4), professional_title: shortText(120), years_experience: shortText(40),
    organization_type: shortText(100), company_size: shortText(40), year_established: shortText(4), business_category: shortText(120),
    products_services: z.array(z.string().trim().max(100)).max(24).optional(), other_profession: shortText(120),
}).strict();
const requestSchema = z.object({
    account_type: z.enum(accountTypes),
    user_metadata: z.object({
        full_name: z.string().trim().max(180),
        name: z.string().trim().max(180),
        role: z.enum(["student", "architect", "firm"]),
        account_type: z.enum(accountTypes),
        school_or_firm: shortText(180).nullable().optional(),
        location: shortText(120),
        bio: shortText(700).nullable().optional(),
        personal_site_url: shortText(300),
        professional_interests: z.array(z.string().trim().min(1).max(60)).max(21),
        professional_interest_other: shortText(120),
        registration_details: registrationDetailsSchema.optional(),
    }),
}).strict();

function roleFor(accountType: (typeof accountTypes)[number]) {
    return accountType === "student" ? "student" : accountType === "professional" ? "architect" : "firm";
}

export async function POST(request: Request) {
    const raw = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success || parsed.data.user_metadata.account_type !== parsed.data.account_type || parsed.data.user_metadata.role !== roleFor(parsed.data.account_type)) {
        return NextResponse.json({ error: "Your registration details are invalid. Return to account selection and try again." }, { status: 400 });
    }
    try {
        const response = NextResponse.json({ ok: true });
        response.cookies.set(GOOGLE_SIGNUP_INTENT_COOKIE, signGoogleSignupIntent({
            account_type: parsed.data.account_type,
            role: parsed.data.user_metadata.role,
            user_metadata: parsed.data.user_metadata,
        }), {
            httpOnly: true,
            secure: new URL(request.url).protocol === "https:",
            sameSite: "lax",
            path: "/",
            maxAge: INTENT_MAX_AGE_SECONDS,
        });
        return response;
    } catch {
        return NextResponse.json({ error: "Google sign-up could not be prepared. Try again or use email." }, { status: 503 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(GOOGLE_SIGNUP_INTENT_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    return response;
}
