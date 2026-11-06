"use client";

import Image from "next/image";
import { useState } from "react";
import { compressImageForUpload } from "@/lib/image-compression";
import { NIGERIAN_ARCHITECTURE_SCHOOLS } from "@/lib/profile-options";
import type { AccountType } from "@/types";
import type { OnboardingDraft } from "./onboarding-types";
import styles from "./onboarding.module.css";

const disciplines = ["Architecture", "Interior Design", "Landscape Architecture", "Civil Engineering", "Structural Engineering", "Construction", "Urban Planning", "3D Visualisation", "Product Design", "Other"];
const academicLevels = ["First year", "Second year", "Third year", "Fourth year", "Fifth year", "Sixth year or above", "Postgraduate", "Other"];
const organisationTypes = ["Architecture Studio", "Architecture Firm", "Interior Design Studio", "Engineering Consultancy", "Construction Company", "Design Consultancy", "Multidisciplinary Practice", "Other"];
const companySizes = ["Just me", "2–5 employees", "6–10 employees", "11–25 employees", "26–50 employees", "51–100 employees", "100+ employees"];
const businessProducts = ["Building Materials", "Manufacturing", "Furniture", "Lighting", "Construction Supplies", "Real Estate", "Technology", "Design Products", "Professional Services"];

function Field({ label, children, optional = false }: { label: string; children: React.ReactNode; optional?: boolean }) {
    return <label className={styles.field}><span className={styles.fieldLabel}>{label}{optional && <small>Optional</small>}</span>{children}</label>;
}

export default function OnboardingIdentityStep({
    accountType,
    name,
    draft,
    onChange,
    photoUrl,
    onPhotoChange,
    onPhotoBusyChange,
}: {
    accountType: AccountType;
    name: string;
    draft: OnboardingDraft;
    onChange: (updates: Partial<OnboardingDraft>) => void;
    photoUrl: string | null;
    onPhotoChange: (url: string | null) => void;
    onPhotoBusyChange: (busy: boolean) => void;
}) {
    const [photoBusy, setPhotoBusy] = useState(false);
    const [photoMessage, setPhotoMessage] = useState("");
    const isIndividual = accountType === "student" || accountType === "professional";
    const photoLabel = isIndividual ? "Profile picture" : "Logo";

    async function uploadPhoto(file: File | undefined) {
        if (!file) return;
        if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) { setPhotoMessage("Choose a JPG, PNG, or WebP image."); return; }
        if (file.size > 8 * 1024 * 1024) { setPhotoMessage("Choose an image smaller than 8 MB."); return; }
        setPhotoBusy(true); onPhotoBusyChange(true); setPhotoMessage("Preparing your image…");
        try {
            const compressed = await compressImageForUpload(file, "avatar");
            const form = new FormData(); form.set("bucket", "avatars"); form.set("file", compressed, compressed.name);
            setPhotoMessage("Uploading…");
            const uploaded = await fetch("/api/storage", { method: "POST", body: form });
            const result = await uploaded.json().catch(() => ({}));
            if (!uploaded.ok || typeof result.url !== "string") throw new Error(result.error ?? "Image upload failed. Try another image.");
            const saved = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar_url: result.url }) });
            const saveResult = await saved.json().catch(() => ({}));
            if (!saved.ok) throw new Error(saveResult.error ?? "The image uploaded but could not be attached to your profile.");
            onPhotoChange(result.url); setPhotoMessage("Image added.");
        } catch (error) {
            setPhotoMessage(error instanceof Error ? error.message : "Image upload failed. Try again.");
        } finally { setPhotoBusy(false); onPhotoBusyChange(false); }
    }

    async function removePhoto() {
        setPhotoBusy(true); onPhotoBusyChange(true); setPhotoMessage("");
        try {
            const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar_url: null }) });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error ?? "We could not remove the image. Try again.");
            onPhotoChange(null); setPhotoMessage("Image removed.");
        } catch (error) { setPhotoMessage(error instanceof Error ? error.message : "We could not remove the image."); }
        finally { setPhotoBusy(false); onPhotoBusyChange(false); }
    }

    return <div className={styles.identityContent}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>02 / ESTABLISH YOUR IDENTITY</p><h2>{accountType === "student" ? "Start with your studies." : accountType === "professional" ? "Put a name to your practice." : accountType === "firm" ? "Tell us about the practice." : "Tell us about your business."}</h2><p>We’ve carried over the details you shared when you joined. Add or adjust what’s missing.</p></div>
        <div className={styles.identityForm}>
            <div className={styles.photoRow}>
                <div className={styles.photoPreview}>{photoUrl ? <Image src={photoUrl} alt={`${photoLabel} preview`} fill sizes="72px" /> : <span>{accountType === "student" ? "＋" : accountType === "professional" ? "＋" : "LOGO"}</span>}</div>
                <div className={styles.photoControls}><p>{photoLabel}<small>Optional · JPG, PNG, WebP</small></p><label className={styles.fileButton}>{photoBusy ? "Working…" : photoUrl ? "Change image" : "Add image"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.target.value = ""; }} /></label>{photoUrl && <button type="button" disabled={photoBusy} onClick={() => void removePhoto()} className={styles.removePhoto}>Remove</button>}</div>
            </div>
            {photoMessage && <p className={photoBusy ? styles.quietMessage : styles.inlineMessage} role="status" aria-live="polite">{photoMessage}</p>}

            {isIndividual && <>
                <div className={styles.twoFields}><Field label="First name"><input value={draft.first_name} onChange={(event) => onChange({ first_name: event.target.value })} autoComplete="given-name" maxLength={80} /></Field><Field label="Last name"><input value={draft.last_name} onChange={(event) => onChange({ last_name: event.target.value })} autoComplete="family-name" maxLength={80} /></Field></div>
                {accountType === "student" && <>
                    <Field label="Institution"><input list="onboarding-institutions" value={draft.institution} onChange={(event) => onChange({ institution: event.target.value })} placeholder="Search or enter your institution" maxLength={180} /><datalist id="onboarding-institutions">{NIGERIAN_ARCHITECTURE_SCHOOLS.map((school) => <option key={school} value={school} />)}</datalist></Field>
                    <div className={styles.twoFields}><Field label="Course or discipline"><input list="onboarding-disciplines" value={draft.discipline} onChange={(event) => onChange({ discipline: event.target.value })} placeholder="e.g. Architecture" maxLength={100} /><datalist id="onboarding-disciplines">{disciplines.filter((item) => item !== "Other").map((item) => <option key={item} value={item} />)}</datalist></Field><Field label="Academic level"><select value={draft.academic_level} onChange={(event) => onChange({ academic_level: event.target.value })}><option value="">Choose your level</option>{academicLevels.map((item) => <option key={item}>{item}</option>)}</select></Field></div>
                    <Field label="Expected graduation year" optional><input type="number" min="2020" max="2100" value={draft.graduation_year} onChange={(event) => onChange({ graduation_year: event.target.value })} placeholder="e.g. 2028" /></Field>
                </>}
                {accountType === "professional" && <>
                    <div className={styles.twoFields}><Field label="Professional title"><input value={draft.professional_title} onChange={(event) => onChange({ professional_title: event.target.value })} placeholder="e.g. Architect, Project Lead" maxLength={120} /></Field><Field label="Primary discipline"><input list="professional-disciplines" value={draft.discipline} onChange={(event) => onChange({ discipline: event.target.value })} placeholder="Choose or enter a discipline" maxLength={100} /><datalist id="professional-disciplines">{disciplines.filter((item) => item !== "Other").map((item) => <option key={item} value={item} />)}</datalist></Field></div>
                    <Field label="Location" optional><input value={draft.location} onChange={(event) => onChange({ location: event.target.value })} placeholder="City or state" maxLength={100} /></Field>
                    <Field label="Years of experience" optional><select value={draft.experience} onChange={(event) => onChange({ experience: event.target.value })}><option value="">Choose a range</option>{["0–2 years", "3–5 years", "6–10 years", "11–15 years", "16+ years"].map((item) => <option key={item}>{item}</option>)}</select></Field>
                    <Field label="Short professional introduction" optional><textarea rows={3} value={draft.bio} onChange={(event) => onChange({ bio: event.target.value })} maxLength={500} placeholder="What do you work on, and what are you interested in?" /></Field>
                </>}
            </>}

            {accountType === "firm" && <>
                <div className={styles.identityName}><span>FIRM NAME</span><strong>{name}</strong><small>Collected during registration</small></div>
                <div className={styles.twoFields}><Field label="Organisation type"><select value={draft.organization_type} onChange={(event) => onChange({ organization_type: event.target.value })}><option value="">Choose a type</option>{organisationTypes.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Company size" optional><select value={draft.company_size} onChange={(event) => onChange({ company_size: event.target.value })}><option value="">Choose size</option>{companySizes.map((item) => <option key={item}>{item}</option>)}</select></Field></div>
                {draft.organization_type === "Other" && <Field label="Organisation type"><input value={draft.organization_type_other} onChange={(event) => onChange({ organization_type_other: event.target.value })} placeholder="Describe your practice type" maxLength={100} /></Field>}
                <div className={styles.twoFields}><Field label="Primary location" optional><input value={draft.location} onChange={(event) => onChange({ location: event.target.value })} placeholder="City or state" maxLength={100} /></Field><Field label="Website" optional><input type="url" value={draft.website} onChange={(event) => onChange({ website: event.target.value })} placeholder="https://yourpractice.com" maxLength={300} /></Field></div>
                <Field label="Year established" optional><input type="number" min="1800" max={new Date().getFullYear()} value={draft.year_established} onChange={(event) => onChange({ year_established: event.target.value })} placeholder="e.g. 2018" /></Field>
                <Field label="Short firm description" optional><textarea rows={3} value={draft.description} onChange={(event) => onChange({ description: event.target.value })} maxLength={700} placeholder="Describe your practice and the work you do." /></Field>
            </>}

            {accountType === "business" && <>
                <div className={styles.identityName}><span>BUSINESS NAME</span><strong>{name}</strong><small>Collected during registration</small></div>
                <Field label="Business category"><input list="business-categories" value={draft.business_category} onChange={(event) => onChange({ business_category: event.target.value })} placeholder="Choose or enter a category" maxLength={120} /><datalist id="business-categories">{["Building Materials", "Manufacturing", "Furniture", "Construction Supplies", "Real Estate", "Technology", "Design Products", "Professional Services"].map((item) => <option key={item} value={item} />)}</datalist></Field>
                <div className={styles.field}><span className={styles.fieldLabel}>Products or services <small>Optional</small></span><div className={styles.choicePills}>{businessProducts.map((item) => { const selected = draft.products_services.includes(item); return <button key={item} type="button" aria-pressed={selected} onClick={() => onChange({ products_services: selected ? draft.products_services.filter((value) => value !== item) : [...draft.products_services, item] })} className={`${styles.choicePill} ${selected ? styles.choiceSelected : ""}`}><span aria-hidden="true">{selected ? "✓" : "+"}</span>{item}</button>; })}</div></div>
                <div className={styles.twoFields}><Field label="Primary location" optional><input value={draft.location} onChange={(event) => onChange({ location: event.target.value })} placeholder="City or state" maxLength={100} /></Field><Field label="Website" optional><input type="url" value={draft.website} onChange={(event) => onChange({ website: event.target.value })} placeholder="https://yourbusiness.com" maxLength={300} /></Field></div>
                <Field label="Short business description" optional><textarea rows={3} value={draft.description} onChange={(event) => onChange({ description: event.target.value })} maxLength={700} placeholder="What does your business offer to the industry?" /></Field>
            </>}
        </div>
    </div>;
}
