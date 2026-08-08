"use client";

import Link from "next/link";
import { useState } from "react";
import type { Comment, EngagementSummary } from "@/types";
import ProfileAvatar from "./ProfileAvatar";
import { formatCommunityDate } from "@/lib/date-format";

type Target = { portfolio_item_id?: string; post_id?: string };

export default function ContentEngagement({ target, initial, currentUserId, canModerate = false }: { target: Target; initial: EngagementSummary; currentUserId: string | null; canModerate?: boolean }) {
    const [summary, setSummary] = useState(initial);
    const [comments, setComments] = useState<Comment[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [body, setBody] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingBody, setEditingBody] = useState("");
    const [message, setMessage] = useState("");
    const [reactionPending, setReactionPending] = useState(false);

    async function loadComments() {
        setLoading(true); setMessage("");
        const query = target.portfolio_item_id ? `portfolio_item_id=${target.portfolio_item_id}` : `post_id=${target.post_id}`;
        const response = await fetch(`/api/comments?${query}`);
        const payload = await response.json().catch(() => ({}));
        if (response.ok) setComments(payload.comments ?? []);
        else setMessage(payload.error ?? "Unable to load comments");
        setLoading(false);
    }

    async function toggleReaction() {
        if (!currentUserId || reactionPending) return;
        setReactionPending(true);
        try {
            const response = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(target) });
            const payload = await response.json().catch(() => ({}));
            if (response.ok) setSummary((current) => ({ ...current, reactionCount: payload.count, userReacted: payload.reacted }));
            else setMessage(payload.error ?? "Unable to update reaction");
        } catch {
            setMessage("Unable to update reaction");
        } finally {
            setReactionPending(false);
        }
    }

    async function submitComment(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!body.trim() || !currentUserId) return;
        setMessage("");
        const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, content: body }) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { setMessage(payload.error ?? "Unable to add comment"); return; }
        setComments((current) => [...current, payload.comment]);
        setSummary((current) => ({ ...current, commentCount: current.commentCount + 1 }));
        setBody("");
    }

    async function saveComment(id: string) {
        const response = await fetch("/api/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, content: editingBody }) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { setMessage(payload.error ?? "Unable to update comment"); return; }
        setComments((current) => current.map((comment) => comment.id === id ? payload.comment : comment));
        setEditingId(null); setEditingBody("");
    }

    async function removeComment(id: string) {
        const response = await fetch("/api/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        if (!response.ok) return;
        setComments((current) => current.filter((comment) => comment.id !== id));
        setSummary((current) => ({ ...current, commentCount: Math.max(0, current.commentCount - 1) }));
    }

    function toggleComments() {
        const next = !open;
        setOpen(next);
        if (next && comments.length === 0) void loadComments();
    }

    return <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-graphite">
            <button type="button" onClick={() => void toggleReaction()} disabled={!currentUserId || reactionPending} className={`transition-colors disabled:cursor-wait disabled:opacity-60 ${summary.userReacted ? "text-redline" : "hover:text-redline"}`} aria-pressed={summary.userReacted}>{summary.userReacted ? "Liked" : "Like"} <span className="ml-1">{summary.reactionCount}</span></button>
            <button type="button" onClick={toggleComments} aria-expanded={open} className="transition-colors hover:text-redline">Comments <span className="ml-1">{summary.commentCount}</span></button>
        </div>
        {open && <div className="mt-4 space-y-4">
            <div className="space-y-3">
                {loading ? <p className="text-sm text-graphite">Loading comments...</p> : comments.length === 0 ? <p className="text-sm text-graphite">No comments yet. Add the first note.</p> : comments.map((comment) => <div key={comment.id} className="flex gap-3">
                    <ProfileAvatar profile={comment.author ?? { name: "Community member" }} size={28} className="h-7 w-7 shrink-0 rounded-full border border-line object-cover" />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2"><span className="font-mono text-[10px] uppercase tracking-widest text-ink">{comment.author?.name ?? "Community member"}</span><span className="font-mono text-[9px] uppercase tracking-widest text-graphite">{formatCommunityDate(comment.created_at)}</span>{comment.user_id === currentUserId && <button type="button" onClick={() => { setEditingId(comment.id); setEditingBody(comment.content); }} className="font-mono text-[9px] uppercase tracking-widest text-ink hover:text-redline">Edit</button>}{(comment.user_id === currentUserId || canModerate) && <button type="button" onClick={() => void removeComment(comment.id)} className="font-mono text-[9px] uppercase tracking-widest text-redline hover:text-ink">Delete</button>}</div>
                        {editingId === comment.id ? <form onSubmit={(event) => { event.preventDefault(); void saveComment(comment.id); }} className="mt-2 flex gap-2"><input value={editingBody} onChange={(event) => setEditingBody(event.target.value)} maxLength={500} className="field-input text-sm" /><button type="submit" className="shrink-0 rounded-full bg-ink px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-paper">Save</button></form> : <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-graphite">{comment.content}</p>}
                    </div>
                </div>)}
            </div>
            {currentUserId ? <form onSubmit={submitComment} className="flex gap-2"><input value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} className="field-input text-sm" placeholder="Add a note" /><button type="submit" className="shrink-0 rounded-full border border-ink bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-redline">Post</button></form> : <p className="font-mono text-[10px] uppercase tracking-widest text-graphite"><Link href="/login" className="text-redline hover:text-ink">Sign in</Link> to join the conversation.</p>}
            {message && <p role="alert" className="font-mono text-[10px] uppercase tracking-widest text-redline">{message}</p>}
        </div>}
    </div>;
}
