"use client";

import { useState } from "react";

type Props = {
    followingId: string;
    initialFollowing: boolean;
    initialMutual: boolean;
    initialFollowerCount: number;
    compact?: boolean;
};

export default function FollowButton({ followingId, initialFollowing, initialMutual, initialFollowerCount, compact = false }: Props) {
    const [following, setFollowing] = useState(initialFollowing);
    const [mutual, setMutual] = useState(initialMutual);
    const [followerCount, setFollowerCount] = useState(initialFollowerCount);
    const [pending, setPending] = useState(false);

    async function toggleFollow() {
        if (pending) return;
        const previousFollowing = following;
        const previousMutual = mutual;
        const previousFollowerCount = followerCount;
        const nextFollowing = !following;

        // Update the visible state immediately; the network request follows.
        setFollowing(nextFollowing);
        setMutual(nextFollowing ? mutual : false);
        setFollowerCount((count) => count + (nextFollowing ? 1 : -1));
        setPending(true);
        try {
            const response = await fetch("/api/follows", {
                method: previousFollowing ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followingId }),
            });
            if (!response.ok) throw new Error("Follow request failed");
        } catch {
            setFollowing(previousFollowing);
            setMutual(previousMutual);
            setFollowerCount(previousFollowerCount);
        }
        setPending(false);
    }

    const label = mutual ? "Friends" : following ? "Following" : "Follow";
    return <button type="button" disabled={pending} onClick={toggleFollow} className={`inline-flex items-center rounded-full border ${compact ? "px-3" : "px-4"} py-2 font-mono text-[10px] uppercase tracking-widest transition-colors disabled:cursor-wait disabled:opacity-60 ${mutual ? "border-redline bg-paper text-redline hover:bg-redline hover:text-paper" : following ? "border-line bg-warm-white text-ink hover:border-ink" : "border-ink bg-paper text-ink hover:bg-ink hover:text-paper"}`}>
        {following && !mutual && <span aria-hidden="true" className="mr-1.5">✓</span>}
        {label}
        <span className="sr-only">. {followerCount} followers</span>
    </button>;
}
