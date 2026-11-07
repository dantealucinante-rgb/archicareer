"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthBrand from "@/app/components/AuthBrand";
import GoogleAuthButton from "@/app/components/GoogleAuthButton";
import styles from "./sign-in.module.css";

export type SignInAccountType = "student" | "professional" | "firm" | "business";
type Props = { accountType: SignInAccountType; nextPath?: string; callbackError?: string; selectedType?: string };

const content: Record<SignInAccountType, { heading: string; copy: string; register: string; registerHref: string; visual: string; image: string; destination: string }> = {
    student: { heading: "Welcome back.", copy: "Continue building your future in the architecture and built environment industry.", register: "New to ArchiCareer? Create a student account.", registerHref: "/signup?account_type=student", visual: "Your next chapter starts with what you make.", image: "/hero/archicareer-public-plaza.jpg", destination: "/feed" },
    professional: { heading: "Good to have you back.", copy: "Your work, your connections and new opportunities are waiting.", register: "New to ArchiCareer? Create a professional account.", registerHref: "/signup?account_type=professional", visual: "Make your work easier to find.", image: "/hero/archicareer-modern-facade.jpg", destination: "/feed" },
    firm: { heading: "Welcome back to ArchiCareer.", copy: "Manage your firm’s presence, showcase your projects and connect with the people shaping the industry.", register: "New to ArchiCareer? Register your firm.", registerHref: "/firms/signup?account_type=firm", visual: "Bring your practice into the conversation.", image: "/hero/archicareer-cultural-pavilion.jpg", destination: "/firms/onboarding" },
    business: { heading: "Welcome back.", copy: "Reconnect with professionals, showcase what your business offers and grow your industry network.", register: "New to ArchiCareer? Create a business account.", registerHref: "/business/signup?account_type=business", visual: "Find your place in the wider industry.", image: "/hero/archicareer-material-samples.jpg", destination: "/firms/onboarding" },
};
const validTypes = ["student", "professional", "firm", "business"];

function loginHref(type: string) {
    return type === "firm" || type === "business" ? `/firms/login?account_type=${type}` : `/login?account_type=${type === "professional" ? "professional" : "student"}`;
}

function safeNext(value: string | undefined, fallback: string) {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
    try { const url = new URL(value, window.location.origin); return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : fallback; } catch { return fallback; }
}

export default function SignInExperience({ accountType, nextPath, callbackError, selectedType }: Props) {
    const detail = content[accountType];
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordMode, setPasswordMode] = useState(true);
    const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");
    const [showReset, setShowReset] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const supabase = useMemo(() => createClient(), []);
    const callbackMessage = callbackError === "account_type_mismatch"
        ? `This account is registered as a ${selectedType ?? "different"} account. Sign in through the correct account page.`
        : callbackError === "account_type_unavailable" ? "We couldn’t find a supported account profile for this sign-in. Please contact support or return to account selection."
            : callbackError === "cancelled" ? "Google sign-in was cancelled. You can try again whenever you’re ready."
                : callbackError === "missing_code" ? "That sign-in link is incomplete. Request a new one below."
            : callbackError === "authentication_failed" ? "That sign-in link has expired or could not be verified. Request a new one below." : "";
    const correctLoginHref = selectedType && validTypes.includes(selectedType) ? loginHref(selectedType) : "/join";

    async function verifyAndContinue() {
        const response = await fetch("/api/account", { cache: "no-store" });
        if (!response.ok) throw new Error("profile");
        const data = await response.json() as { authenticated?: boolean; profile?: { account_type?: string } | null };
        const actualType = data.profile?.account_type;
        if (!data.authenticated || !actualType || !validTypes.includes(actualType)) throw new Error("profile");
        if (actualType !== accountType) {
            await supabase.auth.signOut({ scope: "local" });
            const target = loginHref(actualType);
            setStatus("error");
            setMessage(`This is a ${actualType} account. Continue to the correct sign-in page.`);
            setMismatchHref(target);
            return;
        }
        window.location.assign(safeNext(nextPath, detail.destination));
    }
    const [mismatchHref, setMismatchHref] = useState("");

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage(""); setMismatchHref(""); setStatus("loading");
        try {
            if (passwordMode) {
                const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
                if (error) {
                    setStatus("error");
                    setMessage(error.code === "email_not_confirmed" ? "Please verify your email address before continuing." : "Your email or password is incorrect. Please check your details and try again.");
                    return;
                }
                await verifyAndContinue();
                return;
            }
            const destination = safeNext(nextPath, detail.destination);
            const callback = new URL("/auth/callback", window.location.origin);
            callback.searchParams.set("next", destination);
            callback.searchParams.set("signin_type", accountType);
            const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: callback.toString() } });
            if (error) throw error;
            setStatus("sent"); setMessage("If your account can receive a sign-in link, you’ll get an email shortly.");
        } catch {
            setStatus("error"); setMessage("We couldn’t connect right now. Please check your internet connection and try again.");
        }
    }

    async function startGoogle() {
        setStatus("loading"); setMessage(""); setMismatchHref("");
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("next", safeNext(nextPath, detail.destination));
        callback.searchParams.set("signin_type", accountType);
        try {
            const cleared = await fetch("/api/auth/google-intent", { method: "DELETE" });
            if (!cleared.ok) throw new Error("Could not clear the previous Google sign-up attempt.");
            const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback.toString() } });
            if (error) throw error;
        } catch { setStatus("error"); setMessage("Google sign-in couldn’t be started. Please try again."); }
    }

    async function resetPassword() {
        if (!email.trim()) { setStatus("error"); setMessage("Enter your email address first."); return; }
        setStatus("loading"); setMessage("");
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("next", `/reset-password?account_type=${accountType}`);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: callback.toString() });
            if (error) throw error;
            setResetSent(true); setStatus("sent"); setMessage("If an account can receive a reset link, you’ll get an email shortly.");
        } catch { setStatus("error"); setMessage("We couldn’t send a reset link. Please try again shortly."); }
    }

    const busy = status === "loading";
    return <main className={styles.page}>
        <header className={styles.mobileHeader}><AuthBrand /><Link href="/" className={styles.homeLink}>ArchiCareer home</Link></header>
        <div className={styles.layout}>
            <aside className={styles.story} style={{ "--signin-image": `url("${detail.image}")` } as React.CSSProperties}>
                <div className={styles.storyTop}><AuthBrand /><div className={styles.roller} aria-label="whatsup, yoooooo, how ya doing"><span className={styles.srOnly}>whatsup, yoooooo, how ya doing</span><span className={styles.rollerWindow} aria-hidden="true"><span className={styles.rollerTrack}><span>whatsup</span><span>yoooooo</span><span>how ya doing</span><span>whatsup</span></span></span></div></div>
                <div className={styles.storyBottom}><p className={styles.statement}>CREATES. CONNECTS. BUILDS.</p><h1>{detail.visual}</h1><p>Work, ideas and people move the industry forward.</p></div>
            </aside>
            <section className={styles.panel} aria-labelledby="signin-heading">
                <div className={styles.formWrap}>
                    <div className={styles.formHeader}><Link href="/" className={styles.desktopHome}>← Back to ArchiCareer</Link><p className={styles.eyebrow}>{accountType === "student" ? "STUDENT ACCESS" : accountType === "professional" ? "PROFESSIONAL ACCESS" : accountType === "firm" ? "FIRM ACCESS" : "BUSINESS ACCESS"}</p><h2 id="signin-heading">{detail.heading}</h2><p className={styles.intro}>{detail.copy}</p></div>
                    {callbackMessage && <div className={styles.alert} role="alert">{callbackMessage} {selectedType && validTypes.includes(selectedType) && <Link href={correctLoginHref}>Open the correct sign-in page</Link>}</div>}
                    <form onSubmit={submit} className={styles.form}>
                        <div className={styles.field}><label htmlFor="signin-email">Email Address</label><input id="signin-email" name="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" /></div>
                        {passwordMode && <div className={styles.field}><label htmlFor="signin-password">Password</label><div className={styles.passwordWrap}><input id="signin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button className={styles.visibility} type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div></div>}
                        <div className={styles.formOptions}><button type="button" className={styles.textButton} onClick={() => { setShowReset((value) => !value); setMessage(""); setResetSent(false); }}>{showReset ? "Close password recovery" : "Forgot password?"}</button><button type="button" className={styles.textButton} onClick={() => { setPasswordMode((value) => !value); setMessage(""); }}>{passwordMode ? "Use email link" : "Use password"}</button></div>
                        {showReset && <div className={styles.resetBox}><p>We’ll email you a secure link to choose a new password.</p><button type="button" onClick={resetPassword} disabled={busy || resetSent}>{busy ? "Sending…" : resetSent ? "Reset link sent" : "Email me a reset link"}</button></div>}
                        {message && <p role={status === "error" ? "alert" : "status"} aria-live="polite" className={status === "error" ? styles.alert : styles.status}>{message}{mismatchHref && <> <Link href={mismatchHref}>Go to that sign-in page</Link></>}</p>}
                        <button type="submit" className={styles.submit} disabled={busy}>{busy ? (passwordMode ? "Signing in…" : "Sending link…") : passwordMode ? "Sign In" : "Send sign-in link"}</button>
                    </form>
                    <div className={styles.separator}><span>OR</span></div>
                    <GoogleAuthButton action="signIn" onClick={startGoogle} disabled={busy} loading={busy} />
                    <p className={styles.register}>{detail.register.includes("? ") ? <>{detail.register.split("? ")[0]}? <Link href={detail.registerHref}>{detail.register.split("? ").slice(1).join("? ")}</Link></> : <Link href={detail.registerHref}>{detail.register}</Link>}</p>
                    <Link href="/" className={styles.mobileHome}>← Return to ArchiCareer</Link>
                </div>
            </section>
        </div>
    </main>;
}
