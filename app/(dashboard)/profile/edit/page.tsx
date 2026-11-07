import ProfileEditor from "../ProfileEditor";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { redirect } from "next/navigation";
import { getProfileOnboardingState } from "@/lib/onboarding";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import PortfolioEditor from "../PortfolioEditor";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/onboarding/about");
    const [onboarding, portfolio] = await Promise.all([getProfileOnboardingState(profile.user_id), getPortfolioItemsForProfile(profile.id, 24, 0)]);
    const type = profile.account_type;
    const accountLabel = type === "student" ? "STUDENT" : type === "professional" ? "PROFESSIONAL" : type === "firm" ? "FIRM" : "BUSINESS";
    const intro = type === "student" ? "Keep your academic profile and work current." : type === "professional" ? "Keep your professional identity, work, and links current." : type === "firm" ? "Keep your firm identity, work, and public contact details current." : "Keep your business identity, work, and public contact details current.";

    return (
        <div className="bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
                <div className="mb-10 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="eyebrow font-mono text-redline">DASHBOARD / EDIT {accountLabel} PROFILE</p>
                        <h1 className="display-balance mt-3 max-w-xl font-display text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">Edit your profile</h1>
                        <p className="mt-5 max-w-xl text-sm leading-relaxed text-graphite">{intro} Changes appear on your public ArchiCareer profile.</p>
                    </div>
                    {profile?.slug && <a href={`/p/${profile.slug}`} className="interactive inline-flex w-fit items-center justify-center rounded-full border border-ink px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-ink hover:bg-ink hover:text-paper">View public profile</a>}
                </div>

                <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-start">
                    <nav className="flex gap-4 overflow-x-auto border-y border-line py-3 text-sm lg:hidden"><a href="#about" className="shrink-0 text-ink">{type === "student" ? "Academic identity" : type === "professional" ? "Professional details" : type === "firm" ? "Firm details" : "Business details"}</a><a href="#links" className="shrink-0 text-graphite">Links & files</a><a href="#portfolio" className="shrink-0 text-graphite">Projects</a></nav>
                    <aside className="hidden lg:block lg:sticky lg:top-28">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-graphite">Profile sections</p>
                        <nav className="mt-4 space-y-2 border-l border-line pl-4 text-sm">
                            <a href="#about" className="block text-ink hover:text-redline">{type === "student" ? "Academic identity" : type === "professional" ? "Professional details" : type === "firm" ? "Firm details" : "Business details"}</a>
                            <a href="#links" className="block text-graphite hover:text-redline">Links & files</a>
                            <a href="#portfolio" className="block text-graphite hover:text-redline">Projects</a>
                        </nav>
                        <p className="mt-10 text-xs leading-relaxed text-graphite">{intro}</p>
                    </aside>

                    <div className="surface p-5 sm:p-8">
                        <ProfileEditor profile={profile} accountType={type} variant={type === "firm" || type === "business" ? "firm" : "individual"} professionalInterests={onboarding.data?.professional_interests ?? []} professionalInterestOther={onboarding.data?.professional_interest_other ?? ""} />
                        <section id="portfolio" className="mt-12 scroll-mt-28 border-t border-line pt-8">
                            <div className="mb-6"><p className="eyebrow font-mono text-redline">PROJECTS & PORTFOLIO</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">Manage your work</h2><p className="mt-2 max-w-xl text-sm text-graphite">Add or update projects shown on your public profile.</p></div>
                            <PortfolioEditor initialItems={portfolio.data ?? []} variant={type === "firm" || type === "business" ? "firm" : "individual"} startCollapsed />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
