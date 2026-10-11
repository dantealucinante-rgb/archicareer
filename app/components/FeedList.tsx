"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeedPost } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import ContentEngagement from "./ContentEngagement";
import PostComposer from "./PostComposer";
import { formatCommunityDate } from "@/lib/date-format";
import Link from "next/link";

export default function FeedList({ initialPosts, currentUserId }: { initialPosts: FeedPost[]; currentUserId: string | null }) {
    const [posts, setPosts] = useState(initialPosts);
    const [offset, setOffset] = useState(initialPosts.length);
    const [hasMore, setHasMore] = useState(initialPosts.length === 10);
    const [loading, setLoading] = useState(false);
    const [feedMessage, setFeedMessage] = useState("");
    const [feedHasError, setFeedHasError] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
        if (!window.confirm("Delete this post? This cannot be undone.")) return;
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

    return <div className="mx-auto w-full max-w-2xl space-y-5">{!currentUserId && <div className="surface border-dashed p-5 text-center text-sm text-graphite"><Link href="/login" className="text-redline underline underline-offset-4 hover:text-ink">Sign in</Link> to share your own work and join the conversation.</div>}{currentUserId && <PostComposer onCreated={addPost} />}{feedMessage && <p aria-live="polite" className={`font-mono text-[10px] uppercase tracking-widest ${feedHasError ? "text-redline" : "text-graphite"}`}>{feedMessage}</p>}{posts.length === 0 ? <div className="surface border-dashed p-10 text-center"><p className="eyebrow font-mono text-redline">THE FIELD IS QUIET</p><p className="mt-3 text-sm text-graphite">Be the first to share a thought, question, or piece of work.</p>{currentUserId && <a href="#post-composer" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-redline underline underline-offset-4 hover:text-ink">Start a post</a>}</div> : posts.map((post) => <article key={post.id} className="surface overflow-hidden p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><Link href={post.author.slug ? `/p/${post.author.slug}` : "/discover"} className="group flex items-center gap-3"><ProfileAvatar profile={post.author} size={42} className="h-10 w-10 rounded-full border border-line object-cover" /><div><p className="font-display text-base font-semibold text-ink group-hover:text-redline">{post.author.name}</p><p className="font-mono text-[9px] uppercase tracking-widest text-graphite">{post.author.role} · {formatCommunityDate(post.created_at)}</p></div></Link>{post.user_id === currentUserId && <button type="button" disabled={deletingId === post.id} onClick={() => void removePost(post.id)} className="font-mono text-[9px] uppercase tracking-widest text-redline hover:text-ink disabled:cursor-wait disabled:opacity-50">{deletingId === post.id ? "Deleting..." : "Delete"}</button>}</div>{post.content && <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.content}</p>}{post.image_url && <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-2xl border border-line"><Image src={post.image_url} alt="Post image" fill sizes="(max-width: 672px) 100vw, 672px" className="object-cover" /></div>}<ContentEngagement target={{ post_id: post.id }} initial={{ reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={currentUserId} /></article>)}{hasMore && <button type="button" onClick={() => void loadMore()} disabled={loading} className="interactive mx-auto block rounded-full border border-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink hover:bg-ink hover:text-paper disabled:opacity-50">{loading ? "Loading..." : "Load more"}</button>}</div>;
}
