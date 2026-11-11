"use client";

import { useState } from "react";
import styles from "@/app/communities/community.module.css";

type Report = { id: string; target_type: string; target_id: string; category: string; details: string | null; status: string; created_at: string };

export default function ModerationPanel({ initialReports, slug, initialError = "" }: { initialReports: Report[]; slug: string; initialError?: string }) {
    const [reports, setReports] = useState(initialReports);
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    async function act(report: Report, action: "remove_content" | "resolved" | "dismissed") {
        if (action !== "dismissed" && !window.confirm(action === "remove_content" ? "Remove this post or comment from the community?" : "Mark this report as resolved?")) return;
        setBusy(report.id); setMessage("");
        const body = action === "remove_content"
            ? { action, target_type: report.target_type, target_id: report.target_id }
            : { action: "resolve_report", report_id: report.id, status: action, reason: action === "resolved" ? "Reviewed by a community moderator" : "" };
        try {
            const response = await fetch(`/api/communities/${encodeURIComponent(slug)}/moderation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error ?? "Moderation action failed");
            setReports((current) => current.filter((item) => item.id !== report.id));
        } catch (error) { setMessage(error instanceof Error ? error.message : "Moderation action failed"); }
        finally { setBusy(null); }
    }
    return <>
        {(message || initialError) && <p role="alert" className={styles.notice}>{message || initialError}</p>}
        {!initialError && reports.length === 0 ? <div className={styles.empty}><h2>No open reports.</h2><p>New reports for this community will appear here.</p></div> : !initialError && <div className={styles.postList}>{reports.map((report) => <article className={styles.postCard} key={report.id}>
            <div className={styles.cardTitleLine}><h2 className={styles.cardTitle}>{report.target_type} report</h2><span className={styles.postTag}>{report.status.replaceAll("_", " ")}</span></div>
            <p><strong>{report.category}</strong> · {new Date(report.created_at).toLocaleDateString()}</p>
            {report.details && <p className={styles.postBody}>{report.details}</p>}
            <div className={styles.postActions}>{(report.target_type === "post" || report.target_type === "comment") && <button className={`${styles.button} ${styles.smallButton} ${styles.dangerButton}`} disabled={busy === report.id} onClick={() => void act(report, "remove_content")}>Remove content</button>}<button className={`${styles.button} ${styles.smallButton} ${styles.successButton}`} disabled={busy === report.id} onClick={() => void act(report, "resolved")}>Resolve</button><button className={`${styles.button} ${styles.smallButton}`} disabled={busy === report.id} onClick={() => void act(report, "dismissed")}>Dismiss</button></div>
        </article>)}</div>}
    </>;
}
