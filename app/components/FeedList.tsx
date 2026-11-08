"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FeedPost } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import ContentEngagement from "./ContentEngagement";
import { formatCommunityDate } from "@/lib/date-format";
import styles from "@/app/feed/feed.module.css";

type Props = {
    initialPosts: FeedPost[];
    initialError?: string;
    currentUserId: string | null;
    currentProfile: { id: string; slug: string; name: string; avatar_url: string | null } | null;
};

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
            const response = await fetch(`/api/posts?limit=10&offset=${offset}`, { signal: controller.signal });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error("Couldn’t load more posts.");
            const batch = (payload.posts ?? []) as FeedPost[];
            setPosts((current) => {
                const seen = new Set(current.map((post) => post.id));
                const additions = batch.filter((post) => {
                    if (seen.has(post.id)) return false;
                    seen.add(post.id);
                    return true;
                });
                return [...current, ...additions];
            });
            setOffset((current) => current + batch.length);
            setHasMore(Boolean(payload.hasMore));
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
    }, [hasMore, offset]);

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

    return <div className={styles.postList}>
        {currentUserId && <div className={styles.composePrompt}>
            {currentProfile && <ProfileAvatar profile={currentProfile} size={42} className={styles.composeAvatar} />}
            <button type="button" onClick={openComposer} className={styles.composeEntry}>What’s happening in your world?</button>
            <button type="button" onClick={openComposer} className={styles.composeButton}>Post</button>
        </div>}
        {!currentUserId && <p className={styles.feedNotice}><Link href="/login">Sign in</Link> to share a thought and join the conversation.</p>}
        {feedMessage && feedHasError && !pageError && posts.length > 0 && <p role="alert" className={styles.feedNotice}>{feedMessage}</p>}
        {posts.length === 0 && loading ? <div role="status" className={styles.emptyState}><p>Loading posts…</p></div>
            : posts.length === 0 && feedHasError ? <div role="alert" className={styles.feedError}><span>{feedMessage || "Couldn’t load posts. Try again."}</span><button type="button" onClick={() => void loadMore()} disabled={loading} className={styles.retryButton}>{loading ? "Loading…" : "Retry"}</button></div>
            : posts.length === 0 ? <div className={styles.emptyState}><h2>The feed is quiet right now.</h2><p>When people share ideas, questions, and work, they’ll appear here.</p>{currentUserId && <button type="button" onClick={openComposer} className={styles.emptyAction}>Start a post</button>}</div>
                : posts.map((post) => <FeedPostItem key={post.id} post={post} currentUserId={currentUserId} deleting={deletingId === post.id} onDelete={() => setConfirmingId(post.id)} onOpenComposer={openComposer} />)}
        {hasMore && posts.length > 0 && <div ref={loadMoreSentinelRef} className={styles.loadMore} aria-live="polite">
            {loading ? "Loading more posts…" : pageError ? <><span>Couldn’t load more posts.</span><button type="button" onClick={() => void loadMore()} className={styles.retryButton}>Retry</button></> : ""}
        </div>}
        {confirmingId && <div role="dialog" aria-modal="true" aria-labelledby="delete-post-title" className={styles.deleteDialog}><div className={styles.deleteDialogContent}><h2 id="delete-post-title">Delete this post?</h2><p>This cannot be undone.</p><div className={styles.dialogActions}><button type="button" onClick={() => setConfirmingId(null)} className={styles.dialogButton}>Cancel</button><button type="button" onClick={() => void removePost(confirmingId)} className={`${styles.dialogButton} ${styles.dialogDelete}`} disabled={Boolean(deletingId)}>Delete post</button></div></div></div>}
    </div>;
}

function FeedPostItem({ post, currentUserId, deleting, onDelete, onOpenComposer }: { post: FeedPost; currentUserId: string | null; deleting: boolean; onDelete: () => void; onOpenComposer: () => void }) {
    const authorHref = post.author.slug ? `/p/${post.author.slug}` : null;
    return <article id={`post-${post.id}`} aria-label={`Post by ${post.author.name}`} className={styles.post}>
        <div className={styles.postRow}>
            {authorHref ? <Link href={authorHref} aria-label={`View ${post.author.name}'s profile`} className={styles.authorAvatarLink}><ProfileAvatar profile={post.author} size={44} className={styles.authorAvatar} /></Link>
                : <ProfileAvatar profile={post.author} size={44} className={styles.authorAvatar} />}
            <div className={styles.postBody}>
                <header className={styles.authorRow}>
                    {authorHref ? <Link href={authorHref} className={styles.authorLink}><AuthorDetails post={post} /></Link> : <div className={styles.authorInfo}><AuthorDetails post={post} /></div>}
                    {post.user_id === currentUserId && <button type="button" disabled={deleting} onClick={onDelete} aria-label="Delete post" title="Delete post" className={styles.postOptions}>{deleting ? "…" : "⋯"}</button>}
                </header>
                {post.content && <p className={styles.postContent}>{linkifyPost(post.content)}</p>}
                {post.image_url && <div className={styles.postMedia}><Image src={post.image_url} alt={`Image shared by ${post.author.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 680px, 640px" className={styles.postMediaImage} /></div>}
                {post.client_status ? <div className={styles.pendingStatus}>{post.client_status === "pending" ? "Publishing post…" : <>Post wasn’t published. <button type="button" onClick={onOpenComposer}>Retry in composer</button></>}</div>
                    : <div className={styles.engagement}><ContentEngagement target={{ post_id: post.id }} initial={{ reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={currentUserId} compactActions /></div>}
            </div>
        </div>
    </article>;
}

function AuthorDetails({ post }: { post: FeedPost }) {
    const roleLabel = post.author.role === "student" ? "Architecture student" : post.author.role === "architect" ? "Architect" : post.author.role === "firm" ? "Architecture practice" : "Built environment professional";
    return <><span className={styles.authorMeta}><strong className={styles.authorName}>{post.author.name}</strong>{post.author.slug && <span className={styles.username}>@{post.author.slug}</span>}<span className={styles.timestamp} aria-hidden="true">·</span><time className={styles.timestamp} dateTime={post.created_at}>{formatCommunityDate(post.created_at)}</time></span><span className={styles.authorRole}>{roleLabel}{post.author.location ? ` · ${post.author.location}` : ""}</span></>;
}

function linkifyPost(content: string) {
    const matcher = /https?:\/\/[^\s<>]+/gi;
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(content))) {
        const raw = match[0];
        const url = raw.replace(/[),.!?;:]+$/, "");
        const trailing = raw.slice(url.length);
        if (!url) continue;
        if (match.index > cursor) parts.push(content.slice(cursor, match.index));
        parts.push(<a key={`${match.index}-${url}`} href={url} target="_blank" rel="noreferrer">{url}</a>);
        if (trailing) parts.push(trailing);
        cursor = match.index + raw.length;
    }
    if (cursor < content.length) parts.push(content.slice(cursor));
    return parts.length ? parts : content;
}
