import { notFound } from "next/navigation";
import { getCurrentProfile, getProfileBySlug } from "@/lib/queries/profiles";
import { getPortfolioItemsForProfile } from "@/lib/queries/portfolio";
import PortfolioGallery from "@/app/components/PortfolioGallery";
import FirmPublicProfile from "@/app/components/FirmPublicProfile";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import FollowButton from "@/app/components/FollowButton";
import { getFollowCounts, getFollowState, getProfileOwnerUserId } from "@/lib/queries/follows";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function PublicPortfolioPage({ params }: PageProps) {
    const { slug } = await params;

    if (!slug) {
        notFound();
    }

    const { data: profile, error } = await getProfileBySlug(slug);
    if (error || !profile) {
        notFound();
    }

    const { data: portfolioItems, error: portfolioError } = await getPortfolioItemsForProfile(profile.id);
    const { data: currentProfile } = await getCurrentProfile();
    const isOwner = currentProfile?.id === profile.id;
    const profileOwnerId = await getProfileOwnerUserId(profile.id);
    const [followCounts, followState] = profileOwnerId
        ? await Promise.all([
            getFollowCounts(profileOwnerId),
            getFollowState(currentProfile?.user_id ?? null, profileOwnerId),
        ])
        : [{ followers: 0, following: 0 }, { isFollowing: false, isMutual: false }];

    if (profile.role === "firm") {
        return <FirmPublicProfile profile={profile} portfolioItems={portfolioItems ?? []} portfolioError={portfolioError} isOwner={isOwner} profileOwnerId={profileOwnerId} followerCount={followCounts.followers} followingCount={followCounts.following} isFollowing={followState.isFollowing} isMutual={followState.isMutual} />;
    }

    return (
        <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
                {isOwner && <div className="mb-5 flex items-center justify-end gap-4 font-mono text-[10px] uppercase tracking-widest"><a href="/profile/edit" className="text-redline hover:text-ink">Edit profile ↗</a><a href="/settings" className="text-graphite hover:text-ink">Settings ↗</a></div>}
                <div className="surface overflow-hidden p-6 sm:p-10">
                    <div className="relative mb-8 flex flex-col gap-5 overflow-hidden rounded-2xl bg-night p-6 text-paper sm:flex-row sm:items-start sm:justify-between sm:p-8">
                        <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full border border-paper/10" />
                        <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full border border-redline/50" />
                        <div className="flex items-center gap-4">
                            <ProfileAvatar profile={profile} size={72} className="relative h-16 w-16 rounded-full border border-paper/30 object-cover" />
                            <div>
                            <p className="eyebrow mb-2 font-mono text-sand">{profile.role} / public profile</p>
                            <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-paper sm:text-4xl">{profile.name}</h1>
                            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-paper/60">
                                {profile.school_or_firm ?? "Independent"}
                            </p>
                            </div>
                        </div>
                        <div className="relative flex flex-col items-end gap-3"><span className="rounded-full border border-paper/30 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-paper/70">{profile.role}</span><span className="font-mono text-[10px] uppercase tracking-widest text-paper/60">{followCounts.following} Following · {followCounts.followers} Followers</span>{!isOwner && profileOwnerId && <FollowButton followingId={profileOwnerId} initialFollowing={followState.isFollowing} initialMutual={followState.isMutual} initialFollowerCount={followCounts.followers} />}</div>
                    </div>

                    <div className="grid gap-8 border-b border-line pb-8 pt-2 lg:grid-cols-[0.7fr_1.3fr]">
                        <div><p className="eyebrow font-mono text-redline">A-05 / ABOUT</p><h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">The practice in a few words.</h2></div>
                        <div>
                        <p className="text-graphite text-sm leading-relaxed">{profile.bio ?? "No bio provided."}</p>
                        {profile.software_proficiency.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {profile.software_proficiency.map((tool) => <span key={tool} className="border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-ink">{tool}</span>)}
                            </div>
                        )}
                        {(profile.cv_url || profile.instagram_url || profile.personal_site_url || profile.linkedin_url) && (
                            <div className="mt-5 flex flex-wrap gap-4 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-widest text-graphite">
                                {profile.cv_url && <a href={profile.cv_url} target="_blank" rel="noreferrer" className="text-ink hover:text-redline">CV / Resume</a>}
                                {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="hover:text-ink">Instagram</a>}
                                {profile.personal_site_url && <a href={profile.personal_site_url} target="_blank" rel="noreferrer" className="hover:text-ink">Personal Site</a>}
                                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-ink">LinkedIn</a>}
                            </div>
                        )}
                        </div>
                    </div>

                    <div className="py-8">
                        <div className="mb-5 flex items-end justify-between"><div><p className="eyebrow font-mono text-redline">A-05.1 / SELECTED WORK</p><h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Portfolio items</h2></div><span className="font-mono text-[10px] uppercase tracking-widest text-graphite">{portfolioItems?.length ?? 0} sheets</span></div>
                        {portfolioError ? (
                            <div className="border border-dashed border-redline p-8 text-center text-redline bg-paper font-mono text-xs uppercase tracking-widest">Unable to load this portfolio right now. Please try again.</div>
                        ) : portfolioItems && portfolioItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {portfolioItems.map((item, idx) => (
                                    <div
                                        key={item.id}
                                    className="surface card-lift flex flex-col justify-between p-5"
                                    >
                                        <div className="font-mono text-[9px] text-graphite tracking-wider mb-2">
                                            [ SHEET {String(idx + 1).padStart(2, "0")} / {item.category.toUpperCase()} ]
                                        </div>
                                        <div className="font-display text-xs uppercase text-ink mb-1">{item.title}</div>
                                        <div className="mt-2 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-wider text-graphite">
                                            <span className="border border-line px-1.5 py-1">{item.project_type}</span>
                                            {item.year && <span className="border border-line px-1.5 py-1">{item.year}</span>}
                                            <span className="border border-line px-1.5 py-1">{item.status}</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-[11px] text-graphite leading-relaxed mt-1">{item.description}</p>
                                        )}
                                        {item.software_used.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.software_used.map((tool) => <span key={tool} className="border border-line px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider text-graphite">{tool}</span>)}</div>}
                                        {item.process_note && <p className="mt-3 border-l border-redline pl-3 text-[11px] italic leading-relaxed text-graphite">{item.process_note}</p>}
                                        {item.role === "team" && item.team_contribution && <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-graphite">Team contribution: {item.team_contribution}</p>}
                                        <PortfolioGallery images={item.images} title={item.title} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-line p-8 text-center text-graphite bg-paper font-mono text-xs uppercase tracking-widest">
                                <p>{isOwner ? "No portfolio items uploaded yet." : "This profile has no portfolio items yet."}</p><p className="mt-3 font-sans text-sm normal-case tracking-normal">{isOwner ? "Add your first project sheet from the profile editor." : "Check back when this profile has been updated."}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
