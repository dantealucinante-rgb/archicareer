"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImageForUpload } from "@/lib/image-compression";
import type { FeedPost } from "@/types";
import NextImage from "next/image";
import ProfileAvatar from "./ProfileAvatar";

export default function PostComposer({ onCreated, author }: { onCreated: (post: FeedPost) => void; author: { name: string; avatar_url: string | null } | null }) {
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    function selectImage(nextFile: File | null) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(nextFile);
        setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true); setMessage("");
        let path = "";
        try {
            let imageUrl: string | null = null;
            if (file) {
                setMessage("Compressing image…");
                const compressed = await compressImageForUpload(file, "post");
                setMessage("Uploading image…");
                const formData = new FormData();
                formData.set("bucket", "post-images"); formData.set("file", compressed, compressed.name);
                const upload = await fetch("/api/storage", { method: "POST", body: formData });
                const payload = await upload.json().catch(() => ({}));
                if (!upload.ok) throw new Error(payload.error ?? "Unable to upload image");
                imageUrl = payload.url; path = payload.path;
            }
            setMessage("Publishing post…");
            const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: content || null, image_url: imageUrl }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (path) await createClient().storage.from("post-images").remove([path]);
                throw new Error(payload.error ?? "Unable to publish post");
            }
            onCreated(payload.post as FeedPost); setContent(""); selectImage(null); setExpanded(false); setMessage("Published.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to publish post");
        } finally { setSaving(false); }
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
        event.stopPropagation();
        selectImage(event.target.files?.[0] ?? null);
    }

    return <form id="post-composer" onSubmit={submit} className="surface border-x-0 px-5 py-4 shadow-none sm:border-x sm:p-6 sm:shadow-[0_14px_34px_rgba(23,33,38,0.045)]"><fieldset disabled={saving} className="contents"><div className="flex gap-3">{author && <ProfileAvatar profile={author} size={40} className="mt-0.5 h-10 w-10 shrink-0 rounded-full border border-line object-cover" />}<textarea value={content} onFocus={() => setExpanded(true)} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={expanded ? 4 : 1} className="field-input resize-y text-sm" placeholder="Start a field note…" /><div className="hidden w-28 shrink-0 sm:block"><label htmlFor="post-image" className="flex h-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line p-3 text-center font-mono text-[9px] uppercase tracking-widest text-graphite hover:border-redline hover:text-redline">{file ? "Change image" : "Add image"}<input id="post-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleFileChange} /></label></div></div>{previewUrl && <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-2xl border border-line"><NextImage src={previewUrl} alt="Selected post preview" fill unoptimized className="object-cover" /><button type="button" onClick={() => selectImage(null)} className="feedback-control absolute right-2 top-2 rounded-full bg-ink/80 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-paper">Remove</button></div>}<div className="mt-3 flex items-center justify-between gap-3"><label htmlFor="post-image-mobile" className="feedback-control font-mono text-[10px] uppercase tracking-widest text-graphite sm:hidden">{file ? "Change image" : "Add image"}<input id="post-image-mobile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleFileChange} /></label><p aria-live="polite" className={`text-sm ${message.startsWith("Unable") ? "text-redline" : "text-graphite"}`}>{saving && <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-redline" />}{message}</p><button type="submit" className="feedback-control rounded-full border border-ink bg-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-redline disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Publishing…" : "Publish"}</button></div></fieldset></form>;
}
