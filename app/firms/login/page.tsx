"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthBrand from "@/app/components/AuthBrand";
import GoogleAuthButton from "@/app/components/GoogleAuthButton";

export default function FirmLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordMode, setPasswordMode] = useState(false);
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");

    async function continueWithGoogle() {
        setStatus("sending"); setMessage("");
        const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/firms/onboarding` } });
        if (error) { setStatus("error"); setMessage(error.message); }
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!email.trim()) { setStatus("error"); setMessage("Enter your work email."); return; }
        setStatus("sending"); setMessage("");
        if (passwordMode) {
            const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
            if (error) { setStatus("error"); setMessage("Email or password is incorrect. Check your details or request a sign-in link."); return; }
            window.location.assign("/firms/onboarding");
            return;
        }
        const { error } = await createClient().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/firms/onboarding` } });
        if (error) { setStatus("error"); setMessage(error.message); return; }
        setStatus("sent"); setMessage("Magic link sent. Check your work email to continue.");
    }

    async function resetPassword() {
        if (!email.trim()) { setStatus("error"); setMessage("Enter your work email first."); return; }
        setStatus("sending"); setMessage("");
        const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error) { setStatus("error"); setMessage("We couldn’t send a reset link. Try again shortly."); return; }
        setStatus("sent"); setMessage("If an account can receive a reset link, you’ll get an email shortly.");
    }

    return (
        <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-paper px-5 py-12 text-ink sm:px-8 sm:py-20">
            <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-sand/60 blur-3xl" />
            <section className="surface relative w-full max-w-md p-7 sm:p-10">
                <AuthBrand />
                <p className="eyebrow font-mono text-redline">FIRM / COMPANY ACCESS</p>
                <h1 className="display-balance mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-5xl">Welcome back to your practice.</h1>
                <p className="mt-4 text-sm leading-relaxed text-graphite">Use your work email to receive a secure sign-in link.</p>
                <form className="mt-8 space-y-5" onSubmit={submit}>
                    <GoogleAuthButton action="signIn" onClick={continueWithGoogle} disabled={status === "sending"} loading={status === "sending"} />
                    <p className="text-center text-xs text-graphite">Google sign-in continues with your firm profile and firm onboarding.</p>
                    <div className="flex items-center gap-3"><span className="h-px flex-1 bg-line" /><span className="font-mono text-[10px] uppercase tracking-[0.3em] text-graphite">OR</span><span className="h-px flex-1 bg-line" /></div>
                    <div><label htmlFor="firm-email" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">Work email</label><input id="firm-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input mt-2 text-sm" placeholder="hello@yourpractice.com" /></div>
                    {passwordMode && <div><label htmlFor="firm-password" className="block font-mono text-[10px] uppercase tracking-widest text-graphite">Password</label><input id="firm-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="field-input mt-2 text-sm" /></div>}
                    <button disabled={status === "sending"} className="interactive w-full rounded-full border border-ink bg-ink px-4 py-3.5 font-mono text-[11px] uppercase tracking-widest text-paper hover:border-redline hover:bg-redline disabled:opacity-60">{status === "sending" ? "Please wait…" : passwordMode ? "Sign in" : "Send sign-in link"}</button>
                    <p className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-center text-xs text-graphite"><button type="button" className="underline underline-offset-2" onClick={() => { setPasswordMode((value) => !value); setMessage(""); }}>{passwordMode ? "Use a sign-in link" : "Use your password"}</button>{passwordMode && <button type="button" className="underline underline-offset-2" onClick={resetPassword}>Forgot password?</button>}</p>
                    {message && <p aria-live="polite" className={`font-mono text-[10px] uppercase tracking-widest ${status === "error" ? "text-redline" : "text-graphite"}`}>{message}</p>}
                </form>
                <div className="mt-8 border-t border-line pt-5 text-center text-[11px] text-graphite"><Link href="/firms/signup" className="text-ink underline underline-offset-2 hover:text-redline">Create a firm profile</Link><span className="mx-2">·</span><Link href="/login" className="text-ink underline underline-offset-2 hover:text-redline">Individual sign in</Link></div>
            </section>
        </main>
    );
}
