"use client";

import { useState } from "react";
import Link from "next/link";

export default function ApplyButton({ jobListingId, authenticated }: { jobListingId: string; authenticated: boolean }) {
    const [open, setOpen] = useState(false);
    const [coverNote, setCoverNote] = useState("");
    const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setState("saving");
        setMessage("");
        try {
            const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_listing_id: jobListingId, cover_note: coverNote || null }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to submit application");
            setState("success");
            setMessage("Application sent. You can follow up from Applications.");
        } catch (error) {
            setState("error");
            setMessage(error instanceof Error ? error.message : "Unable to submit application");
        }
    }

    if (!authenticated) return <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-ink bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper transition-colors hover:bg-redline">Sign in to apply</Link>;
    if (state === "success") return <div className="max-w-xs border border-redline/50 bg-paper px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-redline">{message}</div>;
    return <div className="flex flex-col items-start gap-3">
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center justify-center rounded-full border border-ink bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper transition-colors hover:bg-redline">{open ? "Close application" : "Apply on ArchiCareer"}</button>
        {open && <form onSubmit={submit} className="w-full max-w-sm border-t border-line pt-3 sm:w-80"><label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-graphite" htmlFor={`cover-note-${jobListingId}`}>Short note <span className="normal-case tracking-normal">(optional)</span></label><textarea id={`cover-note-${jobListingId}`} rows={4} maxLength={2000} value={coverNote} onChange={(event) => setCoverNote(event.target.value)} className="field-input resize-y text-sm" placeholder="Tell the company why this opportunity fits your direction." /><div className="mt-2 flex items-center justify-between gap-3"><p aria-live="polite" className="font-mono text-[10px] uppercase tracking-widest text-redline">{state === "error" ? message : ""}</p><button type="submit" disabled={state === "saving"} className="inline-flex shrink-0 items-center justify-center rounded-full border border-redline bg-redline px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-ink disabled:opacity-60">{state === "saving" ? "Sending..." : "Send application"}</button></div></form>}
    </div>;
}
