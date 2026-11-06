"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthBrand from "@/app/components/AuthBrand";
import styles from "@/app/components/registration.module.css";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [message, setMessage] = useState("");
    const [signInHref, setSignInHref] = useState("/login");

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (password.length < 8) { setStatus("error"); setMessage("Use a password with at least 8 characters."); return; }
        if (password !== confirmation) { setStatus("error"); setMessage("The passwords do not match."); return; }
        setStatus("saving"); setMessage("");
        const { error } = await createClient().auth.updateUser({ password });
        if (error) { setStatus("error"); setMessage("This reset link is invalid or expired. Request a new one from sign in."); return; }
        const requestedType = new URLSearchParams(window.location.search).get("account_type");
        const accountType = ["student", "professional", "firm", "business"].includes(requestedType ?? "") ? requestedType : "student";
        setSignInHref(accountType === "firm" || accountType === "business" ? `/firms/login?account_type=${accountType}` : `/login?account_type=${accountType}`);
        setStatus("saved"); setMessage("Your password has been updated.");
    }

    return <main className={styles.missing}>
        <AuthBrand />
        <p className={styles.formEyebrow}>ACCOUNT ACCESS</p>
        <h1>Choose a new password.</h1>
        <p>Use at least 8 characters. You can then sign in with your password or continue using an email sign-in link.</p>
        <form onSubmit={submit} className={styles.form}>
            <div className={styles.field}><label className={styles.label} htmlFor="new-password">New password</label><input className={styles.input} id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
            <div className={styles.field}><label className={styles.label} htmlFor="new-password-confirm">Confirm new password</label><input className={styles.input} id="new-password-confirm" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
            <button disabled={status === "saving" || status === "saved"} className={styles.submit}>{status === "saving" ? "Updating password…" : status === "saved" ? "Password updated" : "Update password"}</button>
            {message && <p role={status === "error" ? "alert" : "status"} aria-live="polite" className={`${styles.message} ${status === "error" ? styles.error : styles.success}`}>{message}</p>}
            {status === "saved" && <Link href={signInHref}>Continue to sign in</Link>}
        </form>
    </main>;
}
