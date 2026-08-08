import Link from "next/link";
import { searchProfiles } from "@/lib/queries/profiles";
import { Profile, UserRole } from "@/types";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import FollowButton from "@/app/components/FollowButton";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getFollowStatesForTargets, getProfileOwnerUserIds } from "@/lib/queries/follows";

interface DiscoverPageProps {
    searchParams: Promise<{ role?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
    const params = await searchParams;
    const role = ["student", "architect", "firm"].includes(params.role ?? "")
        ? params.role as UserRole
        : undefined;
    const { data: profiles, error: profilesError, count: profileCount = 0 } = await searchProfiles(
        { role },
        { limit: 1000, offset: 0 },
        { sortBy: "created_at", ascending: false, random: true },
    );
    const { data: currentProfile } = await getCurrentProfile();
    const ownerIds = await getProfileOwnerUserIds((profiles ?? []).map((profile) => profile.id));
    const followStates = await getFollowStatesForTargets(currentProfile?.user_id ?? null, Object.values(ownerIds));

    return (
        <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
                <div className="mb-10 grid gap-6 border-b border-line pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div><div className="eyebrow mb-4 font-mono text-redline">A-04 / DISCOVER</div><h1 className="display-balance max-w-2xl font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">Meet the people behind the work.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-graphite">Explore profiles from emerging talent, experienced professionals, studios, and companies.</p></div>
                    <div className="rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-graphite">{profileCount} records · shuffled</div>
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
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {profiles.map((profile: Profile) => (
                                        <div
                                            key={profile.id}
                                            className="surface card-lift flex min-h-[240px] flex-col justify-between p-5"
                                        >
                                            <Link href={`/p/${profile.slug}`} className="group flex min-h-[190px] flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <ProfileAvatar profile={profile} size={40} className="h-10 w-10 rounded-full border border-line object-cover" />
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
                                                <span className="font-mono text-[9px] uppercase tracking-wider text-graphite">View profile</span>
                                                <span aria-hidden="true" className="text-redline transition-transform duration-300 group-hover:translate-x-1">
                                                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M3 13 13 3M5 3h8v8" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </span>
                                            </div>
                                            </Link>
                                            {currentProfile?.id !== profile.id && ownerIds[profile.id] && <div className="mt-4 border-t border-line/70 pt-3"><FollowButton followingId={ownerIds[profile.id]} initialFollowing={followStates[ownerIds[profile.id]]?.isFollowing ?? false} initialMutual={followStates[ownerIds[profile.id]]?.isMutual ?? false} initialFollowerCount={0} compact /></div>}
                                        </div>
                                    ))}
                                </div>
                            </>
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
