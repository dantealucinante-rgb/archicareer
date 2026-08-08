"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JobPostForm() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [type, setType] = useState("internship");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
    const [message, setMessage] = useState("");

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatus("saving");
        setMessage("");
        try {
            const response = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    type,
                    description,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to submit posting");
            setTitle(""); setType("internship"); setDescription("");
            setStatus("idle");
            setMessage("Posting submitted.");
            router.refresh();
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Unable to submit posting");
        }
    }

    const input = "block w-full rounded-[2px] border border-line bg-paper px-3 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none";
    const label = "block font-mono text-xs uppercase tracking-wider text-graphite mb-1.5";

    return (
        <form className="mt-6 space-y-4" onSubmit={submit}>
            <p className="border border-dashed border-line p-3 font-mono text-[10px] uppercase tracking-widest text-graphite">Your firm profile name will be used on this listing.</p>
            <div><label className={label}>Role Title</label><input required value={title} onChange={(event) => setTitle(event.target.value)} className={input} /></div>
            <div><label className={label}>Type</label><select value={type} onChange={(event) => setType(event.target.value)} className={input}><option value="internship">Internship</option><option value="job">Job</option><option value="competition">Competition</option></select></div>
            <p className="border border-dashed border-line p-3 font-mono text-[10px] uppercase tracking-widest text-graphite">Applications and conversations stay on ArchiCareer.</p>
            <div><label className={label}>Description</label><textarea required minLength={10} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className={`${input} resize-y`} /></div>
            <div className="flex items-center justify-between gap-3"><p aria-live="polite" className={`font-mono text-[10px] uppercase tracking-widest ${status === "error" ? "text-redline" : "text-graphite"}`}>{message}</p><button type="submit" disabled={status === "saving"} className="inline-flex items-center justify-center rounded-[2px] border border-redline bg-redline px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-redline disabled:opacity-60">{status === "saving" ? "Submitting..." : "Submit Posting"}</button></div>
        </form>
    );
}
