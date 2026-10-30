"use client";

import { useRef, useState } from "react";
import { Check } from "./UiIcon";

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
    const [message, setMessage] = useState("");
    const requestInFlight = useRef(false);

    async function toggleFollow() {
        if (requestInFlight.current) return;
        const previousFollowing = following;
        const previousMutual = mutual;
        const previousFollowerCount = followerCount;
        const nextFollowing = !following;

        requestInFlight.current = true;
        setMessage("");
        // Render the intended result before starting the persistence request.
        setFollowing(nextFollowing);
        setMutual(nextFollowing ? mutual : false);
        setFollowerCount((count) => Math.max(0, count + (nextFollowing ? 1 : -1)));
        setPending(true);
        let timeout: number | undefined;
        try {
            const controller = new AbortController();
            timeout = window.setTimeout(() => controller.abort(), 15_000);
            const response = await fetch("/api/follows", {
                method: previousFollowing ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followingId }),
                signal: controller.signal,
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Follow request failed");
            setFollowing(Boolean(payload.following));
            setMutual(Boolean(payload.mutual));
            setFollowerCount(Math.max(0, Number(payload.followerCount) || 0));
        } catch {
            setFollowing(previousFollowing);
            setMutual(previousMutual);
            setFollowerCount(previousFollowerCount);
            setMessage("Couldn’t update follow. Try again.");
        } finally {
            if (timeout !== undefined) window.clearTimeout(timeout);
            requestInFlight.current = false;
            setPending(false);
        }
    }

    const label = mutual ? "Friends" : following ? "Following" : "Follow";
    return <div className="flex flex-col items-end gap-1">
        <button type="button" disabled={pending} onClick={toggleFollow} aria-busy={pending} aria-pressed={following} className={`feedback-control follow-control inline-flex min-h-10 items-center rounded-full border ${compact ? "px-3" : "px-4"} py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-60 ${mutual ? "border-redline bg-paper text-redline hover:bg-redline hover:text-paper" : following ? "border-line bg-warm-white text-ink hover:border-ink" : "border-ink bg-paper text-ink hover:bg-ink hover:text-paper"}`}>
            {following && !mutual && <Check className="mr-1.5 h-3 w-3" />}
            {label}
            <span className="sr-only">. {followerCount} followers</span>
        </button>
        <span aria-live="polite" className="sr-only">{pending ? "Updating follow" : following ? `Following. ${followerCount} followers.` : `Not following. ${followerCount} followers.`}</span>
        {message && <p role="alert" className="max-w-40 text-right font-mono text-[9px] uppercase tracking-wider text-redline">{message} <button type="button" onClick={toggleFollow} className="underline underline-offset-2 hover:text-ink">Retry</button></p>}
    </div>;
}
