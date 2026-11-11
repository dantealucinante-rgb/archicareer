"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Community } from "@/types/community";
import CommunityMembershipButton from "./CommunityMembershipButton";
import styles from "./community.module.css";

type Sort = "trending" | "recent" | "joined" | "suggested";

function CommunityCard({ community }: { community: Community }) {
    return <article className={styles.card}>
        <Link href={`/a/${community.slug}`} className={styles.avatar} aria-label={`View ${community.name}`}>
            {community.avatar_url ? <Image src={community.avatar_url} alt="" width={76} height={76} /> : community.name.slice(0, 1)}
        </Link>
        <div className={styles.cardBody}>
            <div className={styles.cardTitleLine}>
                <h2 className={styles.cardTitle}><Link href={`/a/${community.slug}`}>{community.name}</Link></h2>
                <span className={styles.visibility}>{community.visibility === "private" ? "Private" : "Public"}</span>
            </div>
            <p className={styles.cardDescription}>{community.description || "Private community. Request to join to learn more."}</p>
            <div className={styles.cardFooter}>
                <p className={styles.memberCount}>{community.member_count.toLocaleString()} {community.member_count === 1 ? "member" : "members"}</p>
                <CommunityMembershipButton community={community} returnTo="/communities" />
            </div>
        </div>
    </article>;
}

export default function CommunitiesExperience({ initialCommunities, signedIn }: { initialCommunities: Community[]; signedIn: boolean }) {
    const [communities, setCommunities] = useState(initialCommunities);
    const [sort, setSort] = useState<Sort>("trending");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialCommunities.length >= 24);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError("");
            const params = new URLSearchParams({ sort, limit: "24", offset: "0" });
            if (query.trim()) params.set("q", query.trim());
            try {
                const response = await fetch(`/api/communities?${params}`, { signal: controller.signal, cache: "no-store" });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.error ?? "Could not load communities");
                setCommunities(payload.communities as Community[]); setOffset((payload.communities as Community[]).length); setHasMore(Boolean(payload.hasMore));
            } catch (cause) {
                if (!(cause instanceof Error && cause.name === "AbortError")) setError(cause instanceof Error ? cause.message : "Could not load communities");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 120);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [sort, query]);

    async function loadMore() {
        if (loading || !hasMore) return;
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams({ sort, limit: "24", offset: String(offset) });
            if (query.trim()) params.set("q", query.trim());
            const response = await fetch(`/api/communities?${params}`, { cache: "no-store" });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Could not load communities");
            const batch = payload.communities as Community[];
            setCommunities((current) => [...current, ...batch]); setOffset((current) => current + batch.length); setHasMore(Boolean(payload.hasMore));
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load communities"); }
        finally { setLoading(false); }
    }

    const tabs: { value: Sort; label: string }[] = [
        { value: "trending", label: "Trending" },
        { value: "recent", label: "Recently created" },
        ...(signedIn ? [{ value: "joined" as const, label: "Your communities" }] : []),
        { value: "suggested", label: "Suggested" },
    ];

    return <>
        <div className={styles.intro}>
            <div><p className={styles.eyebrow}>The built environment, together</p><h1 className={styles.title}>Find your community.</h1><p className={styles.description}>Join focused spaces for architecture, design and construction professionals to share work, ask questions and learn from one another.</p></div>
            <div className={styles.actions}><Link href="/communities/create" className={`${styles.button} ${styles.buttonPrimary}`}>Create a community</Link></div>
        </div>
        <div className={styles.toolbar}>
            <label className={styles.searchWrap}>
                <span aria-hidden="true">⌕</span>
                <input className={styles.searchInput} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or description" aria-label="Search communities" />
            </label>
            <div className={styles.tabs} role="tablist" aria-label="Community collections">
                {tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={sort === tab.value} className={`${styles.tab} ${sort === tab.value ? styles.tabActive : ""}`} onClick={() => setSort(tab.value)}>{tab.label}</button>)}
            </div>
        </div>
        {error && <p role="alert" className={styles.notice}>{error}</p>}
        <section className={styles.grid} aria-label="Communities" aria-busy={loading}>
            {communities.map((community) => <CommunityCard key={community.id} community={community} />)}
            {!loading && communities.length === 0 && <div className={styles.empty}><h2>{sort === "joined" ? "You haven’t joined a community yet." : "No communities found."}</h2><p>{sort === "joined" ? "Browse the directory and join a public community or request access to a private one." : "Try another search, or create the first community for your corner of the built environment."}</p><div className={styles.actions}>{sort === "joined" && <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setSort("trending")}>Explore communities</button>}<Link href="/communities/create" className={`${styles.button} ${styles.buttonPrimary}`}>Create a community</Link></div></div>}
            {loading && communities.length === 0 && <div className={styles.empty} role="status"><p>Loading communities…</p></div>}
        </section>
        {hasMore && communities.length > 0 && <div className={styles.pagination}><button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => void loadMore()} disabled={loading}>{loading ? "Loading…" : "Load more communities"}</button></div>}
    </>;
}
