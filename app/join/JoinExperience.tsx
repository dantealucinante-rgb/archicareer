"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/app/components/BrandLogo";
import styles from "./join.module.css";

type AccountType = "student" | "professional" | "firm" | "business";
type Draft = { accountType: AccountType | null; interests: string[]; custom: string };
const STORAGE_KEY = "archicareer.join.v1";
const initialDraft: Draft = { accountType: null, interests: [], custom: "" };
const accounts: { id: AccountType; title: string; copy: string; tint: string }[] = [
    { id: "student", title: "Student", copy: "Studying architecture, engineering, design, construction or a related discipline.", tint: "blue" },
    { id: "professional", title: "Individual Professional", copy: "Working independently or professionally across the industry.", tint: "coral" },
    { id: "firm", title: "Firm", copy: "A professional practice, studio, consultancy or organisation.", tint: "teal" },
    { id: "business", title: "Business", copy: "A supplier, manufacturer or commercial business serving the built world.", tint: "orange" },
];
const interests = ["Architecture", "Interior Design", "Landscape Architecture", "Structural Engineering", "Civil Engineering", "Construction", "Building", "Contracting", "Urban Planning", "3D Visualisation", "3D Modelling", "Product Design", "Furniture Design", "Material Design", "Project Management", "Real Estate", "Building Materials", "Manufacturing", "Photography", "Graphic Design", "Other"];
const priorities: Record<AccountType, string[]> = {
    student: ["Architecture", "Interior Design", "Structural Engineering", "Civil Engineering", "3D Visualisation", "Landscape Architecture"],
    professional: ["Architecture", "Structural Engineering", "Civil Engineering", "Construction", "Interior Design", "Project Management"],
    firm: ["Architecture", "Construction", "Structural Engineering", "Civil Engineering", "Interior Design", "Project Management"],
    business: ["Building Materials", "Manufacturing", "Furniture Design", "Product Design", "Material Design", "Construction"],
};
const palette: Record<string, string> = { Architecture: "blue", "Interior Design": "coral", "Landscape Architecture": "olive", "Structural Engineering": "neutral", "Civil Engineering": "teal", Construction: "orange", Building: "neutral", Contracting: "coral", "Urban Planning": "purple", "3D Visualisation": "blue", "3D Modelling": "neutral", "Product Design": "teal", "Furniture Design": "orange", "Material Design": "olive", "Project Management": "neutral", "Real Estate": "purple", "Building Materials": "coral", Manufacturing: "teal", Photography: "pink", "Graphic Design": "blue", Other: "neutral" };

export default function JoinExperience() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [draft, setDraft] = useState<Draft>(initialDraft);
    const [message, setMessage] = useState("");
    const selected = useMemo(() => new Set(draft.interests), [draft.interests]);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<Draft>;
                // Restore an external session draft once on mount; this is the source of truth after refresh.
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setDraft({ accountType: accounts.some((item) => item.id === parsed.accountType) ? parsed.accountType! : null, interests: interests.filter((item) => Array.isArray(parsed.interests) && parsed.interests.includes(item)), custom: typeof parsed.custom === "string" ? parsed.custom.slice(0, 120) : "" });
            }
            if (new URLSearchParams(window.location.search).get("step") === "interests") setStep(2);
            if (new URLSearchParams(window.location.search).get("auth_error") === "account_type_required") {
                setMessage("Your Google account is signed in, but we need you to choose an ArchiCareer account type before setting up your profile.");
            }
        } catch { /* Continue with a fresh draft if storage is unavailable. */ }
    }, []);

    function save(next: Draft) {
        setDraft(next);
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* The in-memory selection remains usable. */ }
    }

    function toggleInterest(value: string) {
        const next = selected.has(value) ? draft.interests.filter((item) => item !== value) : interests.filter((item) => item === value || selected.has(item));
        save({ ...draft, interests: next });
        setMessage("");
    }

    function continueToSignup() {
        if (!draft.accountType) { setStep(1); setMessage("Choose an account type to continue."); return; }
        if (draft.interests.includes("Other") && !draft.custom.trim()) { setMessage("Describe your profession or business to continue."); return; }
        const next = { account_type: draft.accountType, interests: draft.interests, interest_other: draft.interests.includes("Other") ? draft.custom.trim() : "" };
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* The signup route can still proceed without storage. */ }
        const query = new URLSearchParams({ account_type: draft.accountType, onboarding: JSON.stringify(next) });
        const route = draft.accountType === "firm" ? "/firms/signup" : draft.accountType === "business" ? "/business/signup" : "/signup";
        router.push(`${route}?${query.toString()}`);
    }

    const orderedInterests = draft.accountType ? [...priorities[draft.accountType], ...interests.filter((item) => !priorities[draft.accountType!].includes(item))] : interests;

    return <main className={styles.page}>
        <header className={styles.header}>
            <Link href="/" aria-label="ArchiCareer home"><BrandLogo className={styles.logo} /></Link>
            <div className={styles.headerActions}><Link href={draft.accountType === "firm" || draft.accountType === "business" ? `/firms/login?account_type=${draft.accountType}` : `/login?account_type=${draft.accountType === "professional" ? "professional" : "student"}`}>Already a member? <strong>Sign in</strong></Link><span className={styles.brandLine}>CREATES. CONNECTS. BUILDS.</span></div>
        </header>
        <div className={styles.content}>
            <div className={styles.progress} role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step}><span className={step === 1 ? styles.progressActive : styles.progressDone} /><span className={step === 2 ? styles.progressActive : ""} /></div>
            {step === 1 ? <section aria-labelledby="join-title">
                <p className={styles.eyebrow}>Make your place here</p>
                <h1 id="join-title">How are you joining ArchiCareer?</h1>
                <p className={styles.lede}>Tell us a little about yourself so we can create the right experience for you.</p>
                <fieldset className={styles.accountGrid}>
                    <legend className={styles.visuallyHidden}>Choose one account type</legend>
                    {accounts.map((account) => <label key={account.id} className={`${styles.account} ${styles[`account_${account.tint}`]} ${draft.accountType === account.id ? styles.accountSelected : ""}`}>
                        <input className={styles.radioInput} type="radio" name="account-type" value={account.id} checked={draft.accountType === account.id} onChange={() => { save({ ...draft, accountType: account.id }); setMessage(""); }} />
                        <span className={styles.accountMark} aria-hidden="true">{draft.accountType === account.id ? "✓" : "＋"}</span><span className={styles.accountTitle}>{account.title}</span><span className={styles.accountCopy}>{account.copy}</span>
                    </label>)}
                </fieldset>
            </section> : <section aria-labelledby="interest-title">
                <button type="button" className={styles.backLink} onClick={() => { setStep(1); setMessage(""); }}>← <span>Back to account type</span></button>
                <p className={styles.eyebrow}>Your corner of the industry</p>
                <h1 id="interest-title">What best describes what you do?</h1>
                <p className={styles.lede}>Select all that apply. Choose the areas that reflect your work, interests or specialisation.</p>
                <div className={styles.pills} role="group" aria-label="Professional interests">
                    {orderedInterests.map((interest) => <button type="button" key={interest} aria-pressed={selected.has(interest)} onClick={() => toggleInterest(interest)} className={`${styles.pill} ${styles[`pill_${palette[interest]}`]} ${selected.has(interest) ? styles.pillSelected : ""}`}>
                        {selected.has(interest) && <span className={styles.check} aria-hidden="true">✓</span>}{interest}
                    </button>)}
                </div>
                {selected.has("Other") && <div className={styles.otherField}><label htmlFor="interest-other">What do you do?</label><textarea id="interest-other" value={draft.custom} onChange={(event) => save({ ...draft, custom: event.target.value.slice(0, 120) })} maxLength={120} rows={3} placeholder="Tell us your profession, speciality or type of business…" aria-describedby="other-hint" /><span id="other-hint">Up to 120 characters</span></div>}
                <p className={styles.skipNote}>You can skip interests and add them to your profile later.</p>
            </section>}
            <div className={styles.footer}>
                {step === 1 ? <Link href="/" className={styles.backLink}>← <span>Back to ArchiCareer</span></Link> : <span className={styles.stepNote}>{draft.interests.length ? `${draft.interests.length} selected` : "Interests are optional"}</span>}
                <button type="button" className={styles.continue} disabled={step === 1 && !draft.accountType} onClick={() => { if (step === 1) { setStep(2); setMessage(""); window.history.replaceState(null, "", "/join?step=interests"); } else continueToSignup(); }}>{step === 1 ? "Continue" : "Continue to sign up"}<span aria-hidden="true">→</span></button>
            </div>
            {message && <p className={styles.message} role="alert">{message}</p>}
            <p className={styles.terms}>By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        </div>
    </main>;
}
