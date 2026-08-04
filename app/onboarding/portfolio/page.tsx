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
            <section className="surface mx-auto max-w-4xl p-6 sm:p-10">
                <div className="mb-8 border-b border-line pb-6"><p className="eyebrow font-mono text-redline">03 / PORTFOLIO</p><h1 className="display-balance mt-3 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl">Show the work.</h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-graphite">Add a project if you have one ready. You can always come back and build this out later.</p></div>
                <PortfolioEditor initialItems={portfolioItems ?? []} />
                <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"><a href="/onboarding/links" className="font-mono text-[10px] uppercase tracking-widest text-graphite hover:text-ink">← Back to links</a><Link href={`/p/${profile.slug}`} className="interactive inline-flex items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-mono text-xs uppercase tracking-widest text-paper hover:border-redline hover:bg-redline">Finish and view profile ↗</Link></div>
            </section>
        </OnboardingFrame>
    );
}
