"use client";

import { useState } from "react";

const details: Record<string, { title: string; message: string }> = {
    session: { title: "Your Google account was verified.", message: "We couldn’t finish reading your ArchiCareer session. Retry setup; you should not need to authenticate again if your session is still active." },
    profile: { title: "Your account is signed in.", message: "We couldn’t finish preparing your ArchiCareer profile. Your sign-in is still valid. Retry profile setup in a moment." },
    onboarding: { title: "Your profile is ready.", message: "We couldn’t load your setup status. Retry to restore your onboarding progress or continue to your existing destination." },
};

export default function ProfileRecovery({ reason }: { reason: string }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const copy = details[reason] ?? details.profile;

    async function retry() {
        setBusy(true); setError("");
        try {
            const response = await fetch("/api/auth/recover-profile", { method: "POST" });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (result.accountTypeRequired) {
                    window.location.assign("/join?auth_error=account_type_required");
                    return;
                }
                throw new Error(result.error ?? "Profile setup is still unavailable. Try again shortly.");
            }
            window.location.assign(result.destination ?? "/onboarding");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Profile setup is still unavailable. Try again shortly.");
        } finally { setBusy(false); }
    }

    return <main className="min-h-screen bg-paper px-5 py-16 text-ink sm:px-10"><section className="mx-auto max-w-2xl border-2 border-ink bg-white p-7 sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-redline">ARCHICAREER / ACCOUNT RECOVERY</p>
        <h1 className="mt-5 font-display text-4xl font-bold leading-none tracking-[-0.06em] sm:text-6xl">{copy.title}</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-graphite">{copy.message}</p>
        {error && <p className="mt-5 border-l-4 border-redline bg-redline/5 p-4 text-sm text-redline" role="alert">{error}</p>}
        <div className="mt-8 flex flex-wrap gap-4"><button type="button" onClick={() => void retry()} disabled={busy} className="inline-flex min-h-12 items-center border-2 border-ink bg-ink px-6 font-semibold text-white disabled:opacity-60">{busy ? "Restoring your profile…" : "Retry setup"}</button>{error.includes("session expired") && <a href="/login?next=%2Fonboarding" className="inline-flex min-h-12 items-center border-b-2 border-ink font-semibold">Sign in again</a>}<a href="mailto:hello@archicareer.ng" className="inline-flex min-h-12 items-center border-b-2 border-ink font-semibold">Contact ArchiCareer support</a></div>
    </section></main>;
}
