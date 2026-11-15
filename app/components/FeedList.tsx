"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FeedPost } from "@/types";
import type { FeedFilter } from "@/lib/queries/posts";
import ProfileAvatar from "./ProfileAvatar";
import FeedPostItem from "./FeedPostItem";
import styles from "@/app/feed/feed.module.css";

type Props = {
    initialPosts: FeedPost[];
    initialError?: string;
    currentUserId: string | null;
    currentProfile: { id: string; slug: string; name: string; avatar_url: string | null } | null;
};

const FILTERS: { value: FeedFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "projects", label: "Projects" },
    { value: "discussions", label: "Discussions" },
    { value: "questions", label: "Questions" },
];

async function fetchBatch(limit: number, offset: number, filter: FeedFilter): Promise<{ posts: FeedPost[]; hasMore: boolean }> {
    const response = await fetch(`/api/posts?limit=${limit}&offset=${offset}&filter=${filter}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error("Couldn’t load posts.");
    return { posts: (payload.posts ?? []) as FeedPost[], hasMore: Boolean(payload.hasMore) };
}

export default function FeedList({ initialPosts, initialError = "", currentUserId, currentProfile }: Props) {
    const [posts, setPosts] = useState(initialPosts);
    const [offset, setOffset] = useState(initialPosts.length);
    const [hasMore, setHasMore] = useState(Boolean(initialError) || initialPosts.length === 10);
    const [loading, setLoading] = useState(false);
    const [feedMessage, setFeedMessage] = useState(initialError);
    const [feedHasError, setFeedHasError] = useState(Boolean(initialError));
    const [pageError, setPageError] = useState(Boolean(initialError));
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<FeedFilter>("all");
    const [filterLoading, setFilterLoading] = useState(false);
    const loadMoreInFlight = useRef(false);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<AbortController | null>(null);

    const loadMore = useCallback(async () => {
        if (loadMoreInFlight.current || !hasMore) return;
        loadMoreInFlight.current = true;
        setLoading(true);
        setFeedMessage("");
        setFeedHasError(false);
        setPageError(false);
        const controller = new AbortController();
        requestRef.current = controller;
        try {
            const batch = await fetchBatch(10, offset, filter);
            if (controller.signal.aborted) return;
            setPosts((current) => {
                const seen = new Set(current.map((post) => post.id));
                const additions = batch.posts.filter((post) => {
                    if (seen.has(post.id)) return false;
                    seen.add(post.id);
                    return true;
                });
                return [...current, ...additions];
            });
            setOffset((current) => current + batch.posts.length);
            setHasMore(batch.hasMore);
        } catch (error) {
            if (!(error instanceof Error && error.name === "AbortError")) {
                setPageError(true);
                setFeedHasError(true);
                setFeedMessage("Couldn’t load more posts. Try again.");
            }
        } finally {
            if (requestRef.current === controller) requestRef.current = null;
            loadMoreInFlight.current = false;
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [hasMore, offset, filter]);

    function addPost(post: FeedPost, replaceId?: string) {
        setPosts((current) => {
            const next = current.filter((currentPost) => currentPost.id !== post.id && currentPost.id !== replaceId);
            return [post, ...next];
        });
        if (replaceId && !post.client_status) setOffset((current) => current + 1);
    }

    function openComposer() {
        window.dispatchEvent(new Event("open-post-composer"));
    }

    async function changeFilter(next: FeedFilter) {
        if (next === filter || filterLoading) return;
        requestRef.current?.abort();
        loadMoreInFlight.current = false;
        setFilter(next);
        setFilterLoading(true);
        setPosts([]);
        setOffset(0);
        setHasMore(true);
        setFeedMessage("");
        setFeedHasError(false);
        setPageError(false);
        setLoading(true);
        try {
            const batch = await fetchBatch(10, 0, next);
            setPosts(batch.posts);
            setOffset(batch.posts.length);
            setHasMore(batch.hasMore);
        } catch {
            setPageError(true);
            setFeedHasError(true);
            setFeedMessage("Couldn’t load posts for this filter. Try again.");
            setHasMore(false);
        } finally {
            setFilterLoading(false);
            setLoading(false);
        }
    }

    useEffect(() => {
        const onPostCreated = (event: Event) => {
            const detail = (event as CustomEvent<{ post: FeedPost; replaceId?: string }>).detail;
            addPost(detail.post, detail.replaceId);
        };
        window.addEventListener("post-created", onPostCreated);
        return () => window.removeEventListener("post-created", onPostCreated);
    }, []);

    useEffect(() => () => requestRef.current?.abort(), []);

    useEffect(() => {
        const sentinel = loadMoreSentinelRef.current;
        if (!sentinel || !hasMore || pageError) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) void loadMore();
        }, { rootMargin: "320px 0px" });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore, pageError]);

    async function removePost(id: string) {
        setConfirmingId(null);
        setDeletingId(id);
        setFeedMessage("");
        setFeedHasError(false);
        const previousIndex = posts.findIndex((post) => post.id === id);
        const removed = posts[previousIndex];
        if (!removed) return;
        setPosts((current) => current.filter((post) => post.id !== id));
        setOffset((current) => Math.max(0, current - 1));
        try {
            const response = await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
            if (!response.ok) throw new Error("Unable to delete post.");
        } catch {
            setPosts((current) => current.some((post) => post.id === id) ? current : [...current.slice(0, previousIndex), removed, ...current.slice(previousIndex)]);
            setOffset((current) => current + 1);
            setFeedHasError(true);
            setFeedMessage("Couldn’t delete post. It has been restored.");
        } finally {
            setDeletingId(null);
        }
    }

    return <>
        <header className={styles.feedHeading}><h1>Feed</h1></header>
        <div className={styles.feedFilterBar} role="group" aria-label="Filter the feed by content type">
            {FILTERS.map((option) => <button key={option.value} type="button" aria-pressed={filter === option.value} disabled={filterLoading && filter !== option.value} onClick={() => void changeFilter(option.value)} className={styles.filterPill}>{option.label}</button>)}
            <span className={styles.feedFilterNote}>{filterLoading ? "Loading…" : `${posts.length} shown`}</span>
        </div>
        <div className={styles.postList}>
            {currentUserId && <div className={styles.composePrompt}>
                {currentProfile && <ProfileAvatar profile={currentProfile} size={42} className={styles.composeAvatar} />}
                <button type="button" onClick={openComposer} className={styles.composeEntry}>What’s happening in your world?</button>
                <button type="button" onClick={openComposer} className={styles.composeButton}>Post</button>
            </div>}
            {!currentUserId && <p className={styles.feedNotice}><Link href="/login">Sign in</Link> to share a thought and join the conversation.</p>}
            {feedMessage && feedHasError && !pageError && posts.length > 0 && <p role="alert" className={styles.feedNotice}>{feedMessage}</p>}
            {posts.length === 0 && loading ? <div role="status" className={styles.emptyState}><p>Loading posts…</p></div>
                : posts.length === 0 && feedHasError ? <div role="alert" className={styles.feedError}><span>{feedMessage || "Couldn’t load posts. Try again."}</span><button type="button" onClick={() => void changeFilter(filter)} disabled={loading} className={styles.retryButton}>{loading ? "Loading…" : "Retry"}</button></div>
                : posts.length === 0 ? <div className={styles.emptyState}><h2>{filter === "all" ? "The feed is quiet right now." : `No ${filter} yet.`}</h2><p>{filter === "all" ? "When people share ideas, questions, and work, they’ll appear here." : "Nothing in this corner yet — be the first to share one."}</p>{currentUserId && <button type="button" onClick={openComposer} className={styles.emptyAction}>Start a post</button>}</div>
                    : posts.map((post) => <FeedPostItem key={post.id} post={post} currentUserId={currentUserId} deleting={deletingId === post.id} onDelete={() => setConfirmingId(post.id)} onOpenComposer={openComposer} />)}
            {hasMore && posts.length > 0 && <div ref={loadMoreSentinelRef} className={styles.loadMore} aria-live="polite">
                {loading ? "Loading more posts…" : pageError ? <><span>Couldn’t load more posts.</span><button type="button" onClick={() => void loadMore()} className={styles.retryButton}>Retry</button></> : ""}
            </div>}
            {confirmingId && <div role="dialog" aria-modal="true" aria-labelledby="delete-post-title" className={styles.deleteDialog}><div className={styles.deleteDialogContent}><h2 id="delete-post-title">Delete this post?</h2><p>This cannot be undone.</p><div className={styles.dialogActions}><button type="button" onClick={() => setConfirmingId(null)} className={styles.dialogButton}>Cancel</button><button type="button" onClick={() => void removePost(confirmingId)} className={`${styles.dialogButton} ${styles.dialogDelete}`} disabled={Boolean(deletingId)}>Delete post</button></div></div></div>}
        </div>
    </>;
}
