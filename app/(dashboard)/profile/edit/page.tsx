import ProfileEditor from "../ProfileEditor";
import { getCurrentProfile } from "@/lib/queries/profiles";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
    const { data: profile } = await getCurrentProfile();

    return (
        <div className="bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
                <div className="mb-10 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="eyebrow font-mono text-redline">DASHBOARD / {profile?.role === "firm" ? "EDIT FIRM PROFILE" : "EDIT PROFILE"}</p>
                        <h1 className="display-balance mt-3 max-w-xl font-display text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">{profile?.role === "firm" ? "Make your practice easier to find." : "Shape how people meet your work."}</h1>
                        <p className="mt-5 max-w-xl text-sm leading-relaxed text-graphite">{profile?.role === "firm" ? "Keep your organisation, capabilities, and selected work clear for the people you want to reach." : "Keep your public profile clear, current, and easy to understand. Changes are saved to the profile people see."}</p>
                    </div>
                    {profile?.slug && <a href={`/p/${profile.slug}`} className="interactive inline-flex w-fit items-center justify-center rounded-full border border-ink px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-ink hover:bg-ink hover:text-paper">View public profile ↗</a>}
                </div>

                <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-start">
                    <aside className="hidden lg:block lg:sticky lg:top-28">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-graphite">Profile sections</p>
                        <nav className="mt-4 space-y-2 border-l border-line pl-4 text-sm">
                            <a href="#about" className="block text-ink hover:text-redline">{profile?.role === "firm" ? "About the practice" : "About you"}</a>
                            <a href="#links" className="block text-graphite hover:text-redline">Links & files</a>
                        </nav>
                        <p className="mt-10 text-xs leading-relaxed text-graphite">{profile?.role === "firm" ? "Your firm profile is a clear introduction to the practice, its capabilities, and its work." : "Your public profile is a living introduction—not a form to fill once and forget."}</p>
                    </aside>

                    <div className="surface p-5 sm:p-8">
                        <ProfileEditor profile={profile} variant={profile?.role === "firm" ? "firm" : "individual"} />
                    </div>
                </div>
            </main>
        </div>
    );
}
