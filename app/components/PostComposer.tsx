"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NextImage from "next/image";
import { createClient } from "@/lib/supabase/client";
import { compressImageForUpload } from "@/lib/image-compression";
import type { FeedPost } from "@/types";
import ProfileAvatar from "./ProfileAvatar";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated: (post: FeedPost) => void;
    author: { name: string; avatar_url: string | null } | null;
};

export default function PostComposer({ open, onClose, onCreated, author }: Props) {
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [closing, setClosing] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [dragClosing, setDragClosing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dragRef = useRef<{ pointerId: number; startY: number; lastY: number; lastTime: number; velocity: number; offset: number } | null>(null);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const mounted = open || closing;

    const requestClose = useCallback((force = false, fromDrag = false) => {
        if (closing || (!force && saving)) return;
        if (fromDrag) setDragClosing(true);
        setClosing(true);
        window.setTimeout(() => {
            setClosing(false);
            setDragClosing(false);
            setDragOffset(0);
            onClose();
        }, 150);
    }, [closing, onClose, saving]);

    useEffect(() => {
        if (open && !closing) window.requestAnimationFrame(() => textareaRef.current?.focus());
    }, [closing, open]);

    useEffect(() => {
        if (!mounted) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) requestClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [mounted, requestClose, saving]);

    function selectImage(nextFile: File | null) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(nextFile);
        setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
    }

    function resizeTextarea(element: HTMLTextAreaElement) {
        element.style.height = "auto";
        element.style.height = `${element.scrollHeight}px`;
    }

    function startSheetDrag(event: React.PointerEvent<HTMLElement>) {
        if (saving || event.pointerType === "mouse" || !window.matchMedia("(max-width: 639px)").matches) return;
        if ((event.target as HTMLElement).closest("button, input, label, textarea")) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { pointerId: event.pointerId, startY: event.clientY, lastY: event.clientY, lastTime: performance.now(), velocity: 0, offset: 0 };
    }

    function moveSheetDrag(event: React.PointerEvent<HTMLElement>) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const nextOffset = Math.max(0, event.clientY - drag.startY);
        const now = performance.now();
        drag.velocity = (event.clientY - drag.lastY) / Math.max(1, now - drag.lastTime);
        drag.lastY = event.clientY;
        drag.lastTime = now;
        drag.offset = nextOffset;
        setDragOffset(nextOffset);
    }

    function endSheetDrag(event: React.PointerEvent<HTMLElement>) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        if (drag.offset > 112 || drag.velocity > 0.65) requestClose(false, true);
        else setDragOffset(0);
    }

    function cancelSheetDrag(event: React.PointerEvent<HTMLElement>) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        dragRef.current = null;
        setDragOffset(0);
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving || (!content.trim() && !file)) return;

        setSaving(true);
        setMessage("");
        let path = "";
        try {
            let imageUrl: string | null = null;
            if (file) {
                setMessage("Compressing image…");
                const compressed = await compressImageForUpload(file, "post");
                setMessage("Uploading image…");
                const formData = new FormData();
                formData.set("bucket", "post-images");
                formData.set("file", compressed, compressed.name);
                const upload = await fetch("/api/storage", { method: "POST", body: formData });
                const payload = await upload.json().catch(() => ({}));
                if (!upload.ok) throw new Error(payload.error ?? "Unable to upload image");
                imageUrl = payload.url;
                path = payload.path;
            }
            setMessage("Publishing post…");
            const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: content.trim() || null, image_url: imageUrl }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (path) await createClient().storage.from("post-images").remove([path]);
                throw new Error(payload.error ?? "Unable to publish post");
            }
            onCreated(payload.post as FeedPost);
            setContent("");
            selectImage(null);
            setMessage("");
            requestClose(true);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to publish post");
        } finally {
            setSaving(false);
        }
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        selectImage(event.target.files?.[0] ?? null);
        event.target.value = "";
    }

    if (!mounted || typeof document === "undefined") return null;

    const canDismissFromBackdrop = !saving && !content.trim() && !file;
    return createPortal(
        <div className={`post-composer-overlay fixed inset-0 z-[70] flex items-end bg-night/45 p-0 sm:items-center sm:justify-center sm:p-6 ${closing ? "is-closing" : "is-open"}`} onMouseDown={() => { if (canDismissFromBackdrop) requestClose(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="post-composer-title" className={`t-modal relative w-full rounded-t-[1.5rem] border border-line bg-warm-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-6 ${closing ? "is-closing" : "is-open"}`} style={dragOffset || dragClosing ? { transform: `translateY(${dragClosing ? "100vh" : `${dragOffset}px`})`, transition: dragClosing ? "transform 150ms cubic-bezier(0.22, 1, 0.36, 1)" : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)" } : undefined} onMouseDown={(event) => event.stopPropagation()} onPointerDown={startSheetDrag} onPointerMove={moveSheetDrag} onPointerUp={endSheetDrag} onPointerCancel={cancelSheetDrag}>
                <div className="flex items-start justify-between gap-4">
                    <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line sm:hidden" />
                    <div className="flex min-w-0 items-center gap-3">
                        {author && <ProfileAvatar profile={author} size={44} className="h-11 w-11 shrink-0 rounded-full border border-line object-cover" />}
                        <div className="min-w-0"><h2 id="post-composer-title" className="line-clamp-2 font-display text-lg font-semibold text-ink">{author?.name ?? "Share a post"}</h2><p className="font-mono text-[9px] uppercase tracking-widest text-graphite">Share with the field</p></div>
                    </div>
                    <button type="button" onClick={() => requestClose()} disabled={saving} aria-label="Close post composer" className="feedback-control grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl text-graphite hover:bg-sand hover:text-ink disabled:opacity-50">×</button>
                </div>
                <form onSubmit={submit} className="mt-5">
                    <fieldset disabled={saving}>
                        <textarea ref={textareaRef} value={content} onChange={(event) => { setContent(event.target.value); resizeTextarea(event.currentTarget); }} maxLength={1000} rows={5} className="min-h-40 w-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-ink outline-none placeholder:text-graphite/65" placeholder="Share your thoughts..." aria-label="Post content" />
                        {previewUrl && <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl border border-line"><NextImage src={previewUrl} alt="Selected post preview" fill unoptimized className="object-cover" /><button type="button" onClick={() => selectImage(null)} className="feedback-control absolute right-2 top-2 rounded-full bg-ink/80 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-paper">Remove</button></div>}
                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                            <label className="feedback-control inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-3 font-mono text-[10px] uppercase tracking-widest text-graphite hover:bg-sand hover:text-ink"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m4 18 5-5 3.5 3.5 2.5-2.5 5 4" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{file ? "Change image" : "Image"}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleFileChange} /></label>
                            <div className="flex min-w-0 items-center gap-3"><p aria-live="polite" className={`min-w-0 text-right text-xs ${message ? "text-redline" : "text-graphite"}`}>{message}</p><button type="submit" disabled={!content.trim() && !file} className="feedback-control shrink-0 rounded-full border border-ink bg-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-redline disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Publishing…" : "Publish"}</button></div>
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>,
        document.body,
    );
}
