"use client";

import Link from "next/link";
import { useRef, useState } from "react";
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
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingBody, setEditingBody] = useState("");
    const [message, setMessage] = useState("");
    const [reactionPending, setReactionPending] = useState(false);
    const [reactionError, setReactionError] = useState("");
    const [shareMessage, setShareMessage] = useState("");
    const [sharePending, setSharePending] = useState(false);
    const reactionRequestInFlight = useRef(false);

    function collectCommentThreadIds(rootId: string) {
        const ids = new Set([rootId]);
        let expanded = true;

        while (expanded) {
            expanded = false;
            for (const comment of comments) {
                if (comment.parent_comment_id && ids.has(comment.parent_comment_id) && !ids.has(comment.id)) {
                    ids.add(comment.id);
                    expanded = true;
                }
            }
        }

        return ids;
    }

    async function loadComments() {
        setLoading(true);
        setMessage("");
        try {
            const query = target.portfolio_item_id ? `portfolio_item_id=${target.portfolio_item_id}` : `post_id=${target.post_id}`;
            const response = await fetch(`/api/comments?${query}`);
            const payload = await response.json().catch(() => ({}));
            if (response.ok) {
                setComments(payload.comments ?? []);
            } else {
                setMessage(payload.error ?? "Unable to load comments");
            }
        } catch {
            setMessage("Unable to load comments");
        } finally {
            setLoading(false);
        }
    }

    async function toggleReaction() {
        if (!currentUserId || reactionRequestInFlight.current) return;
        const previousSummary = summary;
        const nextReacted = !previousSummary.userReacted;

        reactionRequestInFlight.current = true;
        setReactionError("");
        setSummary({
            ...previousSummary,
            userReacted: nextReacted,
            reactionCount: Math.max(0, previousSummary.reactionCount + (nextReacted ? 1 : -1)),
        });
        setReactionPending(true);
        let timeout: number | undefined;
        try {
            const controller = new AbortController();
            timeout = window.setTimeout(() => controller.abort(), 15_000);
            const response = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, reacted: nextReacted }), signal: controller.signal });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to update reaction");
            setSummary((current) => ({ ...current, reactionCount: Math.max(0, payload.count), userReacted: Boolean(payload.reacted) }));
        } catch {
            setSummary(previousSummary);
            setReactionError("Couldn’t update like. Try again.");
        } finally {
            if (timeout !== undefined) window.clearTimeout(timeout);
            reactionRequestInFlight.current = false;
            setReactionPending(false);
        }
    }

    async function submitComment(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!body.trim() || !currentUserId) return;
        setMessage("");
        const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, parent_comment_id: replyingTo, content: body }) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { setMessage(payload.error ?? "Unable to add comment"); return; }
        setComments((current) => [...current, payload.comment]);
        setSummary((current) => ({ ...current, commentCount: current.commentCount + 1 }));
        setBody(""); setReplyingTo(null);
    }

    async function saveComment(id: string) {
        const response = await fetch("/api/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, content: editingBody }) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { setMessage(payload.error ?? "Unable to update comment"); return; }
        setComments((current) => current.map((comment) => comment.id === id ? payload.comment : comment));
        setEditingId(null); setEditingBody("");
    }

    async function removeComment(id: string) {
        setMessage("");
        try {
            const response = await fetch("/api/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(payload.error ?? "Unable to delete comment");
                return;
            }
        } catch {
            setMessage("Unable to delete comment");
            return;
        }
        const removedIds = collectCommentThreadIds(id);

        setComments((current) => current.filter((comment) => !removedIds.has(comment.id)));
        setSummary((current) => ({ ...current, commentCount: Math.max(0, current.commentCount - removedIds.size) }));
        if (removedIds.has(replyingTo ?? "")) setReplyingTo(null);
        if (removedIds.has(editingId ?? "")) {
            setEditingId(null);
            setEditingBody("");
        }
    }

    function toggleComments() {
        const next = !open; setOpen(next);
        if (next && comments.length === 0) void loadComments();
    }

    async function sharePost() {
        if (!target.post_id || sharePending) return;
        const url = `${window.location.origin}/feed#post-${target.post_id}`;
        const shareData = { title: "ArchiCareer", text: "A post from the ArchiCareer field", url };

        setSharePending(true);
        setShareMessage("");
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                setShareMessage("Shared.");
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                setShareMessage("Link copied.");
            } else {
                throw new Error("Sharing is not available");
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            setShareMessage("Couldn’t share this post.");
        } finally {
            setSharePending(false);
        }
    }

    function renderComment(comment: Comment, depth = 0): React.ReactNode {
        const replies = comments.filter((child) => child.parent_comment_id === comment.id);
        return <div key={comment.id} className={depth > 0 ? `${depth > 3 ? "ml-3" : "ml-8"} border-l border-line pl-3` : ""}>
            <div className="flex gap-3">
                <ProfileAvatar profile={comment.author ?? { name: "Community member" }} size={28} className="h-7 w-7 shrink-0 rounded-full border border-line object-cover" />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2"><span className="font-mono text-[10px] uppercase tracking-widest text-ink">{comment.author?.name ?? "Community member"}</span><span className="font-mono text-[9px] uppercase tracking-widest text-graphite">{formatCommunityDate(comment.created_at)}</span>{currentUserId && <button type="button" onClick={() => { setReplyingTo(comment.id); setBody(""); }} className="font-mono text-[9px] uppercase tracking-widest text-ink hover:text-redline">Reply</button>}{comment.user_id === currentUserId && <button type="button" onClick={() => { setEditingId(comment.id); setEditingBody(comment.content); }} className="font-mono text-[9px] uppercase tracking-widest text-ink hover:text-redline">Edit</button>}{(comment.user_id === currentUserId || canModerate) && <button type="button" onClick={() => void removeComment(comment.id)} className="font-mono text-[9px] uppercase tracking-widest text-redline hover:text-ink">Delete</button>}</div>
                    {editingId === comment.id ? <form onSubmit={(event) => { event.preventDefault(); void saveComment(comment.id); }} className="mt-2 flex gap-2"><input value={editingBody} onChange={(event) => setEditingBody(event.target.value)} maxLength={500} className="field-input text-sm" /><button type="submit" className="shrink-0 rounded-full bg-ink px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-paper">Save</button></form> : <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-graphite">{comment.content}</p>}
                </div>
            </div>
            {replies.length > 0 && <div className="mt-3 space-y-3">{replies.map((reply) => renderComment(reply, depth + 1))}</div>}
        </div>;
    }

    const topLevelComments = comments.filter((comment) => !comment.parent_comment_id);

    return <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-graphite">
            {currentUserId ? <button type="button" onClick={() => void toggleReaction()} disabled={reactionPending} aria-busy={reactionPending} className={`feedback-control like-control inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 disabled:cursor-wait disabled:opacity-60 ${summary.userReacted ? "is-active text-redline" : "hover:text-redline"}`} aria-label={summary.userReacted ? "Unlike" : "Like"} aria-pressed={summary.userReacted}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={summary.userReacted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M20.8 8.7c0 5.4-8.8 10.1-8.8 10.1S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{summary.reactionCount}</span></button> : <Link href="/login" className="feedback-control inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 hover:text-redline" aria-label="Sign in to like"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.8 8.7c0 5.4-8.8 10.1-8.8 10.1S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{summary.reactionCount}</span><span className="sr-only">Sign in to like</span></Link>}
            <button type="button" onClick={toggleComments} aria-expanded={open} className={`feedback-control inline-flex min-h-10 items-center gap-1.5 px-2.5 ${open ? "text-ink" : "hover:text-redline"}`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 18.5 3.5 21v-14A3.5 3.5 0 0 1 7 3.5h10A3.5 3.5 0 0 1 20.5 7v7a3.5 3.5 0 0 1-3.5 3.5H5Z" strokeLinecap="round" strokeLinejoin="round" /></svg>{open ? "Close comments" : "Comments"} <span>{summary.commentCount}</span></button>
            {target.post_id && <button type="button" onClick={() => void sharePost()} disabled={sharePending} aria-busy={sharePending} className="feedback-control inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 hover:text-redline disabled:cursor-wait disabled:opacity-60" aria-label="Share post"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 15.5V3.5m0 0L7.5 8M12 3.5 16.5 8M5 13.5v5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5v-5" strokeLinecap="round" strokeLinejoin="round" /></svg><span>Share</span></button>}
        </div>
        {reactionError && <p role="alert" className="mt-1 font-mono text-[9px] uppercase tracking-wider text-redline">{reactionError} <button type="button" onClick={() => void toggleReaction()} className="underline underline-offset-2 hover:text-ink">Retry</button></p>}
        {shareMessage && <p aria-live="polite" className="mt-1 font-mono text-[9px] uppercase tracking-wider text-graphite">{shareMessage}</p>}
        {open && <div className="mt-4 space-y-4"><div className="space-y-3">{loading ? <div role="status" className="rounded-xl bg-warm-white px-4 py-3 text-sm text-graphite"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-ink" />Loading discussion…</div> : message && comments.length === 0 ? <div role="alert" className="rounded-xl border border-redline/30 bg-redline/5 px-4 py-3 text-sm text-redline">{message}</div> : topLevelComments.length === 0 ? <div className="rounded-xl border border-dashed border-line bg-warm-white px-4 py-4 text-sm text-graphite">No comments yet. Be the first to add a note.</div> : topLevelComments.map((comment) => renderComment(comment))}</div>{currentUserId ? <form onSubmit={submitComment} className="flex gap-2">{replyingTo && <button type="button" onClick={() => setReplyingTo(null)} className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-redline">Cancel reply</button>}<input autoFocus={Boolean(replyingTo)} value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} className="field-input text-sm" placeholder={replyingTo ? "Write a reply" : "Add a note"} /><button type="submit" className="shrink-0 rounded-full border border-ink bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-redline">{replyingTo ? "Reply" : "Post"}</button></form> : <p className="font-mono text-[10px] uppercase tracking-widest text-graphite"><Link href="/login" className="text-redline hover:text-ink">Sign in</Link> to join the conversation.</p>}{message && comments.length > 0 && <p role="alert" className="rounded-lg bg-redline/5 px-3 py-2 text-sm text-redline">{message}</p>}</div>}
    </div>;
}
