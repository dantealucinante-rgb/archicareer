"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeedPost } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import ContentEngagement from "./ContentEngagement";
import PostComposer from "./PostComposer";
import { formatCommunityDate } from "@/lib/date-format";

export default function FeedList({ initialPosts, currentUserId }: { initialPosts: FeedPost[]; currentUserId: string | null }) {
    const [posts, setPosts] = useState(initialPosts);
    const [offset, setOffset] = useState(initialPosts.length);
    const [hasMore, setHasMore] = useState(initialPosts.length === 10);
    const [loading, setLoading] = useState(false);

    async function loadMore() {
        if (loading || !hasMore) return;
        setLoading(true);
        const response = await fetch(`/api/posts?limit=10&offset=${offset}`);
        const payload = await response.json().catch(() => ({}));
        if (response.ok) { setPosts((current) => [...current, ...(payload.posts ?? [])]); setOffset((current) => current + (payload.posts?.length ?? 0)); setHasMore(Boolean(payload.hasMore)); }
        setLoading(false);
    }

    function addPost(post: FeedPost) {
        setPosts((current) => [post, ...current.filter((currentPost) => currentPost.id !== post.id)]);
    }

    async function removePost(id: string) {
        const response = await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        if (response.ok) setPosts((current) => current.filter((post) => post.id !== id));
    }

    return <div className="mx-auto w-full max-w-2xl space-y-5">{currentUserId && <PostComposer onCreated={addPost} />}{posts.length === 0 ? <div className="surface border-dashed p-10 text-center"><p className="eyebrow font-mono text-redline">THE FIELD IS QUIET</p><p className="mt-3 text-sm text-graphite">Be the first to share a thought, question, or piece of work.</p></div> : posts.map((post) => <article key={post.id} className="surface overflow-hidden p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><ProfileAvatar profile={post.author} size={42} className="h-10 w-10 rounded-full border border-line object-cover" /><div><p className="font-display text-base font-semibold text-ink">{post.author.name}</p><p className="font-mono text-[9px] uppercase tracking-widest text-graphite">{post.author.role} · {formatCommunityDate(post.created_at)}</p></div></div>{post.user_id === currentUserId && <button type="button" onClick={() => void removePost(post.id)} className="font-mono text-[9px] uppercase tracking-widest text-redline hover:text-ink">Delete</button>}</div>{post.content && <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.content}</p>}{post.image_url && <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-2xl border border-line"><Image src={post.image_url} alt="Post image" fill sizes="(max-width: 672px) 100vw, 672px" className="object-cover" /></div>}<ContentEngagement target={{ post_id: post.id }} initial={{ reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }} currentUserId={currentUserId} /></article>)}{hasMore && <button type="button" onClick={() => void loadMore()} disabled={loading} className="mx-auto block rounded-full border border-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink hover:bg-ink hover:text-paper disabled:opacity-50">{loading ? "Loading..." : "Load more"}</button>}</div>;
}
