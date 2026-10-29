"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FeedPost } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import ContentEngagement from "./ContentEngagement";
import { formatCommunityDate } from "@/lib/date-format";

export default function FeedList({ initialPosts, currentUserId }: { initialPosts: FeedPost[]; currentUserId: string | null }) {
    const [posts, setPosts] = useState(initialPosts);
    const [offset, setOffset] = useState(initialPosts.length);
    const [hasMore, setHasMore] = useState(initialPosts.length === 10);
    const [loading, setLoading] = useState(false);
    const [feedMessage, setFeedMessage] = useState("");
    const [feedHasError, setFeedHasError] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const loadMoreInFlight = useRef(false);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(async () => {
        if (loadMoreInFlight.current || !hasMore) return;
        loadMoreInFlight.current = true;
        setLoading(true);
        setFeedMessage("");
        setFeedHasError(false);
        try {
            const response = await fetch(`/api/posts?limit=10&offset=${offset}`);
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to load more posts.");
            const addedCount = payload.posts?.length ?? 0;
            setPosts((current) => [...current, ...(payload.posts ?? [])]);
            setOffset((current) => current + addedCount);
            setHasMore(Boolean(payload.hasMore));
        } catch (error) {
            setFeedHasError(true);
            setFeedMessage(error instanceof Error ? error.message : "Unable to load more posts.");
        } finally {
            loadMoreInFlight.current = false;
            setLoading(false);
        }
    }, [hasMore, offset]);

    function addPost(post: FeedPost) {
        setPosts((current) => [post, ...current.filter((currentPost) => currentPost.id !== post.id)]);
        setOffset((current) => current + 1);
    }

    function openComposer() {
        window.dispatchEvent(new Event("open-post-composer"));
    }

    useEffect(() => {
        const onPostCreated = (event: Event) => addPost((event as CustomEvent<FeedPost>).detail);
        window.addEventListener("post-created", onPostCreated);
        return () => window.removeEventListener("post-created", onPostCreated);
    }, []);

    useEffect(() => {
        const sentinel = loadMoreSentinelRef.current;
        if (!sentinel || !hasMore) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) void loadMore();
        }, { rootMargin: "320px 0px" });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    async function removePost(id: string) {
        setConfirmingId(null);
        setDeletingId(id);
        setFeedMessage("");
        setFeedHasError(false);
        try {
            const response = await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to delete post.");
            setPosts((current) => current.filter((post) => post.id !== id));
            setOffset((current) => Math.max(0, current - 1));
        } catch (error) {
            setFeedHasError(true);
            setFeedMessage(error instanceof Error ? error.message : "Unable to delete post.");
        } finally {
            setDeletingId(null);
        }
    }

    return <>
        <div className="mx-auto w-full max-w-[var(--content-max)] space-y-4">
            {!currentUserId && <div className="ui-panel mx-5 border-dashed p-5 text-center text-sm text-graphite sm:mx-0"><Link href="/login" className="text-redline underline underline-offset-4 hover:text-ink">Sign in</Link> to share your own work and join the conversation.</div>}
            {feedMessage && <p aria-live="polite" className={`mx-5 py-3 font-mono text-[10px] uppercase tracking-widest sm:mx-0 ${feedHasError ? "text-redline" : "text-graphite"}`}>{feedMessage}</p>}
            {posts.length === 0 ? <div className="ui-panel mx-5 border-dashed p-10 text-center sm:mx-0"><p className="ui-kicker">The field is quiet</p><p className="mt-3 text-sm text-graphite">Be the first to share a thought, question, or piece of work.</p>{currentUserId && <button type="button" onClick={openComposer} className="ui-button-primary interactive mt-4">Start a post</button>}</div> : posts.map((post) => <article id={`post-${post.id}`} key={post.id} className="feed-post overflow-hidden bg-warm-white p-5 sm:p-6">
                <div>
                    <div className="flex items-start justify-between gap-3">
                        <Link href={post.author.slug ? `/p/${post.author.slug}` : "/discover"} className="group flex min-w-0 items-center gap-3">
                            <ProfileAvatar profile={post.author} size={48} className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover sm:h-11 sm:w-11" />
                            <div className="min-w-0"><p className="line-clamp-2 font-display text-base font-semibold text-ink transition-colors duration-300 group-hover:text-redline">{post.author.name}</p><p className="ui-meta mt-1 break-words">{post.author.role} {post.author.location && <><span aria-hidden="true">·</span> {post.author.location} </>}<span aria-hidden="true">·</span> {formatCommunityDate(post.created_at)}</p></div>
                        </Link>
                        {post.user_id === currentUserId && <button type="button" disabled={deletingId === post.id} onClick={() => setConfirmingId(post.id)} aria-label="Delete post" className="feedback-control grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg leading-none text-graphite hover:bg-sand hover:text-redline disabled:cursor-wait disabled:opacity-50">{deletingId === post.id ? "…" : "⋯"}</button>}
                    </div>
                    {post.content && <p className={`mt-5 whitespace-pre-wrap leading-relaxed text-ink ${post.image_url ? "text-sm sm:text-base" : "feed-post-copy text-sm sm:text-base"}`}>{post.content}</p>}
                </div>
                {post.image_url && <><p className="mt-6 font-mono text-[9px] uppercase tracking-widest text-redline">Visual field note <span aria-hidden="true">/</span> {new Date(post.created_at).getFullYear()}</p><div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-xl border border-line bg-sand sm:mt-3"><Image src={post.image_url} alt={`Image shared by ${post.author.name}`} fill sizes="(max-width: 672px) 100vw, 672px" className="object-cover" /></div></>}
                <ContentEngagement target={{ post_id: post.id }} initial={{ reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={currentUserId} />
            </article>)}
            {hasMore && <div ref={loadMoreSentinelRef} className="mx-5 my-6 min-h-10 text-center sm:mx-0" aria-live="polite">{loading && <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">Loading more posts…</span>}{feedHasError && <button type="button" onClick={() => void loadMore()} className="feedback-control rounded-full border border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink hover:bg-ink hover:text-paper">Retry loading posts</button>}</div>}
        </div>
        {confirmingId && <div role="dialog" aria-modal="true" aria-labelledby="delete-post-title" className="fixed inset-0 z-50 grid place-items-center bg-night/50 p-5"><div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6"><h2 id="delete-post-title" className="font-display text-2xl font-semibold">Delete this post?</h2><p className="mt-3 text-sm text-graphite">This cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmingId(null)} className="feedback-control rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest">Cancel</button><button type="button" onClick={() => void removePost(confirmingId)} className="feedback-control rounded-full bg-redline px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-paper">Delete post</button></div></div></div>}
    </>;
}
