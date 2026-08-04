"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NIGERIAN_STATES } from "@/lib/profile-options";

const roleOptions = [
    { value: "student" as const, number: "01", label: "Student", copy: "Show your work and start building your network." },
    { value: "architect" as const, number: "02", label: "Architect", copy: "Make your practice, skills, and direction visible." },
    { value: "firm" as const, number: "03", label: "Firm or company", copy: "Find people and share the work that needs them." },
];

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [firmLocation, setFirmLocation] = useState("");
    const [firmWebsite, setFirmWebsite] = useState("");
    const [firmAbout, setFirmAbout] = useState("");
    const [role, setRole] = useState<"student" | "architect" | "firm">(() => {
        if (typeof window === "undefined") return "student";
        const requestedRole = new URLSearchParams(window.location.search).get("role");
        return requestedRole === "student" || requestedRole === "architect" || requestedRole === "firm" ? requestedRole : "student";
    });
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!name.trim() || !email.trim()) {
            setStatus("error");
            setMessage("Enter a name and email address.");
            return;
        }

        setStatus("sending");
        setMessage("");

        if (role === "firm" && firmWebsite.trim()) {
            try { const url = new URL(firmWebsite); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { setStatus("error"); setMessage("Enter a valid website beginning with https://."); return; }
        }

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=${role === "firm" ? "/firms/onboarding" : "/onboarding/about"}`;
        const { error, data } = await supabase.auth.signUp({
            email: email.trim(),
            password: crypto.randomUUID(),
            options: {
                emailRedirectTo: redirectTo,
                data: {
                    full_name: name.trim(),
                    name: name.trim(),
                    role,
                    ...(role === "firm" ? { school_or_firm: name.trim(), location: firmLocation.trim(), bio: firmAbout.trim(), personal_site_url: firmWebsite.trim() } : {}),
                },
            },
        });

        if (error) {
            setStatus("error");
            setMessage(error.message);
            return;
        }

        if (data.session) {
            setStatus("sent");
            setMessage("Account created. Taking you to your profile...");
            window.location.assign(role === "firm" ? "/firms/onboarding" : "/onboarding/about");
            return;
        }

        setStatus("sent");
        setMessage("Account created. Check your email to verify and continue.");
    }

    async function handleGoogleSignIn() {
        setStatus("sending");
        setMessage("");

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=${role === "firm" ? "/firms/onboarding" : "/onboarding/about"}`;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo,
            },
        });

        if (error) {
            setStatus("error");
            setMessage(error.message);
            return;
        }
    }

    return (
        <div className="relative flex-1 overflow-hidden bg-paper px-5 py-10 font-sans text-ink selection:bg-redline selection:text-paper sm:px-8 sm:py-16">
            <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-sand/60 blur-3xl" />
            <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-redline/10 blur-3xl" />

            <div className="relative mx-auto w-full max-w-6xl">
                <div className="mb-8 flex items-center justify-between sm:mb-12">
                    <Link href="/" className="font-display text-2xl font-bold tracking-[-0.055em] transition-colors hover:text-redline sm:text-3xl">ArchiCareer</Link>
                    <Link href={role === "firm" ? "/firms/login" : "/login"} className="font-mono text-[10px] uppercase tracking-widest text-graphite transition-colors hover:text-ink">Already a member? Sign in ↗</Link>
                </div>

                <div className="mx-auto max-w-3xl">
                    <section className="surface p-6 sm:p-10">
                        <div className="mb-8 border-b border-line pb-6">
                            <p className="eyebrow font-mono text-redline">CREATE YOUR PROFILE</p>
                            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Start with the basics.</h2>
                            <p className="mt-2 text-sm leading-relaxed text-graphite">Choose your path, then tell us where to reach you.</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="font-mono text-[10px] uppercase tracking-widest text-graphite">I am joining as</label>
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-redline">Required</span>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {roleOptions.map((option) => (
                                        <button key={option.value} type="button" aria-pressed={role === option.value} onClick={() => setRole(option.value)} className={`interactive rounded-2xl border p-4 text-left ${role === option.value ? "border-ink bg-ink text-paper shadow-lg" : "border-line bg-warm-white text-ink hover:-translate-y-0.5 hover:border-redline"}`}>
                                            <span className={`font-mono text-[10px] uppercase tracking-widest ${role === option.value ? "text-sand" : "text-redline"}`}>{option.number}</span>
                                            <span className="mt-6 block font-display text-base font-semibold leading-tight">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-graphite">{roleOptions.find((option) => option.value === role)?.copy}</p>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">{role === "firm" ? "Organisation name" : "Full name"}</label>
                                    <input id="name" name="name" type="text" required value={name} onChange={(event) => setName(event.target.value)} className="field-input mt-2 text-sm placeholder:text-graphite/40" placeholder={role === "firm" ? "Studio or company name" : "Ekpe Praise"} />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">{role === "firm" ? "Work email" : "Email address"}</label>
                                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="field-input mt-2 text-sm placeholder:text-graphite/40" placeholder={role === "firm" ? "hello@yourpractice.com" : "you@example.com"} />
                                </div>
                            </div>

                            {role === "firm" && <div className="sheet-reveal space-y-5 border-t border-line pt-6"><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="firm-location" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">State / location</label><select id="firm-location" value={firmLocation} onChange={(event) => setFirmLocation(event.target.value)} className="field-input mt-2 text-sm"><option value="">Choose a state</option>{NIGERIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></div><div><label htmlFor="firm-website" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">Website</label><input id="firm-website" type="url" value={firmWebsite} onChange={(event) => setFirmWebsite(event.target.value)} className="field-input mt-2 text-sm placeholder:text-graphite/40" placeholder="https://..." /></div></div><div><label htmlFor="firm-about" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">About the organisation</label><textarea id="firm-about" value={firmAbout} onChange={(event) => setFirmAbout(event.target.value)} className="field-input mt-2 resize-y text-sm" rows={4} placeholder="A short introduction to your practice, services, or focus." /></div></div>}

                            <div className="space-y-3 border-t border-line pt-6">
                                <button type="submit" disabled={status === "sending"} className="interactive w-full rounded-full border border-ink bg-ink px-4 py-3.5 font-mono text-[11px] uppercase tracking-widest text-paper hover:border-redline hover:bg-redline disabled:cursor-not-allowed disabled:opacity-70">
                                    {status === "sending" ? "Creating your profile..." : role === "firm" ? "Create firm account ↗" : "Create my profile ↗"}
                                </button>
                                <button type="button" onClick={handleGoogleSignIn} disabled={status === "sending"} className="interactive w-full rounded-full border border-line bg-warm-white px-4 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink hover:border-ink hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-70">
                                    {status === "sending" ? "Connecting..." : "Continue with Google"}
                                </button>
                            </div>

                            {message && <p aria-live="polite" className={`font-mono text-[10px] uppercase tracking-widest ${status === "error" ? "text-redline" : "text-graphite"}`}>{message}</p>}
                            <p className="text-center text-[11px] leading-relaxed text-graphite">By creating a profile, you agree to our <Link href="/terms" className="text-ink underline underline-offset-2 hover:text-redline">Terms</Link> and <Link href="/privacy" className="text-ink underline underline-offset-2 hover:text-redline">Privacy Policy</Link>.</p>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
