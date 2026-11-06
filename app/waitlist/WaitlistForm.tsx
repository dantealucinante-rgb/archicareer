"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { WAITLIST_ACCOUNT_TYPES, WAITLIST_ACCOUNT_TYPE_LABELS, WAITLIST_CATEGORIES, WAITLIST_CATEGORY_LABELS } from "@/lib/waitlist-categories";
import styles from "./waitlist.module.css";

type Props = {
    idPrefix: string;
    submitLabel: string;
};

export default function WaitlistForm({ idPrefix, submitLabel }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<"idle" | "success" | "error">("idle");

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting) return;

        const form = event.currentTarget;
        const values = new FormData(form);
        setSubmitting(true);
        setMessage("Sending your details…");
        setResult("idle");

        try {
            const response = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    full_name: values.get("full_name"),
                    email: values.get("email"),
                    account_type: values.get("account_type"),
                    profession_category: values.get("profession_category") || undefined,
                    consent: values.get("consent") === "on",
                    website: values.get("website"),
                }),
            });
            const body = await response.json() as { message?: string; error?: string; code?: string };

            if (!response.ok) {
                if (body.code === "WAITLIST_DUPLICATE") {
                    setMessage("You’re on the list. You’re already registered and we’ll be in touch when early access becomes available.");
                    setResult("success");
                    return;
                }
                setMessage(body.error ?? "We couldn't save your signup just now. Please try again.");
                setResult("error");
                return;
            }

            form.reset();
            setMessage("You’re on the list. Thanks for joining ArchiCareer. We’ll be in touch when early access becomes available.");
            setResult("success");
        } catch {
            setMessage("We couldn't reach the waitlist just now. Check your connection and try again.");
            setResult("error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className={styles.form} onSubmit={submit}>
            <div className={styles.formFields}>
                <div className={styles.field}>
                    <label htmlFor={`${idPrefix}-name`}>Full name</label>
                    <input id={`${idPrefix}-name`} name="full_name" type="text" autoComplete="name" maxLength={100} placeholder="Full name" required disabled={submitting || result === "success"} />
                </div>
                <div className={styles.field}>
                    <label htmlFor={`${idPrefix}-account-type`}>Account type</label>
                    <select id={`${idPrefix}-account-type`} name="account_type" defaultValue="" required disabled={submitting || result === "success"}>
                        <option value="" disabled>Select an account type</option>
                        {WAITLIST_ACCOUNT_TYPES.map((type) => <option key={type} value={type}>{WAITLIST_ACCOUNT_TYPE_LABELS[type]}</option>)}
                    </select>
                </div>
                <div className={`${styles.field} ${styles.emailField}`}>
                    <label htmlFor={`${idPrefix}-email`}>Email address</label>
                    <input id={`${idPrefix}-email`} name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} placeholder="you@example.com" required disabled={submitting || result === "success"} />
                </div>
                <div className={styles.field}>
                    <label htmlFor={`${idPrefix}-category`}>Area of work <span>(optional)</span></label>
                    <select id={`${idPrefix}-category`} name="profession_category" defaultValue="" disabled={submitting || result === "success"}>
                        <option value="">Choose an area</option>
                        {WAITLIST_CATEGORIES.map((category) => <option key={category} value={category}>{WAITLIST_CATEGORY_LABELS[category]}</option>)}
                    </select>
                </div>
                <button className={styles.submitButton} type="submit" disabled={submitting || result === "success"}>
                    <span>{submitting ? "Adding you…" : submitLabel}</span>
                </button>
            </div>

            <div className={styles.formMeta}>
                <label className={styles.consent} htmlFor={`${idPrefix}-consent`}>
                    <input id={`${idPrefix}-consent`} name="consent" type="checkbox" required disabled={submitting || result === "success"} />
                    <span>I agree to receive a launch update from ArchiCareer.</span>
                </label>
                <p className={styles.privacyNote}>Your details are used for the waitlist only. Read our <Link href="/privacy">Privacy Policy</Link>.</p>
            </div>

            <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor={`${idPrefix}-website`}>Leave this field empty</label>
                <input id={`${idPrefix}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <p className={`${styles.formMessage} ${result === "success" ? styles.successMessage : ""} ${result === "error" ? styles.errorMessage : ""}`} role="status" aria-live="polite">
                {result === "success" ? <><strong>You’re on the list.</strong> <span>{message.replace("You’re on the list. ", "")}</span></> : message}
            </p>
        </form>
    );
}
