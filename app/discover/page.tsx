import Link from "next/link";
import { searchProfiles } from "@/lib/queries/profiles";
import { Profile, UserRole } from "@/types";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import FollowButton from "@/app/components/FollowButton";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getFollowCountsForTargets, getFollowStatesForTargets, getProfileOwnerUserIds } from "@/lib/queries/follows";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Discover Nigerian Architects and Architecture Students",
    description: "Meet architecture students, architects, studios, and companies building the future of architecture in Nigeria.",
    alternates: { canonical: "/discover" },
};

interface DiscoverPageProps {
    searchParams: Promise<{ role?: string; page?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
    const params = await searchParams;
    const role = ["student", "architect", "firm"].includes(params.role ?? "")
        ? params.role as UserRole
        : undefined;
    const requestedPage = Number.parseInt(params.page ?? "1", 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageSize = 24;
    const { data: profiles, error: profilesError, count } = await searchProfiles(
        { role },
        { limit: pageSize, offset: (page - 1) * pageSize },
        { sortBy: "created_at", ascending: false },
    );
    const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
    const canGoBack = page > 1;
    const canGoForward = page < totalPages;
    const pageHref = (nextPage: number) => `/discover?${new URLSearchParams({ ...(role ? { role } : {}), page: String(nextPage) })}`;
    const { data: currentProfile } = await getCurrentProfile();
    const ownerIds = await getProfileOwnerUserIds((profiles ?? []).map((profile) => profile.id));
    const followCounts = await getFollowCountsForTargets(Object.values(ownerIds));
    const followStates = await getFollowStatesForTargets(currentProfile?.user_id ?? null, Object.values(ownerIds));

    return (
        <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
                <div className="mb-10 grid gap-6 border-b border-line pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="min-w-0"><div className="eyebrow mb-4 font-mono text-redline">A-04 / DISCOVER</div><h1 className="display-balance max-w-2xl break-words font-display text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">Meet the people behind the work.</h1><p className="mt-5 max-w-xl break-words text-base leading-relaxed text-graphite">Explore profiles from emerging talent, experienced professionals, studios, and companies.</p></div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
                    {/* Filters column */}
                    <details className="surface h-fit p-5 lg:sticky lg:top-28" open={false}>
                        <summary className="cursor-pointer list-none font-display text-lg font-semibold tracking-tight text-ink lg:pointer-events-none">Tune the field <span className="float-right font-mono text-[10px] font-normal uppercase tracking-widest text-graphite lg:hidden">Filter +</span></summary>
                        <p className="mt-2 text-xs leading-relaxed text-graphite">Start with the kind of practice you want to meet.</p>
                        <form method="get" className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="discover-role" className="block font-mono text-xs uppercase tracking-wider text-graphite mb-1.5">Role</label>
                                <select id="discover-role" name="role" defaultValue={role ?? ""} className="w-full rounded-xl border border-line bg-paper p-3 text-sm font-mono text-ink focus:outline-none focus:border-ink cursor-pointer">
                                    <option value="">All Roles</option>
                                    <option value="student">Student</option>
                                    <option value="architect">Architect</option>
                                    <option value="firm">Architecture Firm</option>
                                </select>
                                <button type="submit" className="mt-3 w-full rounded-full border border-ink bg-ink px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-paper transition-all duration-300 hover:-translate-y-0.5 hover:bg-redline">
                                    Filter profiles ↗
                                </button>
                                {role && <Link href="/discover" className="mt-3 block text-center font-mono text-[10px] uppercase tracking-widest text-graphite underline underline-offset-4 hover:text-ink">Clear filter</Link>}
                            </div>
                        </form>
                    </details>

                    {/* Results column */}
                    <div>
                        {profilesError ? (
                            <div className="rounded-2xl border border-redline/30 bg-redline/5 p-10 text-center"><p className="font-display text-xl text-ink">We could not load the field.</p><p className="mt-2 text-sm text-graphite">Please try again.</p><Link href={`/discover?${new URLSearchParams({ ...(role ? { role } : {}), page: String(page) })}`} className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-redline underline underline-offset-4">Retry</Link></div>
                        ) : profiles && profiles.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {profiles.map((profile: Profile) => (
                                        <div
                                            key={profile.id}
                                            className="surface card-lift relative flex min-h-[220px] flex-col justify-between p-4 sm:min-h-[240px] sm:p-5"
                                        >
                                        <Link href={`/p/${profile.slug}`} aria-label={`View ${profile.name}'s profile`} className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redline" />
                                        <div className="relative z-10 mb-3 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
                                                <ProfileAvatar profile={profile} size={40} className="h-10 w-10 rounded-full border border-line object-cover" />
                                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                                    {currentProfile?.id !== profile.id && ownerIds[profile.id] && (<span className="pointer-events-auto">
                                                        <FollowButton
                                                            followingId={ownerIds[profile.id]}
                                                            initialFollowing={followStates[ownerIds[profile.id]]?.isFollowing ?? false}
                                                            initialMutual={followStates[ownerIds[profile.id]]?.isMutual ?? false}
                                                            initialFollowerCount={followCounts[ownerIds[profile.id]]?.followers ?? 0}
                                                            compact
                                                        />
                                                    </span>)}
                                                    <span className="shrink-0 rounded-full border border-line bg-paper px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-graphite">{profile.role}</span>
                                                </div>
                                            </div>
                                            <div className="group relative z-10 flex flex-1 flex-col justify-between pointer-events-none">
                                                <div>
                                                    <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-ink transition-colors group-hover:text-redline">{profile.name}</h3>
                                                    {profile.school_or_firm && (
                                                        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-graphite">{profile.school_or_firm}</p>
                                                    )}
                                                    {profile.bio && (
                                                        <p className="line-clamp-2 text-xs leading-relaxed text-graphite">{profile.bio}</p>
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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {totalPages > 1 && <nav aria-label="Profile results pages" className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5"><Link href={pageHref(page - 1)} aria-disabled={!canGoBack} tabIndex={canGoBack ? undefined : -1} className={`rounded-full border border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest ${canGoBack ? "text-ink hover:bg-ink hover:text-paper" : "pointer-events-none border-line text-graphite/60"}`}>Previous</Link><p className="font-mono text-[10px] uppercase tracking-widest text-graphite">Page {page} of {totalPages}</p><Link href={pageHref(page + 1)} aria-disabled={!canGoForward} tabIndex={canGoForward ? undefined : -1} className={`rounded-full border border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest ${canGoForward ? "text-ink hover:bg-ink hover:text-paper" : "pointer-events-none border-line text-graphite/60"}`}>Next</Link></nav>}
                            </>
                        ) : (
                            <div className="border border-dashed border-line p-12 text-center text-graphite bg-paper font-mono text-xs uppercase tracking-widest">
                                <p>No profiles found matching this role.</p><p className="mt-3 font-sans text-sm normal-case tracking-normal">Try viewing the full community instead.</p><Link href="/discover" className="mt-5 inline-block text-redline underline underline-offset-4 hover:text-ink">View all profiles</Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
