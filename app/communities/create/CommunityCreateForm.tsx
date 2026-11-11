"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../community.module.css";

function toSlug(value: string) {
    return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64).replace(/-+$/g, "");
}

export default function CommunityCreateForm() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [slug, setSlug] = useState("");
    const [customSlug, setCustomSlug] = useState(false);
    const [visibility, setVisibility] = useState<"public" | "private">("public");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const previewUrl = useRef("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);

    function setAvatarFile(file: File | null) {
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = file ? URL.createObjectURL(file) : "";
        setPreview(previewUrl.current);
        setAvatar(file);
    }

    const remaining = useMemo(() => 500 - description.length, [description.length]);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");
        let uploadedPath: string | null = null;
        try {
            let avatarUrl: string | null = null;
            if (avatar) {
                const form = new FormData();
                form.set("bucket", "avatars");
                form.set("file", avatar);
                const upload = await fetch("/api/storage", { method: "POST", body: form });
                const uploadResult = await upload.json().catch(() => ({}));
                if (!upload.ok) throw new Error(uploadResult.error ?? "Could not upload the community image");
                uploadedPath = uploadResult.path as string;
                avatarUrl = uploadResult.url as string;
            }
            const response = await fetch("/api/communities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, slug, visibility, avatar_url: avatarUrl }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error ?? "Could not create the community");
            window.location.assign(`/a/${result.community.slug}`);
        } catch (cause) {
            if (uploadedPath) await createClient().storage.from("avatars").remove([uploadedPath]).catch(() => null);
            setError(cause instanceof Error ? cause.message : "Could not create the community");
            setSaving(false);
        }
    }

    return <form className={styles.createForm} onSubmit={(event) => void submit(event)}>
        <div className={styles.fieldGroup}>
            <label htmlFor="community-name">Community name</label>
            <input id="community-name" className={styles.field} value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!customSlug) setSlug(toSlug(value)); }} minLength={3} maxLength={50} required autoComplete="off" />
            <p className={styles.fieldHint}>Use 3–50 characters. Choose a clear name people can find.</p>
        </div>
        <div className={styles.fieldGroup}>
            <label htmlFor="community-slug">Community URL</label>
            <div className="flex min-w-0 items-center border-2 border-ink bg-white px-3">
                <span className="shrink-0 text-sm text-graphite">archicareer.com.ng/a/</span>
                <input id="community-slug" className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm outline-none" value={slug} onChange={(event) => { setCustomSlug(true); setSlug(toSlug(event.target.value)); }} minLength={3} maxLength={64} pattern="[a-z0-9]+(-[a-z0-9]+)*" required aria-describedby="community-slug-hint" />
            </div>
            <p id="community-slug-hint" className={styles.fieldHint}>Letters, numbers and hyphens. We’ve generated a starting URL from the name.</p>
        </div>
        <div className={styles.fieldGroup}>
            <label htmlFor="community-description">Description</label>
            <textarea id="community-description" className={`${styles.field} ${styles.textarea}`} value={description} onChange={(event) => setDescription(event.target.value)} minLength={1} maxLength={500} required aria-describedby="community-description-count" />
            <p id="community-description-count" className={styles.fieldHint}>{remaining} characters remaining</p>
        </div>
        <fieldset className={styles.fieldGroup}>
            <legend className="text-sm font-bold">Visibility</legend>
            <div className={styles.visibilityOptions}>
                <label className={styles.visibilityOption}><input type="radio" name="visibility" value="public" checked={visibility === "public"} onChange={() => setVisibility("public")} /><span><strong>Public</strong><small>Anyone can discover and read posts. Members can participate.</small></span></label>
                <label className={styles.visibilityOption}><input type="radio" name="visibility" value="private" checked={visibility === "private"} onChange={() => setVisibility("private")} /><span><strong>Private</strong><small>People request access. Only approved members see posts and media.</small></span></label>
            </div>
        </fieldset>
        <div className={styles.fieldGroup}>
            <label htmlFor="community-avatar">Community image <span className="font-normal text-graphite">(optional)</span></label>
            <input id="community-avatar" className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} />
            <p className={styles.fieldHint}>JPEG, PNG or WebP, up to 2 MB.</p>
            {preview && <Image className={styles.formThumb} src={preview} alt="Community image preview" width={88} height={88} unoptimized />}
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.formFooter}>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={saving || !slug}>{saving ? "Creating…" : "Create community"}</button>
            <Link href="/communities" className={`${styles.button} ${styles.buttonSecondary}`}>Cancel</Link>
        </div>
    </form>;
}
