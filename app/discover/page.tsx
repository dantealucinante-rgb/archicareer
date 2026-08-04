import Link from "next/link";
import { searchProfiles } from "@/lib/queries/profiles";
import { Profile, UserRole } from "@/types";

interface DiscoverPageProps {
    searchParams: Promise<{ role?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
    const params = await searchParams;
    const role = ["student", "architect", "firm"].includes(params.role ?? "")
        ? params.role as UserRole
        : undefined;
    const { data: profiles, error: profilesError } = await searchProfiles({ role });

    return (
        <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
                <div className="mb-10 grid gap-6 border-b border-line pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div><div className="eyebrow mb-4 font-mono text-redline">A-04 / DISCOVER</div><h1 className="display-balance max-w-2xl font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">Meet the people behind the work.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-graphite">Explore profiles from emerging talent, experienced professionals, studios, and companies.</p></div>
                    <div className="rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-graphite">{profiles?.length ?? 0} records shown</div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
                    {/* Filters column */}
                    <form method="get" className="surface h-fit p-5 lg:sticky lg:top-28">
                        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Tune the field</h2>
                        <p className="mt-2 text-xs leading-relaxed text-graphite">Start with the kind of practice you want to meet.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-mono text-xs uppercase tracking-wider text-graphite mb-1.5">Role</label>
                                <select name="role" defaultValue={role ?? ""} className="w-full rounded-xl border border-line bg-paper p-3 text-sm font-mono text-ink focus:outline-none focus:border-ink cursor-pointer">
                                    <option value="">All Roles</option>
                                    <option value="student">Student</option>
                                    <option value="architect">Architect</option>
                                    <option value="firm">Architecture Firm</option>
                                </select>
                                <button type="submit" className="mt-3 w-full rounded-full border border-ink bg-ink px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-paper transition-all duration-300 hover:-translate-y-0.5 hover:bg-redline">
                                    Filter records ↗
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Results column */}
                    <div>
                        {profilesError ? (
                            <div className="border border-dashed border-redline p-12 text-center text-redline font-mono text-xs uppercase tracking-widest">Unable to load profiles right now. Please try again.</div>
                        ) : profiles && profiles.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {profiles.map((profile: Profile) => (
                                    <Link
                                        key={profile.id}
                                        href={`/p/${profile.slug}`}
                                        className="surface card-lift group flex min-h-[240px] flex-col justify-between p-5"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="grid h-10 w-10 place-items-center rounded-full bg-sand font-display text-lg font-semibold text-ink">{profile.name.slice(0, 1).toUpperCase()}</div>
                                                <span className="rounded-full border border-line px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-graphite bg-paper shrink-0 ml-2">
                                                    {profile.role}
                                                </span>
                                            </div>
                                            <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-ink group-hover:text-redline transition-colors">{profile.name}</h3>
                                            {profile.school_or_firm && (
                                                <p className="font-mono text-[10px] text-graphite uppercase tracking-wider mb-2">{profile.school_or_firm}</p>
                                            )}
                                            {profile.bio && (
                                                <p className="text-xs text-graphite leading-relaxed line-clamp-2">{profile.bio}</p>
                                            )}
                                        </div>
                                        <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-3">
                                            <span className="font-mono text-[9px] text-graphite tracking-wider">{profile.location ?? "Nigeria"}</span><span className="text-lg text-redline transition-transform duration-300 group-hover:translate-x-1">↗</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-line p-12 text-center text-graphite bg-paper font-mono text-xs uppercase tracking-widest">
                                <p>No profiles found matching search criteria.</p><p className="mt-3 font-sans text-sm normal-case tracking-normal">Try a broader role or location search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
