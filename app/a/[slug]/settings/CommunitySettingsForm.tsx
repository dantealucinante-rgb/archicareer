"use client";

import { useState } from "react";
import type { Community } from "@/types/community";
import styles from "@/app/communities/community.module.css";

export default function CommunitySettingsForm({ community }: { community: Community }) {
    const [name, setName] = useState(community.name);
    const [description, setDescription] = useState(community.description);
    const [visibility, setVisibility] = useState(community.visibility);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); if (busy) return; setBusy(true); setMessage("");
        try {
            const response = await fetch(`/api/communities/${encodeURIComponent(community.slug)}/settings`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, visibility }) });
            const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error ?? "Unable to save settings");
            setMessage("Community settings saved.");
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save settings"); }
        finally { setBusy(false); }
    }
    return <form className={styles.settingsGrid} onSubmit={submit}>
        <label>Community name<input required minLength={3} maxLength={50} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Description<textarea required minLength={1} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Visibility<select value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)}><option value="public">Public</option><option value="private">Private</option></select></label>
        <p className={styles.fieldHint}>Community URL: /a/{community.slug}. The URL stays stable for existing links.</p>
        <div className={styles.formFooter}><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>{message && <span role="status" className={styles.fieldHint}>{message}</span>}</div>
    </form>;
}
