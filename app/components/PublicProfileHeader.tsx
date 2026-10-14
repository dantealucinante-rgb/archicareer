import type { Profile } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import FollowButton from "./FollowButton";

type PublicProfileHeaderProps = {
    profile: Profile;
    eyebrow: string;
    roleLabel: string;
    fallbackBio: string;
    isOwner: boolean;
    profileOwnerId: string | null;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    isMutual: boolean;
};

export default function PublicProfileHeader({
    profile,
    eyebrow,
    roleLabel,
    fallbackBio,
    isOwner,
    profileOwnerId,
    followerCount,
    followingCount,
    isFollowing,
    isMutual,
}: PublicProfileHeaderProps) {
    return (
        <section className="surface relative overflow-hidden p-6 sm:p-10 lg:p-12">
            <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-redline/30" />
            <div className="absolute right-28 top-20 h-28 w-28 rotate-45 border border-ink/15" />
            <div className="relative grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
                <div>
                    <p className="eyebrow font-mono text-redline">{eyebrow}</p>
                    <h1 className="display-balance mt-5 max-w-4xl break-words font-display text-4xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl">
                        {profile.name}
                    </h1>
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-graphite">
                        {profile.bio ?? fallbackBio}
                    </p>
                </div>

                <div className="flex flex-col items-start gap-4 lg:items-end">
                    <ProfileAvatar
                        profile={profile}
                        size={112}
                        className="h-24 w-24 rounded-2xl border border-line object-cover sm:h-28 sm:w-28"
                        fallbackClassName="bg-paper"
                        priority
                    />
                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <span className="rounded-full border border-line bg-paper px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-graphite">
                            {roleLabel}
                        </span>
                        {profile.location && <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">{profile.location}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">
                            {followingCount} Following · {followerCount} Followers
                        </span>
                        {!isOwner && profileOwnerId && (
                            <FollowButton
                                followingId={profileOwnerId}
                                initialFollowing={isFollowing}
                                initialMutual={isMutual}
                                initialFollowerCount={followerCount}
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
