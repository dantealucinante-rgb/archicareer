"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PortfolioEditor from "@/app/(dashboard)/profile/PortfolioEditor";
import type { AccountType, PortfolioItem } from "@/types";
import OnboardingConnectionsStep from "./OnboardingConnectionsStep";
import OnboardingIdentityStep from "./OnboardingIdentityStep";
import OnboardingInterestsStep from "./OnboardingInterestsStep";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStepVisual from "./OnboardingStepVisual";
import OnboardingWelcomeStep from "./OnboardingWelcomeStep";
import { getStages, initialDraft, type OnboardingDraft } from "./onboarding-types";
import styles from "./onboarding.module.css";

type Props = {
    accountType: AccountType;
    profile: { id: string; user_id: string; name: string; slug: string; role: "student" | "architect" | "firm"; school_or_firm: string | null; bio: string | null; location: string | null; personal_site_url: string | null; avatar_url: string | null };
    onboarding: { step: number; data: unknown; skippedSteps: string[]; interests: string[]; interestOther: string };
    registrationDetails: unknown;
    initialProjects: PortfolioItem[];
    destination: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

async function responseError(response: Response, fallback: string) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload.error ?? fallback), { status: response.status });
    return payload;
}

export default function OnboardingExperience({ accountType, profile, onboarding, registrationDetails, initialProjects, destination }: Props) {
    const stages = useMemo(() => getStages(accountType), [accountType]);
    const [step, setStep] = useState(onboarding.step);
    const [draft, setDraft] = useState<OnboardingDraft>(() => initialDraft(accountType, profile, onboarding.data, registrationDetails));
    const [interests, setInterests] = useState(onboarding.interests);
    const [interestOther, setInterestOther] = useState(onboarding.interestOther);
    const [profileName, setProfileName] = useState(profile.name);
    const [photoUrl, setPhotoUrl] = useState(profile.avatar_url);
    const [projectItems, setProjectItems] = useState(initialProjects);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [photoBusy, setPhotoBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const queue = useRef<Promise<void>>(Promise.resolve());

    const patchProgress = useCallback((body: Record<string, unknown>) => {
        setSaveStatus("saving");
        const request = queue.current.catch(() => undefined).then(async () => {
            const response = await fetch("/api/onboarding", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                keepalive: true,
            });
            const payload = await responseError(response, "Setup could not be saved. Try again.");
            setSaveStatus("saved");
            return payload;
        }).catch((error: unknown) => {
            setSaveStatus("error");
            throw error;
        });
        queue.current = request.then(() => undefined, () => undefined);
        return request;
    }, []);

    useEffect(() => {
        if (step !== 1 && step !== 2) return;
        const timer = window.setTimeout(() => {
            const body = step === 1 ? { data: draft } : { interests, interest_other: interestOther };
            void patchProgress(body).catch(() => undefined);
        }, 850);
        return () => window.clearTimeout(timer);
    }, [draft, interestOther, interests, patchProgress, step]);

    const projectItemsChanged = useCallback((items: PortfolioItem[]) => setProjectItems(items), []);
    const currentIndex = Math.max(0, stages.findIndex((stage) => stage.id === step));
    const displayName = (accountType === "student" || accountType === "professional")
        ? `${draft.first_name.trim()} ${draft.last_name.trim()}`.trim()
        : profileName;

    function updateDraft(updates: Partial<OnboardingDraft>) {
        setDraft((current) => ({ ...current, ...updates }));
        setErrorMessage("");
    }

    async function savePublicIdentity() {
        const newName = (accountType === "student" || accountType === "professional")
            ? `${draft.first_name.trim()} ${draft.last_name.trim()}`.trim()
            : draft.organization_name.trim();
        const body: Record<string, unknown> = { name: newName };
        if (accountType === "student") {
            body.school_or_firm = draft.institution.trim();
        } else if (accountType === "professional") {
            body.school_or_firm = draft.professional_title.trim();
            body.location = draft.location.trim() || null;
            body.bio = draft.bio.trim() || null;
        } else {
            body.name = newName;
            body.location = draft.location.trim() || null;
            body.bio = draft.description.trim() || null;
            body.personal_site_url = draft.website.trim() || null;
        }
        const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const payload = await responseError(response, "Your profile details could not be saved.");
        if (typeof payload.profile?.name === "string") setProfileName(payload.profile.name);
    }

    function identityError() {
        if (accountType === "student") {
            if (!draft.first_name.trim() || !draft.last_name.trim()) return "Add your first and last name.";
            if (!draft.institution.trim()) return "Add your institution. You can type it if it is not listed.";
            if (!draft.discipline.trim()) return "Add your course or discipline.";
            if (!draft.academic_level) return "Choose your current academic level.";
        }
        if (accountType === "professional") {
            if (!draft.first_name.trim() || !draft.last_name.trim()) return "Add your first and last name.";
            if (!draft.professional_title.trim()) return "Add your professional title.";
            if (!draft.discipline.trim()) return "Add your primary discipline.";
        }
        if (accountType === "firm" && !draft.organization_type) return "Choose your organisation type.";
        if ((accountType === "firm" || accountType === "business") && !draft.organization_name.trim()) return `Add your ${accountType === "firm" ? "firm" : "business"} name.`;
        if (accountType === "firm" && draft.organization_type === "Other" && !draft.organization_type_other.trim()) return "Describe your organisation type.";
        if (accountType === "business" && !draft.business_category.trim()) return "Add a business category.";
        if (draft.website.trim()) {
            try { const url = new URL(draft.website); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); }
            catch { return "Enter a website starting with http:// or https://."; }
        }
        return "";
    }

    async function continueStep() {
        if (busy || photoBusy) return;
        setBusy(true); setErrorMessage("");
        try {
            if (step === 0) {
                await patchProgress({ step: 1 }); setStep(1);
            } else if (step === 1) {
                const validationError = identityError();
                if (validationError) throw new Error(validationError);
                await patchProgress({ data: draft });
                await savePublicIdentity();
                await patchProgress({ data: draft, step: 2 }); setStep(2);
            } else if (step === 2) {
                if (interests.length === 0) throw new Error("Choose at least one area that reflects your work or interests.");
                if (interests.includes("Other") && !interestOther.trim()) throw new Error("Describe the other interest you selected.");
                const next = accountType === "business" ? 4 : 3;
                await patchProgress({ interests, interest_other: interestOther, step: next }); setStep(next);
            } else if (step === 3) {
                await patchProgress({ step: 4 }); setStep(4);
            } else if (step === 4) {
                await patchProgress({ step: 5 }); setStep(5);
            } else if (step === 5) {
                await patchProgress({ complete: true });
                window.location.assign(destination);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "We could not continue. Your progress is saved; try again.");
        } finally { setBusy(false); }
    }

    async function skipOptional() {
        if (busy || (step !== 3 && step !== 4)) return;
        setBusy(true); setErrorMessage("");
        try {
            const skip = step === 3 ? "project" : "connections";
            const next = step === 3 ? 4 : 5;
            await patchProgress({ skip }); setStep(next);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "We could not save that choice. Try again.");
        } finally { setBusy(false); }
    }

    async function goBack() {
        if (busy || currentIndex <= 0) return;
        const previous = stages[currentIndex - 1];
        if (!previous) return;
        setBusy(true); setErrorMessage("");
        try { await patchProgress({ step: previous.id }); setStep(previous.id); }
        catch (error) { setErrorMessage(error instanceof Error ? error.message : "We could not save your progress. Try again."); }
        finally { setBusy(false); }
    }

    async function retrySave() {
        setErrorMessage("");
        const body = step === 1 ? { data: draft } : step === 2 ? { interests, interest_other: interestOther } : { step };
        try { await patchProgress(body); }
        catch (error) { setErrorMessage(error instanceof Error ? error.message : "We could not save your progress."); }
    }

    const continueLabel = step === 0 ? "Let’s Get Started" : step === 1 ? "Continue to interests" : step === 2 ? accountType === "business" ? "Continue to people" : "Continue to your work" : step === 3 ? "Continue to people" : step === 4 ? "Finish setup" : "Enter ArchiCareer";
    const isImmersive = step === 0 || step === 5;
    const visualStage = step === 1 ? "identity" : step === 2 ? "interests" : step === 3 ? "project" : "connections";

    return <main className={styles.page}>
        <OnboardingProgress stages={stages} currentStep={step} saveStatus={saveStatus} />
        <div className={styles.main}>
            <div className={styles.stageAnimation} key={step}>
                {isImmersive ? <OnboardingWelcomeStep ready={step === 5} accountType={accountType} name={displayName || profile.name} avatarUrl={photoUrl} draft={draft} interests={interests} projectCount={projectItems.length} /> : <div className={styles.setupLayout}>
                    <OnboardingStepVisual accountType={accountType} stage={visualStage} />
                    <section className={styles.stepContent} aria-live="polite">
                        {step === 1 && <OnboardingIdentityStep accountType={accountType} draft={draft} onChange={updateDraft} photoUrl={photoUrl} onPhotoChange={setPhotoUrl} onPhotoBusyChange={setPhotoBusy} />}
                        {step === 2 && <OnboardingInterestsStep interests={interests} other={interestOther} onChange={(nextInterests, nextOther) => { setInterests(nextInterests); setInterestOther(nextOther); setErrorMessage(""); }} />}
                        {step === 3 && <div className={styles.projectContent}><div className={styles.sectionHeading}><p className={styles.sectionKicker}>04 / YOUR FIRST PROJECT · OPTIONAL</p><h2>Your work deserves to be seen.</h2><p>Give people a glimpse of what you create. Add a first project to start building your presence on ArchiCareer.</p></div><PortfolioEditor initialItems={projectItems} variant={accountType === "firm" ? "firm" : "individual"} onItemsChange={projectItemsChanged} /></div>}
                        {step === 4 && <OnboardingConnectionsStep />}
                    </section>
                </div>}
            </div>

            <nav className={styles.navigation} aria-label="Setup controls">
                <div>{currentIndex > 0 && <button type="button" className={styles.backButton} onClick={() => void goBack()} disabled={busy}>← Back</button>}</div>
                <div className={styles.navigationActions}>
                    {(step === 3 || step === 4) && <button type="button" className={styles.skipButton} onClick={() => void skipOptional()} disabled={busy}>Skip for now</button>}
                    <button type="button" className={styles.continueButton} onClick={() => void continueStep()} disabled={busy || photoBusy}>{busy ? "Saving…" : continueLabel}<span aria-hidden="true">{busy ? "" : " →"}</span></button>
                </div>
            </nav>
            {errorMessage && <p className={styles.inlineMessage} role="alert">{errorMessage}{saveStatus === "error" && <button type="button" onClick={() => void retrySave()} className={styles.saveRetry}>Retry save</button>}{(errorMessage.includes("Sign in") || errorMessage.includes("session")) && <> <Link href="/login?next=%2Fonboarding" className={styles.inlineAction}>Sign in again</Link></>}</p>}
        </div>
    </main>;
}
