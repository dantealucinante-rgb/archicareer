"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FeedPost, Profile } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import ContentEngagement from "./ContentEngagement";
import PostComposer from "./PostComposer";
import { formatCommunityDate } from "@/lib/date-format";

export default function FeedList({ initialPosts, currentUserId, currentProfile }: { initialPosts: FeedPost[]; currentUserId: string | null; currentProfile: Pick<Profile, "name" | "avatar_url"> | null }) {
    const [posts, setPosts] = useState(initialPosts);
    const [offset, setOffset] = useState(initialPosts.length);
    const [hasMore, setHasMore] = useState(initialPosts.length === 10);
    const [loading, setLoading] = useState(false);
    const [feedMessage, setFeedMessage] = useState("");
    const [feedHasError, setFeedHasError] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    async function loadMore() {
        if (loading || !hasMore) return;
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
            setFeedMessage(addedCount > 0 ? `${addedCount} more post${addedCount === 1 ? "" : "s"} loaded.` : "There are no more posts.");
        } catch (error) {
            setFeedHasError(true);
            setFeedMessage(error instanceof Error ? error.message : "Unable to load more posts.");
        } finally {
            setLoading(false);
        }
    }

    function addPost(post: FeedPost) {
        setPosts((current) => [post, ...current.filter((currentPost) => currentPost.id !== post.id)]);
        setOffset((current) => current + 1);
    }

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
        <div className="mx-auto w-full max-w-2xl sm:space-y-5">
            {!currentUserId && <div className="surface mx-5 border-dashed p-5 text-center text-sm text-graphite sm:mx-0"><Link href="/login" className="text-redline underline underline-offset-4 hover:text-ink">Sign in</Link> to share your own work and join the conversation.</div>}
            {currentUserId && <PostComposer onCreated={addPost} author={currentProfile} />}
            {feedMessage && <p aria-live="polite" className={`mx-5 py-3 font-mono text-[10px] uppercase tracking-widest sm:mx-0 ${feedHasError ? "text-redline" : "text-graphite"}`}>{feedMessage}</p>}
            {posts.length === 0 ? <div className="surface mx-5 border-dashed p-10 text-center sm:mx-0"><p className="eyebrow font-mono text-redline">The field is quiet</p><p className="mt-3 text-sm text-graphite">Be the first to share a thought, question, or piece of work.</p>{currentUserId && <a href="#post-composer" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-redline underline underline-offset-4 hover:text-ink">Start a post</a>}</div> : posts.map((post) => <article key={post.id} className="feed-post overflow-hidden border-b border-line bg-warm-white py-5 sm:p-6">
                <div className="px-5 sm:px-0">
                    <div className="flex items-start justify-between gap-3">
                        <Link href={post.author.slug ? `/p/${post.author.slug}` : "/discover"} className="group flex min-w-0 items-center gap-3">
                            <ProfileAvatar profile={post.author} size={48} className="h-12 w-12 shrink-0 rounded-full border border-line object-cover sm:h-10 sm:w-10" />
                            <div className="min-w-0"><p className="truncate font-display text-base font-semibold text-ink group-hover:text-redline">{post.author.name}</p><p className="truncate font-mono text-[9px] uppercase tracking-widest text-graphite">{post.author.role} {post.author.location && <><span aria-hidden="true">/</span> {post.author.location} </>}<span aria-hidden="true">/</span> {formatCommunityDate(post.created_at)}</p></div>
                        </Link>
                        {post.user_id === currentUserId && <button type="button" disabled={deletingId === post.id} onClick={() => setConfirmingId(post.id)} aria-label="Delete post" className="feedback-control grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg leading-none text-graphite hover:bg-sand hover:text-redline disabled:cursor-wait disabled:opacity-50">{deletingId === post.id ? "…" : "⋯"}</button>}
                    </div>
                    {post.content && <p className={`mt-5 whitespace-pre-wrap leading-relaxed text-ink ${post.image_url ? "text-sm" : "border-l-2 border-redline pl-4 font-display text-lg leading-relaxed sm:border-l-0 sm:pl-0 sm:font-sans sm:text-sm"}`}>{post.content}</p>}
                </div>
                {post.image_url && <><p className="mx-5 mt-5 font-mono text-[9px] uppercase tracking-widest text-redline sm:mx-0">Visual field note <span aria-hidden="true">/</span> {new Date(post.created_at).getFullYear()}</p><div className="relative mt-2 aspect-[4/3] overflow-hidden sm:mt-5 sm:rounded-2xl sm:border sm:border-line"><Image src={post.image_url} alt="Post image" fill sizes="(max-width: 672px) 100vw, 672px" className="object-cover" /></div></>}
                <div className="px-5 sm:px-0"><ContentEngagement target={{ post_id: post.id }} initial={{ reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={currentUserId} /></div>
            </article>)}
            {hasMore && <button type="button" onClick={() => void loadMore()} disabled={loading} className="feedback-control mx-auto my-5 block rounded-full border border-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink hover:bg-ink hover:text-paper disabled:opacity-50">{loading ? "Loading…" : "Load more"}</button>}
        </div>
        {confirmingId && <div role="dialog" aria-modal="true" aria-labelledby="delete-post-title" className="fixed inset-0 z-50 grid place-items-center bg-night/50 p-5"><div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6"><h2 id="delete-post-title" className="font-display text-2xl font-semibold">Delete this post?</h2><p className="mt-3 text-sm text-graphite">This cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmingId(null)} className="feedback-control rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest">Cancel</button><button type="button" onClick={() => void removePost(confirmingId)} className="feedback-control rounded-full bg-redline px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-paper">Delete post</button></div></div></div>}
    </>;
}
