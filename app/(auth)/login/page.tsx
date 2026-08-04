"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");

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
        const redirectTo = `${window.location.origin}/auth/callback?next=/profile`;
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

    async function handleGoogleSignIn() {
        setStatus("sending");
        setMessage("");

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=/profile`;
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
        <div className="flex-1 bg-paper text-ink flex items-center justify-center py-12 px-6 relative font-sans selection:bg-redline selection:text-paper">
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <span className="font-mono text-xs text-graphite tracking-widest">A-02 // AUTH</span>
            </div>

            <div className="surface relative z-10 w-full max-w-md p-7 sm:p-9">
                <div className="text-center mb-8 border-b border-line pb-6">
                    <Link href="/" className="inline-flex items-center font-display text-2xl font-bold tracking-tight text-ink hover:text-redline transition-colors">
                        ArchiCareer
                    </Link>
                    <h2 className="mt-4 font-display text-2xl font-normal tracking-tight uppercase text-ink">Sign in to your account</h2>
                    <p className="mt-2 text-xs font-mono uppercase tracking-wider text-graphite">
                        Or{" "}
                        <Link href="/signup" className="text-redline hover:underline font-mono">
                            create a new account
                        </Link>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={status === "sending"}
                        className="interactive w-full flex justify-center rounded-full border border-line bg-warm-white px-4 py-3 font-mono text-xs uppercase tracking-widest text-ink hover:border-ink hover:bg-ink hover:text-paper cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {status === "sending" ? "Connecting..." : "Continue with Google"}
                    </button>

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

                    <button
                        type="submit"
                        disabled={status === "sending"}
                        className="interactive w-full flex justify-center rounded-full border border-ink bg-ink px-4 py-3 font-mono text-xs uppercase tracking-widest text-paper hover:border-redline hover:bg-redline cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {status === "sending" ? "Sending..." : "Send Magic Link"}
                    </button>

                    {message && (
                        <p className={`font-mono text-[10px] uppercase tracking-widest ${status === "error" ? "text-redline" : "text-graphite"}`}>
                            {message}
                        </p>
                    )}
                </form>
            </div>

            <div className="absolute top-0 bottom-0 left-12 w-[1px] bg-line/20 -z-0 pointer-events-none"></div>
            <div className="absolute left-0 right-0 top-12 h-[1px] bg-line/20 -z-0 pointer-events-none"></div>
        </div>
    );
}
