import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import OnboardingFrame from "../OnboardingFrame";
import PortfolioEditor from "@/app/(dashboard)/profile/PortfolioEditor";

export const dynamic = "force-dynamic";

export default async function OnboardingPortfolioPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/login");
    const { data: portfolioItems } = await getPortfolioItemsForProfile(profile.id);
    return (
        <OnboardingFrame step={3}>
            <section className="mx-auto max-w-4xl">
                <div className="mb-7"><p className="eyebrow font-mono text-redline">03 / PORTFOLIO</p><h1 className="display-balance mt-2 font-display text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Show the work.</h1><p className="mt-2 max-w-lg text-sm leading-relaxed text-graphite">Add a project if you have one ready. You can always come back and build this out later.</p></div>
                <PortfolioEditor initialItems={portfolioItems ?? []} />
                <div className="sticky bottom-3 z-10 mt-6 flex flex-col gap-3 rounded-xl border border-line bg-warm-white/95 p-2.5 shadow-lg backdrop-blur-md sm:bottom-4 sm:flex-row sm:items-center sm:justify-between"><a href="/onboarding/links" className="interactive inline-flex min-h-10 items-center rounded-lg px-2 font-mono text-[10px] uppercase tracking-wider text-graphite hover:bg-paper hover:text-ink">← Back to links</a><Link href={`/p/${profile.slug}`} className="interactive inline-flex min-h-11 items-center justify-center rounded-lg border border-ink bg-ink px-4 font-mono text-[10px] uppercase tracking-wider text-paper hover:border-redline hover:bg-redline">Finish and view profile</Link></div>
            </section>
        </OnboardingFrame>
    );
}
