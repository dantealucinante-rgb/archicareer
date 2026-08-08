"use client";

import { useState } from "react";
import type { Application, ApplicationStatus } from "@/types";
import ApplicationThread from "./ApplicationThread";

const statuses: ApplicationStatus[] = ["new", "reviewing", "shortlisted", "interview", "declined", "hired"];

export default function ApplicationWorkspace({ applications, currentUserId, firmView }: { applications: Application[]; currentUserId: string; firmView: boolean }) {
    const [items, setItems] = useState(applications);
    const [message, setMessage] = useState("");

    async function changeStatus(id: string, status: ApplicationStatus) {
        setMessage("");
        const response = await fetch(`/api/applications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { setMessage(payload.error ?? "Unable to update status"); return; }
        setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    }

    if (items.length === 0) return <div className="border border-dashed border-line p-10 text-center text-graphite"><p className="font-mono text-xs uppercase tracking-widest">No applications yet.</p><p className="mt-3 text-sm">{firmView ? "Applications to your open listings will appear here." : "Your applications will appear here after you apply to an opportunity."}</p></div>;

    return <div className="space-y-4">{items.map((application) => <article key={application.id} className="surface p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow font-mono text-redline">{firmView ? "APPLICANT" : "APPLICATION"}</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{firmView ? application.applicant?.name ?? "Applicant" : application.job_listing?.title ?? "Opportunity"}</h2><p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-graphite">{firmView ? `${application.job_listing?.title ?? "Opportunity"} · ${application.applicant?.role ?? "profile"}` : `${application.job_listing?.firm_name ?? "Company"} · ${application.status}`}</p></div><div className="flex items-center gap-3">{firmView ? <select value={application.status} onChange={(event) => void changeStatus(application.id, event.target.value as ApplicationStatus)} className="rounded-full border border-line bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink"><option disabled value="">Status</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select> : <span className="rounded-full border border-line bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-graphite">{application.status}</span>}</div></div>{firmView && application.applicant?.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-graphite">{application.applicant.bio}</p>}{application.cover_note && <div className="mt-4 border-l-2 border-redline pl-4 text-sm leading-relaxed text-graphite"><p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-redline">Cover note</p>{application.cover_note}</div>}<div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-graphite">{firmView && (application.cv_url ?? application.applicant?.cv_url) && <a href={application.cv_url ?? application.applicant?.cv_url ?? "#"} target="_blank" rel="noreferrer" className="text-redline hover:text-ink">View CV</a>}<span>Sent {new Date(application.created_at).toLocaleDateString()}</span></div><ApplicationThread applicationId={application.id} currentUserId={currentUserId} /></article>)}{message && <p aria-live="polite" className="font-mono text-[10px] uppercase tracking-widest text-redline">{message}</p>}</div>;
}
