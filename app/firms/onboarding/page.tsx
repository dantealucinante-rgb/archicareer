import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";

export const dynamic = "force-dynamic";

export default async function FirmOnboardingPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/firms/login");
    return (
        <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-paper px-5 py-12 text-ink sm:px-8 sm:py-20">
            <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-sand/60 blur-3xl" />
            <section className="surface relative w-full max-w-2xl p-7 sm:p-10">
                <p className="eyebrow font-mono text-redline">FIRM / PROFILE READY</p>
                <h1 className="display-balance mt-4 font-display text-5xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-7xl">{profile.name} is ready to meet the right people.</h1>
                <p className="mt-6 max-w-xl text-sm leading-relaxed text-graphite">Your organisation profile has been created. You can refine the details, add projects, and post your first opportunity whenever you are ready.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href={`/p/${profile.slug}`} className="interactive inline-flex items-center justify-center rounded-full border border-ink bg-ink px-6 py-3.5 font-mono text-[11px] uppercase tracking-widest text-paper hover:border-redline hover:bg-redline">View firm profile ↗</Link><Link href="/profile/edit" className="interactive inline-flex items-center justify-center rounded-full border border-line bg-warm-white px-6 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink hover:border-ink">Complete profile</Link></div>
            </section>
        </main>
    );
}
