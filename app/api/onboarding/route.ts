import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getProfileOnboardingState } from "@/lib/onboarding";
import { isAccountActive } from "@/lib/admin";

const text = (max: number) => z.string().trim().max(max).optional();
const website = z.string().trim().max(300).optional().refine((value) => {
    if (!value) return true;
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "Enter a website beginning with http:// or https://.");

const identitySchemas = {
    student: z.object({
        first_name: text(80), last_name: text(80), institution: text(180), discipline: text(100),
        academic_level: z.enum(["First year", "Second year", "Third year", "Fourth year", "Fifth year", "Sixth year or above", "Postgraduate", "Other"]).optional(),
        graduation_year: z.string().trim().max(4).optional(), location: text(100),
    }),
    professional: z.object({
        first_name: text(80), last_name: text(80), professional_title: text(120), discipline: text(100),
        location: text(100), experience: z.enum(["0–2 years", "3–5 years", "6–10 years", "11–15 years", "16+ years"]).optional(), bio: text(500),
    }),
    firm: z.object({
        organization_name: text(180),
        organization_type: z.enum(["Architecture Studio", "Architecture Firm", "Interior Design Studio", "Engineering Consultancy", "Construction Company", "Design Consultancy", "Multidisciplinary Practice", "Other"]).optional(),
        organization_type_other: text(100), location: text(100), website, year_established: z.string().trim().max(4).optional(),
        company_size: z.enum(["Just me", "2–5 employees", "6–10 employees", "11–25 employees", "26–50 employees", "51–100 employees", "100+ employees"]).optional(),
        description: text(700),
    }),
    business: z.object({
        organization_name: text(180), business_category: text(120), location: text(100), website,
        products_services: z.array(z.string().trim().min(1).max(100)).max(24).optional(), description: text(700),
    }),
} satisfies Record<string, z.ZodType>;

const interestValues = ["Architecture", "Interior Design", "Landscape Architecture", "Structural Engineering", "Civil Engineering", "Construction", "Building", "Contracting", "Urban Planning", "3D Visualisation", "3D Modelling", "Product Design", "Furniture Design", "Material Design", "Project Management", "Real Estate", "Building Materials", "Manufacturing", "Photography", "Graphic Design", "Other"] as const;

const requestSchema = z.object({
    data: z.record(z.string(), z.unknown()).optional(),
    step: z.number().int().min(0).max(5).optional(),
    skip: z.enum(["project", "connections"]).optional(),
    complete: z.boolean().optional(),
    interests: z.array(z.enum(interestValues)).max(21).optional(),
    interest_other: z.string().trim().max(120).optional(),
});

const stageBefore = (step: number, accountType: string) => accountType === "business" && step === 4 ? 2 : step - 1;
const stageAfter = (step: number, accountType: string) => accountType === "business" && step === 2 ? 4 : step + 1;

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Sign in to continue setup." }, { status: 401 });
        const [{ data: profile }, onboarding] = await Promise.all([getCurrentProfile(), getProfileOnboardingState(user.id)]);
        if (!profile) return NextResponse.json({ error: "Your profile could not be loaded." }, { status: 404 });
        if (onboarding.error || !onboarding.data) return NextResponse.json({ error: "Your setup record is not ready yet. Refresh the page or contact hello@archicareer.ng." }, { status: 503 });
        return NextResponse.json({ profile, onboarding: onboarding.data });
    } catch {
        return NextResponse.json({ error: "Unable to load setup progress." }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Sign in to continue setup." }, { status: 401 });
        if (!(await isAccountActive(user.id))) return NextResponse.json({ error: "Account access is restricted." }, { status: 403 });

        const raw = await request.json().catch(() => null);
        const parsed = requestSchema.safeParse(raw);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Setup details are invalid." }, { status: 400 });

        const [{ data: profile }, current] = await Promise.all([getCurrentProfile(), getProfileOnboardingState(user.id)]);
        if (!profile) return NextResponse.json({ error: "Your profile could not be loaded." }, { status: 404 });
        if (current.error || !current.data) return NextResponse.json({ error: "Your setup record is not ready yet. Refresh the page or contact hello@archicareer.ng." }, { status: 503 });
        if (current.data.onboarding_completed) return NextResponse.json({ error: "Setup is already complete." }, { status: 409 });

        const accountType = profile.account_type;
        const identitySchema = identitySchemas[accountType];
        if (!identitySchema) return NextResponse.json({ error: "We could not identify your account type. Contact hello@archicareer.ng for help." }, { status: 409 });
        const patch = parsed.data;
        const identity = patch.data ? identitySchema.safeParse(patch.data) : null;
        if (identity && !identity.success) return NextResponse.json({ error: identity.error.issues[0]?.message ?? "Check the details and try again." }, { status: 400 });

        const mergedData: Record<string, unknown> = { ...current.data.onboarding_data, ...(identity?.success ? identity.data as Record<string, unknown> : {}) };
        const interests = patch.interests ?? current.data.professional_interests;
        const interestOther = patch.interest_other ?? current.data.professional_interest_other;
        if (new Set(interests).size !== interests.length) return NextResponse.json({ error: "Remove duplicate interest selections." }, { status: 400 });

        let nextStep = current.data.onboarding_step;
        const skipped = [...current.data.onboarding_skipped_steps];
        if (patch.complete) {
            if (current.data.onboarding_step !== 5) return NextResponse.json({ error: "Complete the remaining setup stages first." }, { status: 409 });
            if (interests.length === 0 || (interests.includes("Other") && !interestOther.trim())) return NextResponse.json({ error: "Choose at least one interest and describe Other if selected." }, { status: 400 });
        } else if (patch.skip) {
            const validSkip = (patch.skip === "project" && accountType !== "business" && current.data.onboarding_step === 3)
                || (patch.skip === "connections" && current.data.onboarding_step === 4);
            if (!validSkip) return NextResponse.json({ error: "That optional stage cannot be skipped from here." }, { status: 409 });
            if (!skipped.includes(patch.skip)) skipped.push(patch.skip);
            nextStep = stageAfter(current.data.onboarding_step, accountType);
        } else if (patch.step !== undefined && patch.step !== current.data.onboarding_step) {
            const forward = patch.step === stageAfter(current.data.onboarding_step, accountType);
            const backward = patch.step === stageBefore(current.data.onboarding_step, accountType);
            if (!forward && !backward) return NextResponse.json({ error: "Continue through setup one stage at a time." }, { status: 409 });
            if (forward && current.data.onboarding_step === 1) {
                const required = accountType === "student"
                    ? [mergedData.first_name, mergedData.last_name, mergedData.institution, mergedData.discipline, mergedData.academic_level]
                    : accountType === "professional"
                        ? [mergedData.first_name, mergedData.last_name, mergedData.professional_title, mergedData.discipline]
                        : accountType === "firm"
                            ? [mergedData.organization_name, mergedData.organization_type]
                            : [mergedData.organization_name, mergedData.business_category];
                if (required.some((value) => typeof value !== "string" || !value.trim())) return NextResponse.json({ error: "Complete the required identity details before continuing." }, { status: 400 });
            }
            if (forward && current.data.onboarding_step === 2 && interests.length === 0) return NextResponse.json({ error: "Choose at least one professional interest before continuing." }, { status: 400 });
            if (forward && current.data.onboarding_step === 2 && interests.includes("Other") && !interestOther.trim()) return NextResponse.json({ error: "Describe your other interest before continuing." }, { status: 400 });
            if (forward && accountType === "business" && current.data.onboarding_step === 2 && !skipped.includes("project")) skipped.push("project");
            nextStep = patch.step;
        }

        const admin = createAdminClient();
        const updateQuery = admin.from("profile_onboarding").update({
            onboarding_step: nextStep,
            onboarding_skipped_steps: skipped,
            onboarding_data: mergedData,
            professional_interests: interests,
            professional_interest_other: interests.includes("Other") ? interestOther : "",
            ...(patch.complete ? { onboarding_completed: true, onboarding_completed_at: new Date().toISOString() } : {}),
        }).eq("user_id", user.id).eq("profile_id", profile.id);
        const { error: saveError } = await updateQuery;
        if (saveError) return NextResponse.json({ error: "We could not save your setup. Please try again." }, { status: 500 });

        if (patch.complete) {
            const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
                app_metadata: { ...user.app_metadata, onboarding_required: false },
            });
            if (authUpdateError) return NextResponse.json({ error: "Your profile is saved, but access setup could not be refreshed. Reload and try again." }, { status: 503 });
        }

        const saved = await getProfileOnboardingState(user.id);
        if (saved.error || !saved.data) return NextResponse.json({ error: "Your setup was saved, but we could not reload it. Refresh the page." }, { status: 500 });
        return NextResponse.json({ onboarding: saved.data });
    } catch {
        return NextResponse.json({ error: "Unable to save setup progress." }, { status: 500 });
    }
}
