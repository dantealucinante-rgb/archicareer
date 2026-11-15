"use client";

import { useRef, useState } from "react";
import { Check } from "./UiIcon";
import styles from "./editorial/editorial.module.css";

type Props = {
    followingId: string;
    initialFollowing: boolean;
    initialMutual: boolean;
    initialFollowerCount: number;
    compact?: boolean;
    /** Removes the offset shadow for quieter, editorial surfaces such as profiles. */
    flat?: boolean;
};

export default function FollowButton({ followingId, initialFollowing, initialMutual, initialFollowerCount, compact = false, flat = false }: Props) {
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
    const buttonClasses = [
        styles.pill,
        styles.pillSmall,
        following ? styles.pill : styles.pillOrange,
        compact ? styles.pillSmall : "",
        flat ? styles.pillFlat : "",
    ].filter(Boolean).join(" ");

    return <div style={{ display: "grid", gap: 6, justifyItems: "start" }}>
        <button type="button" disabled={pending} onClick={toggleFollow} aria-busy={pending} aria-pressed={following} className={`feedback-control follow-control ${buttonClasses}`}>
            {following && !mutual && <Check className="mr-1.5 h-3 w-3" />}
            {label}
            <span className="sr-only">. {followerCount} followers</span>
        </button>
        <span aria-live="polite" className="sr-only">{pending ? "Updating follow" : following ? `Following. ${followerCount} followers.` : `Not following. ${followerCount} followers.`}</span>
        {message && <p role="alert" className={styles.fieldError}>{message} <button type="button" onClick={toggleFollow} className={styles.link}>Retry</button></p>}
    </div>;
}
