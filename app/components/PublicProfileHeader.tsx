import type { Profile } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import FollowButton from "./FollowButton";
import Link from "next/link";
import { Settings } from "./UiIcon";

type PublicProfileHeaderProps = {
    profile: Profile;
    roleLabel: string;
    fallbackBio: string;
    isOwner: boolean;
    profileOwnerId: string | null;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    isMutual: boolean;
    projectCount: number;
};

export default function PublicProfileHeader({
    profile,
    roleLabel,
    fallbackBio,
    isOwner,
    profileOwnerId,
    followerCount,
    followingCount,
    isFollowing,
    isMutual,
    projectCount,
}: PublicProfileHeaderProps) {
    return <section className="border-b border-line pb-5">
        <div className="mb-5 flex items-center justify-end border-b border-line pb-3">{isOwner && <Link href="/settings" aria-label="Settings" title="Settings" className="interactive grid h-11 w-11 place-items-center rounded-full text-graphite hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline"><Settings /></Link>}</div>
        <div className="flex items-start gap-4 sm:gap-6"><ProfileAvatar profile={profile} size={96} className="h-20 w-20 shrink-0 rounded-full border border-line object-cover sm:h-24 sm:w-24" fallbackClassName="bg-paper" priority /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h1 className="break-words text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">{profile.name}</h1><p className="mt-1 text-sm text-graphite">{roleLabel}{profile.location ? ` · ${profile.location}` : ""}</p></div>{isOwner ? <Link href="/profile/edit" className="interactive inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-xs font-medium text-ink hover:border-ink hover:bg-warm-white">Edit profile</Link> : profileOwnerId ? <FollowButton followingId={profileOwnerId} initialFollowing={isFollowing} initialMutual={isMutual} initialFollowerCount={followerCount} compact /> : null}</div><div className="mt-3 flex gap-5 text-sm"><a href="#projects" className="hover:text-redline"><strong className="font-semibold">{projectCount}</strong> <span className="text-graphite">projects</span></a><span><strong className="font-semibold">{followerCount}</strong> <span className="text-graphite">followers</span></span><span><strong className="font-semibold">{followingCount}</strong> <span className="text-graphite">following</span></span></div></div></div><p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-graphite">{profile.bio ?? fallbackBio}</p>
    </section>;
}
