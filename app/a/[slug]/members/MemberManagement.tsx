"use client";

import { useState } from "react";
import type { CommunityMember } from "@/types/community";
import styles from "@/app/communities/community.module.css";

type Action = "approve" | "reject" | "remove" | "ban" | "unban" | "promote" | "demote";

export default function MemberManagement({ members: initial, bannedMembers: initialBanned = [], hasMore = false, slug, canManage, isOwner }: { members: CommunityMember[]; bannedMembers?: CommunityMember[]; hasMore?: boolean; slug: string; canManage: boolean; isOwner: boolean }) {
    const [members, setMembers] = useState(initial);
    const [bannedMembers, setBannedMembers] = useState(initialBanned);
    const [moreMembers, setMoreMembers] = useState(hasMore);
    const [loadingMore, setLoadingMore] = useState(false);
    const [memberOffset, setMemberOffset] = useState(initial.length);
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    async function act(member: CommunityMember, action: Action) {
        const destructive = ["reject", "remove", "ban", "demote"].includes(action);
        if (destructive && !window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${member.profile?.name ?? "this member"}?`)) return;
        setBusy(member.id); setMessage("");
        try {
            const response = await fetch(`/api/communities/${encodeURIComponent(slug)}/membership`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, user_id: member.user_id }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Membership update failed");
            if (action === "approve") setMembers((current) => current.map((item) => item.id === member.id ? { ...item, status: "active", joined_at: new Date().toISOString() } : item));
            else if (action === "promote" || action === "demote") setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role: action === "promote" ? "moderator" : "member" } : item));
            else if (action === "ban") {
                setMembers((current) => current.filter((item) => item.id !== member.id));
                setBannedMembers((current) => [{ ...member, status: "banned", joined_at: null }, ...current]);
            } else {
                setMembers((current) => current.filter((item) => item.id !== member.id));
                if (action === "unban") setBannedMembers((current) => current.filter((item) => item.id !== member.id));
            }
        } catch (error) { setMessage(error instanceof Error ? error.message : "Membership update failed"); }
        finally { setBusy(null); }
    }

    async function loadMoreMembers() {
        if (loadingMore || !moreMembers) return;
        setLoadingMore(true);
        try {
            const response = await fetch(`/api/communities/${encodeURIComponent(slug)}/members?limit=100&offset=${memberOffset}`);
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to load more members");
            setMembers((current) => [...current, ...(payload.members ?? [])]); setMemberOffset((current) => current + (payload.members?.length ?? 0)); setMoreMembers(Boolean(payload.hasMore));
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load more members"); }
        finally { setLoadingMore(false); }
    }

    const pending = members.filter((member) => member.status === "pending");
    const active = members.filter((member) => member.status === "active");
    return <>
        {message && <p className={styles.notice} role="alert">{message}</p>}
        {canManage && pending.length > 0 && <section><div className={styles.listHeading}><h2>Membership requests</h2><span>{pending.length}</span></div>{pending.map((member) => <MemberRow key={member.id} member={member}><div className={styles.moderationActions}><button className={`${styles.button} ${styles.smallButton} ${styles.successButton}`} disabled={busy === member.id} onClick={() => void act(member, "approve")}>Approve</button><button className={`${styles.button} ${styles.smallButton} ${styles.dangerButton}`} disabled={busy === member.id} onClick={() => void act(member, "reject")}>Reject</button></div></MemberRow>)}</section>}
        <section><div className={styles.listHeading}><h2>Members</h2><span>{active.length}</span></div>{active.map((member) => <MemberRow key={member.id} member={member}><div className={styles.moderationActions}><span className={styles.postTag}>{member.role}</span>{canManage && member.role !== "owner" && (isOwner || member.role === "member") && <>
            {isOwner && (member.role === "moderator" ? <button className={`${styles.button} ${styles.smallButton}`} disabled={busy === member.id} onClick={() => void act(member, "demote")}>Remove moderator</button> : <button className={`${styles.button} ${styles.smallButton}`} disabled={busy === member.id} onClick={() => void act(member, "promote")}>Make moderator</button>)}
            <button className={`${styles.button} ${styles.smallButton} ${styles.dangerButton}`} disabled={busy === member.id} onClick={() => void act(member, "remove")}>Remove</button>
            <button className={`${styles.button} ${styles.smallButton} ${styles.dangerButton}`} disabled={busy === member.id} onClick={() => void act(member, "ban")}>Ban</button>
        </>}</div></MemberRow>)}{active.length === 0 && <p className={styles.fieldHint}>No members to show.</p>}</section>
        {canManage && bannedMembers.length > 0 && <section><div className={styles.listHeading}><h2>Banned members</h2><span>{bannedMembers.length}</span></div>{bannedMembers.map((member) => <MemberRow key={member.id} member={member}><button className={`${styles.button} ${styles.smallButton}`} disabled={busy === member.id} onClick={() => void act(member, "unban")}>Unban</button></MemberRow>)}</section>}
        {moreMembers && <div className={styles.pagination}><button className={`${styles.button} ${styles.buttonSecondary}`} disabled={loadingMore} onClick={() => void loadMoreMembers()}>{loadingMore ? "Loading…" : "Load more members"}</button></div>}
    </>;
}

function MemberRow({ member, children }: { member: CommunityMember; children?: React.ReactNode }) {
    return <div className={styles.moderationRow}><div className={styles.memberRow}><div className={styles.avatar}>{member.profile?.name.slice(0, 1) ?? "A"}</div><div className={styles.memberInfo}><strong>{member.profile?.name ?? "Community member"}</strong><span>{member.profile?.location ?? member.status}</span></div></div>{children}</div>;
}
