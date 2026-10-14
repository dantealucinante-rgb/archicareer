"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthBrand from "@/app/components/AuthBrand";

const roleOptions = [
    { value: "student" as const, number: "01", label: "Student", copy: "Show your work and start building your network." },
    { value: "architect" as const, number: "02", label: "Architect", copy: "Make your practice, skills, and direction visible." },
];

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"student" | "architect">("student");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");

    useLayoutEffect(() => {
        const requestedRole = new URLSearchParams(window.location.search).get("role");
        if (requestedRole === "firm") {
            window.location.replace("/firms/signup");
            return;
        }
        if (requestedRole === "student" || requestedRole === "architect") {
            // The URL is the source of truth after hydration; the initial state remains server-safe.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRole(requestedRole);
        }
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!name.trim() || !email.trim()) {
            setStatus("error");
            setMessage("Enter a name and email address.");
            return;
        }

        setStatus("sending");
        setMessage("");

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/onboarding/about?role=${role}`)}`;
        const { error, data } = await supabase.auth.signUp({
            email: email.trim(),
            password: crypto.randomUUID(),
            options: {
                emailRedirectTo: redirectTo,
                data: {
                    full_name: name.trim(),
                    name: name.trim(),
                    role,
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
            window.location.assign("/onboarding/about");
            return;
        }

        setStatus("sent");
        setMessage("Account created. Check your email to verify and continue.");
    }

    async function handleGoogleSignIn() {
        setStatus("sending");
        setMessage("");

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding/about`;
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
        <div className="flex-1 bg-paper px-5 py-8 font-sans text-ink selection:bg-redline selection:text-paper sm:px-8 sm:py-12">

            <div className="relative mx-auto w-full max-w-6xl">
                <div className="mb-8 flex items-center justify-between sm:mb-12">
                    <AuthBrand />
                    <Link href="/login" className="font-mono text-[10px] uppercase tracking-widest text-graphite transition-colors hover:text-ink">Already a member? Sign in ↗</Link>
                </div>

                <div className="mx-auto max-w-3xl">
                    <section className="rounded-2xl border border-line bg-warm-white p-6 sm:p-8">
                        <div className="mb-7 border-b border-line pb-5">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-redline">Step 1 of 3</p>
                            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">Start your profile</h2>
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
                                            <span className={`mt-3 block text-xs leading-relaxed ${role === option.value ? "text-paper/70" : "text-graphite"}`}>{option.copy}</span>
                                        </button>
                                    ))}
                                    <Link href="/firms/signup" className="interactive rounded-2xl border border-line bg-warm-white p-4 text-left text-ink hover:-translate-y-0.5 hover:border-redline"><span className="font-mono text-[10px] uppercase tracking-widest text-redline">03</span><span className="mt-6 block font-display text-base font-semibold leading-tight">Studio / company</span><span className="mt-3 block text-xs leading-relaxed text-graphite">Create a practice profile and share opportunities.</span></Link>
                                </div>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">Full name</label>
                                    <input id="name" name="name" type="text" required value={name} onChange={(event) => setName(event.target.value)} className="field-input mt-2 text-sm placeholder:text-graphite/40" placeholder="Ekpe Praise" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">Email address</label>
                                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="field-input mt-2 text-sm placeholder:text-graphite/40" placeholder="you@example.com" />
                                </div>
                            </div>

                            <div className="space-y-3 border-t border-line pt-6">
                                <button type="submit" disabled={status === "sending"} className="interactive w-full rounded-full border border-ink bg-ink px-4 py-3.5 font-mono text-[11px] uppercase tracking-widest text-paper hover:border-redline hover:bg-redline disabled:cursor-not-allowed disabled:opacity-70">
                                    {status === "sending" ? "Creating your profile..." : "Create my profile ↗"}
                                </button>
                                <p className="text-center text-xs leading-relaxed text-graphite">No password to remember. We’ll send a secure verification link.</p>
                                <button type="button" onClick={handleGoogleSignIn} disabled={status === "sending"} className="interactive w-full rounded-full border border-line bg-warm-white px-4 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink hover:border-ink hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-70">
                                    {status === "sending" ? "Connecting..." : "Continue with Google"}
                                </button>
                                <p className="text-center text-xs text-graphite">Google sign-in creates an {role === "student" ? "architecture student" : "architect"} profile.</p>
                            </div>

                            {message && <p role={status === "error" ? "alert" : undefined} aria-live="polite" className={`rounded-lg px-3 py-2 text-sm ${status === "error" ? "border border-redline/30 bg-redline/10 text-redline" : "text-graphite"}`}>{status === "error" && <span aria-hidden="true">⚠ </span>}{message}</p>}
                            <p className="text-center text-[11px] leading-relaxed text-graphite">By creating a profile, you agree to our <Link href="/terms" className="text-ink underline underline-offset-2 hover:text-redline">Terms</Link> and <Link href="/privacy" className="text-ink underline underline-offset-2 hover:text-redline">Privacy Policy</Link>.</p>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
