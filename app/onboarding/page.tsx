import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import { createClient } from "@/lib/supabase/server";
import { getAccountHome, getProfileOnboardingState, isAccountType } from "@/lib/onboarding";
import OnboardingExperience from "./OnboardingExperience";
import type { PortfolioItem } from "@/types";

export const dynamic = "force-dynamic";

function OnboardingProblem({ title, message }: { title: string; message: string }) {
    return <main className="min-h-screen bg-paper px-5 py-16 text-ink sm:px-10"><div className="mx-auto max-w-2xl border-2 border-ink bg-white p-7 sm:p-10"><p className="font-mono text-xs font-bold uppercase tracking-widest text-redline">ARCHICAREER / SETUP</p><h1 className="mt-5 font-display text-4xl font-bold leading-none tracking-[-0.06em] sm:text-6xl">{title}</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-graphite">{message}</p><div className="mt-8 flex flex-wrap gap-4"><a href="/onboarding" className="inline-flex min-h-12 items-center border-2 border-ink bg-ink px-6 font-semibold text-white">Try again</a><a href="mailto:hello@archicareer.ng" className="inline-flex min-h-12 items-center border-b-2 border-ink font-semibold">Contact ArchiCareer support</a></div></div></main>;
}

function registrationContext(user: { user_metadata?: Record<string, unknown> }, rawOnboarding?: string) {
    const metadata = user.user_metadata ?? {};
    let parsed: Record<string, unknown> = {};
    if (rawOnboarding) {
        try { parsed = JSON.parse(rawOnboarding) as Record<string, unknown>; } catch { /* Use the metadata saved at registration. */ }
    }
    return {
        registrationDetails: metadata.registration_details ?? {},
        interests: Array.isArray(metadata.professional_interests)
            ? metadata.professional_interests.filter((value): value is string => typeof value === "string")
            : Array.isArray(parsed.interests) ? parsed.interests.filter((value): value is string => typeof value === "string") : [],
        interestOther: typeof metadata.professional_interest_other === "string"
            ? metadata.professional_interest_other
            : typeof parsed.interest_other === "string" ? parsed.interest_other : "",
    };
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
    const params = await searchParams;
    const [{ data: profile }, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) redirect("/login");
    if (!isAccountType(profile.account_type)) {
        return <OnboardingProblem title="We need to confirm your account type." message="We could not determine which ArchiCareer setup fits this account. Contact us and we’ll help you continue." />;
    }

    const onboarding = await getProfileOnboardingState(user.id);
    if (onboarding.error || !onboarding.data) {
        return <OnboardingProblem title="Your setup is not ready yet." message="Your account is signed in, but its private setup record could not be loaded. Refresh this page in a moment or contact hello@archicareer.ng." />;
    }
    if (onboarding.data.onboarding_completed) redirect(getAccountHome(profile.account_type));

    const [projects, context] = await Promise.all([
        profile.account_type === "business" ? Promise.resolve({ data: [] as PortfolioItem[] }) : getPortfolioItemsForProfile(profile.id),
        Promise.resolve(registrationContext(user, params.onboarding)),
    ]);
    const savedInterests = onboarding.data.professional_interests.length > 0
        ? onboarding.data.professional_interests
        : context.interests;
    const selectedInterests = savedInterests.filter((value): value is typeof savedInterests[number] => typeof value === "string");
    const currentStep = profile.account_type === "business" && onboarding.data.onboarding_step === 3 ? 4 : onboarding.data.onboarding_step;

    return <OnboardingExperience
        accountType={profile.account_type}
        profile={{ id: profile.id, user_id: profile.user_id, name: profile.name, slug: profile.slug, role: profile.role, school_or_firm: profile.school_or_firm, bio: profile.bio, location: profile.location, personal_site_url: profile.personal_site_url, avatar_url: profile.avatar_url }}
        onboarding={{ step: currentStep, data: onboarding.data.onboarding_data, skippedSteps: onboarding.data.onboarding_skipped_steps, interests: selectedInterests, interestOther: onboarding.data.professional_interest_other || context.interestOther }}
        registrationDetails={context.registrationDetails}
        initialProjects={projects.data ?? []}
        destination={getAccountHome(profile.account_type)}
    />;
}
