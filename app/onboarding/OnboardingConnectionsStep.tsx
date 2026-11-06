"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Recommendation } from "./onboarding-types";
import styles from "./onboarding.module.css";

function displayType(value: string) {
    return value === "professional" ? "Professional" : value === "firm" ? "Firm" : value === "business" ? "Business" : "Student";
}

export default function OnboardingConnectionsStep() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [working, setWorking] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setMessage("");
        try {
            const response = await fetch("/api/onboarding/recommendations", { cache: "no-store" });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "People could not be loaded.");
            setRecommendations(Array.isArray(payload.recommendations) ? payload.recommendations : []);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "People could not be loaded.");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        let active = true;
        async function firstLoad() {
            try {
                const response = await fetch("/api/onboarding/recommendations", { cache: "no-store" });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.error ?? "People could not be loaded.");
                if (active) setRecommendations(Array.isArray(payload.recommendations) ? payload.recommendations : []);
            } catch (error) {
                if (active) setMessage(error instanceof Error ? error.message : "People could not be loaded.");
            } finally { if (active) setLoading(false); }
        }
        void firstLoad();
        return () => { active = false; };
    }, []);

    async function toggleFollow(person: Recommendation) {
        if (working) return;
        setWorking(person.user_id);
        try {
            const response = await fetch("/api/follows", {
                method: person.following ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followingId: person.user_id }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "That follow could not be saved. Try again.");
            setRecommendations((current) => current.map((item) => item.user_id === person.user_id ? { ...item, following: !person.following } : item));
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "That follow could not be saved. Try again.");
        } finally { setWorking(null); }
    }

    return <div className={styles.connectionsContent}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>05 / FIND YOUR PEOPLE</p><h2>Good things happen when people connect.</h2><p>Discover professionals, studios and businesses working across the industry. Follow anyone you want to keep up with.</p></div>
        {loading ? <div className={styles.loadingPeople} role="status"><span className={styles.loadingLine} /><span>Finding people in the community…</span></div> : message && recommendations.length === 0 ? <div className={styles.emptyPeople}><p>{message}</p><button type="button" onClick={() => void load()} className={styles.inlineAction}>Try again</button></div> : recommendations.length === 0 ? <div className={styles.emptyPeople}><p className={styles.emptyEyebrow}>A COMMUNITY TAKING SHAPE</p><h3>More people will appear as the community grows.</h3><p>There aren’t enough profiles to recommend yet. You can continue and discover people later.</p></div> : <div className={styles.peopleList}>
            {recommendations.map((person, index) => <article className={styles.personRow} key={person.id}>
                <span className={styles.personIndex}>{String(index + 1).padStart(2, "0")}</span>
                <div className={styles.personAvatar}>{person.avatar_url ? <Image src={person.avatar_url} alt="" fill sizes="56px" /> : <span>{person.name.charAt(0).toUpperCase()}</span>}</div>
                <div className={styles.personInfo}><h3>{person.name}</h3><p>{[displayType(person.account_type), person.school_or_firm, person.location].filter(Boolean).join(" · ")}</p>{person.sharedInterests.length > 0 && <span className={styles.sharedInterest}>In common: {person.sharedInterests.slice(0, 2).join(", ")}</span>}</div>
                <button type="button" onClick={() => void toggleFollow(person)} disabled={working !== null} aria-pressed={person.following} className={`${styles.followButton} ${person.following ? styles.followingButton : ""}`}>{working === person.user_id ? "Saving…" : person.following ? "Following" : "Follow"}</button>
            </article>)}
        </div>}
        {message && recommendations.length > 0 && <p role="status" className={styles.inlineMessage}>{message}</p>}
    </div>;
}
