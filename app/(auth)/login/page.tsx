"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthBrand from "@/app/components/AuthBrand";
import GoogleAuthButton from "@/app/components/GoogleAuthButton";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordMode, setPasswordMode] = useState(false);
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");
    const [callbackMessage, setCallbackMessage] = useState("");

    useEffect(() => {
        const callbackError = new URLSearchParams(window.location.search).get("error");
        const nextMessage = callbackError === "missing_code" ? "That sign-in link is incomplete. Request a new one below." : callbackError === "authentication_failed" ? "That sign-in link has expired or could not be verified. Request a new one below." : "";
        // This runs only after the browser has access to the callback URL.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCallbackMessage(nextMessage);
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!email.trim()) {
            setStatus("error");
            setMessage("Enter an email address.");
            return;
        }

        setStatus("sending");
        setMessage("");

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=/feed`;
        if (passwordMode) {
            const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (error) { setStatus("error"); setMessage("Email or password is incorrect. Check your details or request a sign-in link."); return; }
            window.location.assign("/feed");
            return;
        }

        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                emailRedirectTo: redirectTo,
            },
        });

        if (error) {
            setStatus("error");
            setMessage(error.message);
            return;
        }

        setStatus("sent");
        setMessage("Magic link sent. Check your email and follow the link to continue.");
    }

    async function handlePasswordReset() {
        if (!email.trim()) { setStatus("error"); setMessage("Enter your email address first."); return; }
        setStatus("sending"); setMessage("");
        const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error) { setStatus("error"); setMessage("We couldn’t send a reset link. Try again shortly."); return; }
        setStatus("sent"); setMessage("If an account can receive a reset link, you’ll get an email shortly.");
    }

    async function handleGoogleSignIn() {
        setStatus("sending");
        setMessage("");

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=/feed`;
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
        <div className="flex-1 bg-paper text-ink flex items-center justify-center px-6 py-10 font-sans selection:bg-redline selection:text-paper">

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-warm-white p-6 sm:p-8">
                <div className="mb-7 border-b border-line pb-5">
                    <AuthBrand />
                    <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">Sign in</h2>
                    <p className="mt-2 text-xs font-mono uppercase tracking-wider text-graphite">New here?{" "}
                        <Link href="/signup" className="text-redline hover:underline font-mono">
                            create a new account
                        </Link>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {callbackMessage && <p role="alert" className="rounded-lg border border-redline/30 bg-redline/10 px-3 py-2 text-sm text-redline">{callbackMessage}</p>}
                    <GoogleAuthButton action="signIn" onClick={handleGoogleSignIn} disabled={status === "sending"} loading={status === "sending"} />
                    <p className="text-center text-xs text-graphite">Google sign-in is for student or architect profiles. Firms should use <Link href="/firms/login" className="text-ink underline underline-offset-2 hover:text-redline">firm sign-in</Link>.</p>

                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-line" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-graphite">OR</span>
                        <span className="h-px flex-1 bg-line" />
                    </div>

                    <div>
                        <label htmlFor="email" className="block font-mono text-xs uppercase tracking-wider text-graphite">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="field-input mt-1.5 text-sm font-mono placeholder:text-graphite/40"
                            placeholder="peacebolu@example.com"
                        />
                    </div>

                    {passwordMode && <div><label htmlFor="password" className="block font-mono text-xs uppercase tracking-wider text-graphite">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="field-input mt-1.5 text-sm" /></div>}

                    <button
                        type="submit"
                        disabled={status === "sending"}
                        className="interactive w-full flex justify-center rounded-full border border-ink bg-ink px-4 py-3 font-mono text-xs uppercase tracking-widest text-paper hover:border-redline hover:bg-redline cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {status === "sending" ? "Please wait…" : passwordMode ? "Sign in" : "Send Magic Link"}
                    </button>
                    <p className="-mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-center text-xs leading-relaxed text-graphite"><button type="button" className="underline underline-offset-2" onClick={() => { setPasswordMode((value) => !value); setMessage(""); }}>{passwordMode ? "Use a sign-in link" : "Use your password"}</button>{passwordMode ? <button type="button" className="underline underline-offset-2" onClick={handlePasswordReset}>Forgot password?</button> : <span>No password? We’ll email a secure link.</span>}</p>

                    {message && (
                        <p role={status === "error" ? "alert" : undefined} className={`rounded-lg px-3 py-2 text-sm ${status === "error" ? "border border-redline/30 bg-redline/10 text-redline" : "text-graphite"}`}>{status === "error" && <span aria-hidden="true">⚠ </span>}{message}</p>
                    )}
                </form>
            </div>

        </div>
    );
}
