import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import PortfolioEditor from "./PortfolioEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/onboarding/about");

    const { data: portfolioItems } = await getPortfolioItemsForProfile(profile.id);

    return (
        <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
                <div className="mb-8 flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-4">
                        <ProfileAvatar profile={profile} size={72} className="h-16 w-16 rounded-full border border-line object-cover" />
                        <div>
                            <p className="eyebrow font-mono text-redline">YOUR PROFILE / {profile.role}</p>
                            <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{profile.name}</h1>
                            <p className="mt-2 max-w-xl text-sm text-graphite">{profile.bio ?? "Build a profile that gives your work somewhere to live."}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {profile.slug && <Link href={`/p/${profile.slug}`} className="inline-flex items-center rounded-full border border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest hover:border-ink">View public profile ↗</Link>}
                        <Link href="/profile/edit" className="inline-flex items-center rounded-full bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-redline">Edit profile</Link>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-start">
                    <aside className="hidden lg:block lg:sticky lg:top-28">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-graphite">Profile workspace</p>
                        <nav className="mt-4 space-y-2 border-l border-line pl-4 text-sm">
                            <a href="#portfolio" className="block text-ink hover:text-redline">Portfolio</a>
                            <Link href="/profile/edit" className="block text-graphite hover:text-redline">Profile details</Link>
                        </nav>
                        <p className="mt-10 text-xs leading-relaxed text-graphite">Your work lives here first. Add projects as you finish them, then share the public profile when it feels ready.</p>
                    </aside>

                    <div className="surface p-5 sm:p-8">
                        <PortfolioEditor initialItems={portfolioItems ?? []} variant={profile.role === "firm" ? "firm" : "individual"} startCollapsed />
                    </div>
                </div>
            </main>
        </div>
    );
}
