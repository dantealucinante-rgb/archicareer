"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Community } from "@/types/community";
import styles from "./community.module.css";

export default function CommunityMembershipButton({ community, returnTo }: { community: Community; returnTo?: string }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const role = community.viewer_role;
    const status = community.viewer_status;
    const action = status === "active" ? "leave" : status === "pending" ? "cancel_request" : community.visibility === "private" ? "request" : "join";
    const label = role === "owner" ? "Owner" : role === "moderator" ? "Moderator · Leave" : status === "active" ? "Joined · Leave" : status === "pending" ? "Requested · Cancel" : status === "banned" ? "Membership restricted" : community.visibility === "private" ? "Request to join" : "Join community";

    async function changeMembership() {
        if (status === "banned" || role === "owner") return;
        setBusy(true);
        setError("");
        try {
            const response = await fetch(`/api/communities/${encodeURIComponent(community.slug)}/membership`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const payload = await response.json().catch(() => ({}));
            if (response.status === 401) {
                window.location.assign(`/login?next=${encodeURIComponent(returnTo ?? "/communities")}`);
                return;
            }
            if (!response.ok) throw new Error(payload.error ?? "Unable to update membership");
            router.refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to update membership");
        } finally {
            setBusy(false);
        }
    }

    const disabled = busy || status === "banned" || role === "owner";
    return <div className={styles.membershipControl}>
        <button type="button" className={`${styles.button} ${status === "active" || role ? styles.buttonSecondary : styles.buttonPrimary}`} onClick={() => void changeMembership()} disabled={disabled} aria-busy={busy}>
            {busy ? "Saving…" : label}
        </button>
        {error && <p role="alert" className={styles.inlineError}>{error}</p>}
    </div>;
}
