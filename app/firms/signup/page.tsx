"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NIGERIAN_STATES } from "@/lib/profile-options";

export default function FirmSignupPage() {
    const [company, setCompany] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("");
    const [website, setWebsite] = useState("");
    const [about, setAbout] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");

    async function continueWithGoogle() {
        setStatus("sending"); setMessage("");
        const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/firms/onboarding` } });
        if (error) { setStatus("error"); setMessage(error.message); }
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!company.trim() || !email.trim()) { setStatus("error"); setMessage("Add your organisation name and work email."); return; }
        if (website.trim()) { try { const url = new URL(website); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { setStatus("error"); setMessage("Enter a valid website beginning with https://."); return; } }
        setStatus("sending"); setMessage("");
        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=/firms/onboarding`;
        const { error, data } = await supabase.auth.signUp({
            email: email.trim(),
            password: crypto.randomUUID(),
            options: { emailRedirectTo: redirectTo, data: { full_name: company.trim(), name: company.trim(), role: "firm", school_or_firm: company.trim(), location: location.trim(), bio: about.trim(), personal_site_url: website.trim() } },
        });
        if (error) { setStatus("error"); setMessage(error.message); return; }
        if (data.session) { window.location.assign("/firms/onboarding"); return; }
        setStatus("sent"); setMessage("Check your work email to verify your organisation account.");
    }

    const input = "field-input mt-2 text-sm";
    const label = "block font-mono text-[10px] uppercase tracking-widest text-graphite";
    return (
        <main className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-paper px-5 py-12 text-ink sm:px-8 sm:py-20">
            <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-sand/60 blur-3xl" />
            <div className="relative mx-auto w-full max-w-3xl">
                <section className="surface p-6 sm:p-10">
                    <div className="mb-8 flex items-start justify-between gap-4 border-b border-line pb-6"><div><p className="eyebrow font-mono text-redline">CREATE A FIRM PROFILE</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Tell us about the practice.</h2></div><Link href="/firms/login" className="font-mono text-[10px] uppercase tracking-widest text-graphite hover:text-redline">Sign in ↗</Link></div>
                    <form className="space-y-5" onSubmit={submit}>
                        <button type="button" onClick={continueWithGoogle} disabled={status === "sending"} className="interactive w-full rounded-full border border-line bg-warm-white px-4 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink hover:border-ink hover:bg-ink hover:text-paper disabled:opacity-60">{status === "sending" ? "Connecting..." : "Continue with Google"}</button>
                        <div className="flex items-center gap-3"><span className="h-px flex-1 bg-line" /><span className="font-mono text-[10px] uppercase tracking-[0.3em] text-graphite">OR</span><span className="h-px flex-1 bg-line" /></div>
                        <div><label className={label}>Organisation name</label><input required value={company} onChange={(event) => setCompany(event.target.value)} className={input} placeholder="Studio or company name" /></div>
                        <div><label className={label}>Work email</label><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={input} placeholder="hello@yourpractice.com" /></div>
                        <div className="grid gap-5 sm:grid-cols-2"><div><label className={label}>State / location</label><select value={location} onChange={(event) => setLocation(event.target.value)} className={input}><option value="">Choose a state</option>{NIGERIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></div><div><label className={label}>Website</label><input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} className={input} placeholder="https://..." /></div></div>
                        <div><label className={label}>What does the organisation do?</label><textarea value={about} onChange={(event) => setAbout(event.target.value)} className={`${input} resize-y`} rows={4} placeholder="A short introduction to your practice, services, or focus." /></div>
                        <button disabled={status === "sending"} className="interactive mt-2 w-full rounded-full border border-ink bg-ink px-4 py-3.5 font-mono text-[11px] uppercase tracking-widest text-paper hover:border-redline hover:bg-redline disabled:opacity-60">{status === "sending" ? "Creating account..." : "Create firm account ↗"}</button>
                        {message && <p aria-live="polite" className={`font-mono text-[10px] uppercase tracking-widest ${status === "error" ? "text-redline" : "text-graphite"}`}>{message}</p>}
                        <p className="text-center text-[11px] leading-relaxed text-graphite">Looking for an individual profile? <Link href="/signup" className="text-ink underline underline-offset-2 hover:text-redline">Create one here</Link>.</p>
                    </form>
                </section>
            </div>
        </main>
    );
}
