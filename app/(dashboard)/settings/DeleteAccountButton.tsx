"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountButton() {
    const router = useRouter();
    const [confirmation, setConfirmation] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState("");

    async function deleteAccount() {
        if (confirmation !== "DELETE") return;
        setDeleting(true); setMessage("");
        const response = await fetch("/api/account", { method: "DELETE" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { setMessage(payload.error ?? "Unable to delete your account."); setDeleting(false); return; }
        await createClient().auth.signOut();
        router.replace("/");
        router.refresh();
    }

    return (
        <section className="mt-12 border-t border-redline/30 pt-8">
            <p className="eyebrow font-mono text-redline">DANGER ZONE</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Delete your account</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-graphite">This permanently removes your profile, portfolio, uploads, and account access. Job listings connected to a firm account are closed and preserved without the account owner.</p>
            <div className="mt-5 max-w-md">
                <label htmlFor="delete-confirmation" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">Type DELETE to confirm</label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row"><input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="field-input text-sm" placeholder="DELETE" autoComplete="off" /><button type="button" onClick={deleteAccount} disabled={confirmation !== "DELETE" || deleting} className="interactive rounded-full border border-redline bg-redline px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-paper hover:border-ink hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40">{deleting ? "Deleting..." : "Delete account"}</button></div>
                {message && <p aria-live="polite" className="mt-3 font-mono text-[10px] uppercase tracking-widest text-redline">{message}</p>}
            </div>
        </section>
    );
}
