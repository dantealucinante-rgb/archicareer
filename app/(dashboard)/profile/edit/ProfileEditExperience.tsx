"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Field from "@/app/components/editorial/Field";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import { useUnsavedChanges } from "@/app/components/editorial/useUnsavedChanges";
import { compressImageForUpload } from "@/lib/image-compression";
import { ARCHITECTURE_SOFTWARE, NIGERIAN_ARCHITECTURE_SCHOOLS, NIGERIAN_STATES } from "@/lib/profile-options";
import { PROFESSIONAL_INTEREST_OPTIONS } from "@/lib/professional-interests";
import type { AffiliationEntry, EducationEntry, ExperienceEntry, Profile } from "@/types";
import { ChipAdder, EntryCard, newId } from "./fields";
import styles from "./edit.module.css";

type SectionId = "identity" | "expertise" | "experience" | "education" | "affiliations" | "links" | "privacy";
type SaveState = "idle" | "saving" | "saved" | "error";

type SocialRow = { label: string; url: string };

type Draft = {
    name: string;
    slug: string;
    school_or_firm: string;
    location: string;
    bio: string;
    avatar_url: string;
    software_proficiency: string[];
    expertise: string[];
    professional_interests: string[];
    professional_interest_other: string;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    affiliations: AffiliationEntry[];
    instagram_url: string;
    personal_site_url: string;
    linkedin_url: string;
    social_links: SocialRow[];
    cv_url: string;
    search_indexable: boolean;
    marketing_emails: boolean;
};

const SECTION_KEYS: Record<SectionId, Array<keyof Draft>> = {
    identity: ["name", "slug", "school_or_firm", "location", "bio", "avatar_url"],
    expertise: ["software_proficiency", "expertise", "professional_interests", "professional_interest_other"],
    experience: ["experience"],
    education: ["education"],
    affiliations: ["affiliations"],
    links: ["instagram_url", "personal_site_url", "linkedin_url", "social_links", "cv_url"],
    privacy: ["search_indexable", "marketing_emails"],
};

const DETAIL_KEYS = new Set<keyof Draft>(["experience", "education", "affiliations", "expertise"]);

const SECTIONS: Array<{ id: SectionId; label: string; title: string; note: string }> = [
    { id: "identity", label: "Identity", title: "Identity", note: "How your name, role and introduction appear at the top of your profile." },
    { id: "expertise", label: "Expertise", title: "Expertise and skills", note: "The areas you work in and the tools you use." },
    { id: "experience", label: "Experience", title: "Experience", note: "Roles and practices you have worked with." },
    { id: "education", label: "Education", title: "Education", note: "Where you studied and what you qualified with." },
    { id: "affiliations", label: "Affiliations", title: "Affiliations", note: "Professional bodies, studios and organisations you are part of." },
    { id: "links", label: "Links", title: "Links and files", note: "Where people can find you and your CV." },
    { id: "privacy", label: "Privacy", title: "Privacy", note: "Control how your profile is discovered and contacted." },
];

function toDraft(profile: Profile, interests: string[], interestOther: string): Draft {
    const details = profile.details ?? {};
    return {
        name: profile.name ?? "",
        slug: profile.slug ?? "",
        school_or_firm: profile.school_or_firm ?? "",
        location: profile.location ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
        software_proficiency: profile.software_proficiency ?? [],
        expertise: details.expertise ?? [],
        professional_interests: interests,
        professional_interest_other: interestOther,
        experience: details.experience ?? [],
        education: details.education ?? [],
        affiliations: details.affiliations ?? [],
        instagram_url: profile.instagram_url ?? "",
        personal_site_url: profile.personal_site_url ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        social_links: Object.entries(profile.social_links ?? {}).map(([label, url]) => ({ label, url })),
        cv_url: profile.cv_url ?? "",
        search_indexable: profile.search_indexable,
        marketing_emails: profile.marketing_emails,
    };
}

function nullable(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export default function ProfileEditExperience({ profile, interests, interestOther }: { profile: Profile; interests: string[]; interestOther: string }) {
    const router = useRouter();
    const initial = useMemo(() => toDraft(profile, interests, interestOther), [profile, interests, interestOther]);
    const [draft, setDraft] = useState<Draft>(initial);
    const [baseline, setBaseline] = useState<Draft>(initial);
    const [editing, setEditing] = useState<SectionId | null>(null);
    const [status, setStatus] = useState<Record<SectionId, SaveState>>({} as Record<SectionId, SaveState>);
    const [errors, setErrors] = useState<Record<SectionId, string | null>>({} as Record<SectionId, string | null>);
    const [uploading, setUploading] = useState<"avatar" | "cv" | null>(null);

    const dirtySections = SECTIONS.filter(({ id }) => SECTION_KEYS[id].some((key) => JSON.stringify(draft[key]) !== JSON.stringify(baseline[key])));
    useUnsavedChanges(dirtySections.length > 0);

    function patch(update: Partial<Draft>) {
        setDraft((current) => ({ ...current, ...update }));
    }

    function setSectionStatus(id: SectionId, state: SaveState, error: string | null = null) {
        setStatus((current) => ({ ...current, [id]: state }));
        setErrors((current) => ({ ...current, [id]: error }));
    }

    function cancel(id: SectionId) {
        const restored: Partial<Draft> = {};
        for (const key of SECTION_KEYS[id]) {
            (restored as Record<string, unknown>)[key] = baseline[key];
        }
        patch(restored);
        setEditing(null);
        setSectionStatus(id, "idle");
    }

    async function save(id: SectionId) {
        const payload: Record<string, unknown> = {};
        let includesDetails = false;

        for (const key of SECTION_KEYS[id]) {
            if (DETAIL_KEYS.has(key)) {
                includesDetails = true;
                continue;
            }
            if (key === "social_links") {
                payload.social_links = Object.fromEntries(
                    draft.social_links
                        .map((row) => [row.label.trim(), row.url.trim()] as const)
                        .filter(([label, url]) => label && url),
                );
                continue;
            }
            if (key === "professional_interests") {
                payload.professional_interests = draft.professional_interests;
                payload.professional_interest_other = draft.professional_interest_other;
                continue;
            }
            if (key === "professional_interest_other") continue;
            if (key === "search_indexable" || key === "marketing_emails") {
                payload[key] = draft[key];
                continue;
            }
            if (key === "software_proficiency" || key === "expertise") {
                payload[key] = draft[key];
                continue;
            }
            payload[key] = nullable(String(draft[key] ?? ""));
        }

        if (includesDetails) {
            payload.details = {
                education: draft.education,
                experience: draft.experience,
                affiliations: draft.affiliations,
                expertise: draft.expertise,
            };
        }

        if (id === "identity" && !draft.name.trim()) {
            setSectionStatus(id, "error", "Your name is required.");
            return;
        }

        setSectionStatus(id, "saving");
        try {
            const response = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await response.json().catch(() => ({})) as { error?: string };
            if (!response.ok) throw new Error(result.error ?? "That didn't save. Try again.");

            setBaseline((current) => {
                const next = { ...current };
                for (const key of SECTION_KEYS[id]) {
                    (next as Record<string, unknown>)[key] = draft[key];
                }
                return next;
            });
            setSectionStatus(id, "saved");
            setEditing(null);
            router.refresh();
        } catch (error) {
            setSectionStatus(id, "error", error instanceof Error ? error.message : "That didn't save. Try again.");
        }
    }

    async function uploadAvatar(file: File) {
        setUploading("avatar");
        setSectionStatus("identity", "idle");
        try {
            const compressed = await compressImageForUpload(file, "avatar");
            const formData = new FormData();
            formData.set("bucket", "avatars");
            formData.set("file", compressed, compressed.name || "avatar.webp");
            const response = await fetch("/api/storage", { method: "POST", body: formData });
            const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
            if (!response.ok || !result.url) throw new Error(result.error ?? "Unable to upload that image.");
            patch({ avatar_url: result.url });
        } catch (error) {
            setSectionStatus("identity", "error", error instanceof Error ? error.message : "Unable to upload that image.");
        } finally {
            setUploading(null);
        }
    }

    async function uploadCv(file: File) {
        setUploading("cv");
        setSectionStatus("links", "idle");
        try {
            if (file.type !== "application/pdf") throw new Error("Your CV must be a PDF file.");
            const formData = new FormData();
            formData.set("bucket", "cv-documents");
            formData.set("file", file, "resume.pdf");
            const response = await fetch("/api/storage", { method: "POST", body: formData });
            const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
            if (!response.ok || !result.url) throw new Error(result.error ?? "Unable to upload that file.");
            patch({ cv_url: result.url });
        } catch (error) {
            setSectionStatus("links", "error", error instanceof Error ? error.message : "Unable to upload that file.");
        } finally {
            setUploading(null);
        }
    }

    const isOrganisation = profile.account_type === "firm" || profile.account_type === "business";
    const affiliationLabel = profile.account_type === "student" ? "School" : isOrganisation ? "Organisation" : "Practice";

    return <>
        <header className={styles.head}>
            <div className={styles.headCopy}>
                <h1 className={editorial.pageTitle}>Edit your profile</h1>
                <p className={editorial.lede}>
                    Each section saves on its own. Changes appear on your public profile as soon as you save them.
                </p>
            </div>
            <div className={editorial.pillRow}>
                <Pill href={`/p/${profile.slug}`} variant="ink">View public profile ↗</Pill>
                <Pill href="/profile/projects" variant="quiet">Manage projects</Pill>
            </div>
        </header>

        <nav className={styles.nav} aria-label="Profile sections">
            {SECTIONS.map(({ id, label }) => <a key={id} className={styles.navLink} href={`#${id}`}>
                {label}
                {dirtySections.some((section) => section.id === id) && <span aria-label=" (unsaved changes)" style={{ marginLeft: 6 }}>•</span>}
            </a>)}
        </nav>

        {dirtySections.length > 0 && <p className={editorial.meta} style={{ paddingTop: 16 }} role="status">
            You have unsaved changes in {dirtySections.map((section) => section.label).join(", ")}.
        </p>}

        <Section
            id="identity"
            title="Identity"
            note="How your name, role and introduction appear at the top of your profile."
            editing={editing === "identity"}
            dirty={dirtySections.some((section) => section.id === "identity")}
            status={status.identity ?? "idle"}
            error={errors.identity}
            onEdit={() => setEditing("identity")}
            onSave={() => void save("identity")}
            onCancel={() => cancel("identity")}
            summary={<div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Name</span>
                    <span className={styles.summaryValue}>{draft.name || <span className={styles.summaryEmpty}>Not set</span>}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>{affiliationLabel}</span>
                    <span className={styles.summaryValue}>{draft.school_or_firm || <span className={styles.summaryEmpty}>Not set</span>}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Location</span>
                    <span className={styles.summaryValue}>{draft.location || <span className={styles.summaryEmpty}>Not set</span>}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Introduction</span>
                    <span className={styles.summaryValue}>{draft.bio || <span className={styles.summaryEmpty}>No introduction yet</span>}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Profile address</span>
                    <span className={styles.summaryValue}>/p/{draft.slug || "…"}</span>
                </div>
            </div>}
        >
            <div className={styles.mediaRow}>
                {draft.avatar_url
                    ? <Image src={draft.avatar_url} alt="" width={96} height={96} className={styles.avatarPreview} unoptimized />
                    : <span className={styles.avatarPreview} aria-hidden="true" style={{ display: "grid", placeContent: "center", background: "var(--paper)", fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>No photo</span>}
                <div className={styles.mediaActions}>
                    <label className={editorial.fieldLabel} htmlFor="identity-avatar">{isOrganisation ? "Logo" : "Profile photo"}</label>
                    <input
                        id="identity-avatar"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className={styles.fileInput}
                        disabled={uploading === "avatar"}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadAvatar(file);
                            event.target.value = "";
                        }}
                    />
                    <p className={editorial.fieldHint}>JPG, PNG or WebP · up to 2 MB. {uploading === "avatar" ? "Uploading…" : ""}</p>
                    {draft.avatar_url && <Pill size="small" variant="quiet" onClick={() => patch({ avatar_url: "" })}>Remove photo</Pill>}
                </div>
            </div>

            <div className={editorial.fieldGrid}>
                <Field id="identity-name" label="Name">
                    {({ describedBy, invalid }) => <input
                        id="identity-name"
                        className={editorial.input}
                        value={draft.name}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => patch({ name: event.target.value })}
                    />}
                </Field>

                <Field id="identity-slug" label="Profile address" hint="Lowercase letters, numbers and hyphens only.">
                    {({ describedBy, invalid }) => <input
                        id="identity-slug"
                        className={editorial.input}
                        value={draft.slug}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => patch({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    />}
                </Field>

                <Field id="identity-affiliation" label={affiliationLabel}>
                    {({ describedBy, invalid }) => <>
                        <input
                            id="identity-affiliation"
                            className={editorial.input}
                            value={draft.school_or_firm}
                            list={profile.account_type === "student" ? "identity-schools" : undefined}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => patch({ school_or_firm: event.target.value })}
                        />
                        {profile.account_type === "student" && <datalist id="identity-schools">
                            {NIGERIAN_ARCHITECTURE_SCHOOLS.map((school) => <option key={school} value={school} />)}
                        </datalist>}
                    </>}
                </Field>

                <Field id="identity-location" label="Location">
                    {({ describedBy, invalid }) => <>
                        <input
                            id="identity-location"
                            className={editorial.input}
                            value={draft.location}
                            list="identity-states"
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => patch({ location: event.target.value })}
                        />
                        <datalist id="identity-states">
                            {NIGERIAN_STATES.map((state) => <option key={state} value={state} />)}
                        </datalist>
                    </>}
                </Field>

                <Field
                    id="identity-bio"
                    label="Introduction"
                    hint={`${draft.bio.length} / 1000 characters`}
                    className={editorial.fieldGridFull}
                >
                    {({ describedBy, invalid }) => <textarea
                        id="identity-bio"
                        className={editorial.textarea}
                        value={draft.bio}
                        maxLength={1000}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => patch({ bio: event.target.value })}
                    />}
                </Field>
            </div>
        </Section>

        <Section
            id="expertise"
            title="Expertise and skills"
            note="The areas you work in and the tools you use."
            editing={editing === "expertise"}
            dirty={dirtySections.some((section) => section.id === "expertise")}
            status={status.expertise ?? "idle"}
            error={errors.expertise}
            onEdit={() => setEditing("expertise")}
            onSave={() => void save("expertise")}
            onCancel={() => cancel("expertise")}
            summary={<div className={styles.summary}>
                <SummaryChips label="Areas of expertise" values={draft.expertise} />
                <SummaryChips label="Skills and software" values={draft.software_proficiency} />
                <SummaryChips label="Interests" values={draft.professional_interests} />
            </div>}
        >
            <ChipAdder
                id="expertise-areas"
                label="Areas of expertise"
                hint="For example: Adaptive reuse, Public space, Housing."
                values={draft.expertise}
                onChange={(expertise) => patch({ expertise })}
                placeholder="Add an area of expertise"
            />
            <ChipAdder
                id="expertise-software"
                label="Skills and software"
                hint="Tools you use in practice or study."
                values={draft.software_proficiency}
                onChange={(software_proficiency) => patch({ software_proficiency })}
                suggestions={ARCHITECTURE_SOFTWARE}
                placeholder="Add a skill or tool"
            />
            <Field id="expertise-interests" label="Professional interests" hint="Pick the areas you want to be known for.">
                {() => <ul className={editorial.chipRow}>
                    {PROFESSIONAL_INTEREST_OPTIONS.map((option) => {
                        const active = draft.professional_interests.includes(option);
                        return <li key={option}>
                            <button
                                type="button"
                                aria-pressed={active}
                                className={[editorial.chip, editorial.chipButton, active ? editorial.chipActive : ""].filter(Boolean).join(" ")}
                                onClick={() => patch({
                                    professional_interests: active
                                        ? draft.professional_interests.filter((item) => item !== option)
                                        : [...draft.professional_interests, option],
                                })}
                            >{option}</button>
                        </li>;
                    })}
                </ul>}
            </Field>
            {draft.professional_interests.includes("Other") && <Field id="expertise-interest-other" label="Your other interest">
                {({ describedBy, invalid }) => <input
                    id="expertise-interest-other"
                    className={editorial.input}
                    value={draft.professional_interest_other}
                    maxLength={120}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => patch({ professional_interest_other: event.target.value })}
                />}
            </Field>}
        </Section>

        <Section
            id="experience"
            title="Experience"
            note="Roles and practices you have worked with."
            editing={editing === "experience"}
            dirty={dirtySections.some((section) => section.id === "experience")}
            status={status.experience ?? "idle"}
            error={errors.experience}
            onEdit={() => setEditing("experience")}
            onSave={() => void save("experience")}
            onCancel={() => cancel("experience")}
            summary={<EntrySummary
                empty="No experience added yet."
                rows={draft.experience.map((entry) => ({
                    key: entry.id,
                    title: entry.role,
                    detail: [entry.organisation, [entry.start_year, entry.end_year].filter(Boolean).join(" – ")].filter(Boolean).join(" · "),
                }))}
            />}
        >
            <div className={styles.entryList}>
                {draft.experience.map((entry, index) => <EntryCard
                    key={entry.id}
                    index={index}
                    label="Role"
                    onRemove={() => patch({ experience: draft.experience.filter((item) => item.id !== entry.id) })}
                >
                    <div className={styles.entryGrid}>
                        <Field id={`experience-role-${entry.id}`} label="Role">
                            {({ describedBy, invalid }) => <input
                                id={`experience-role-${entry.id}`}
                                className={editorial.input}
                                value={entry.role}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ experience: draft.experience.map((item) => item.id === entry.id ? { ...item, role: event.target.value } : item) })}
                            />}
                        </Field>
                        <Field id={`experience-org-${entry.id}`} label="Organisation">
                            {({ describedBy, invalid }) => <input
                                id={`experience-org-${entry.id}`}
                                className={editorial.input}
                                value={entry.organisation}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ experience: draft.experience.map((item) => item.id === entry.id ? { ...item, organisation: event.target.value } : item) })}
                            />}
                        </Field>
                        <Field id={`experience-location-${entry.id}`} label="Location">
                            {({ describedBy, invalid }) => <input
                                id={`experience-location-${entry.id}`}
                                className={editorial.input}
                                value={entry.location ?? ""}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ experience: draft.experience.map((item) => item.id === entry.id ? { ...item, location: event.target.value } : item) })}
                            />}
                        </Field>
                        <div className={styles.entryGrid}>
                            <Field id={`experience-start-${entry.id}`} label="From">
                                {({ describedBy, invalid }) => <input
                                    id={`experience-start-${entry.id}`}
                                    className={editorial.input}
                                    inputMode="numeric"
                                    value={entry.start_year ?? ""}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    onChange={(event) => patch({ experience: draft.experience.map((item) => item.id === entry.id ? { ...item, start_year: toYear(event.target.value) } : item) })}
                                />}
                            </Field>
                            <Field id={`experience-end-${entry.id}`} label="To" hint="Leave blank if current.">
                                {({ describedBy, invalid }) => <input
                                    id={`experience-end-${entry.id}`}
                                    className={editorial.input}
                                    inputMode="numeric"
                                    value={entry.end_year ?? ""}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    onChange={(event) => patch({ experience: draft.experience.map((item) => item.id === entry.id ? { ...item, end_year: toYear(event.target.value) } : item) })}
                                />}
                            </Field>
                        </div>
                        <Field id={`experience-note-${entry.id}`} label="What you did" className={styles.entryGridFull}>
                            {({ describedBy, invalid }) => <textarea
                                id={`experience-note-${entry.id}`}
                                className={editorial.textarea}
                                value={entry.description ?? ""}
                                maxLength={600}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ experience: draft.experience.map((item) => item.id === entry.id ? { ...item, description: event.target.value } : item) })}
                            />}
                        </Field>
                    </div>
                </EntryCard>)}
            </div>
            <Pill
                size="small"
                variant="quiet"
                onClick={() => patch({
                    experience: [...draft.experience, { id: newId(), role: "", organisation: "", location: "", start_year: null, end_year: null, description: "" }],
                })}
            >Add a role</Pill>
        </Section>

        <Section
            id="education"
            title="Education"
            note="Where you studied and what you qualified with."
            editing={editing === "education"}
            dirty={dirtySections.some((section) => section.id === "education")}
            status={status.education ?? "idle"}
            error={errors.education}
            onEdit={() => setEditing("education")}
            onSave={() => void save("education")}
            onCancel={() => cancel("education")}
            summary={<EntrySummary
                empty="No education added yet."
                rows={draft.education.map((entry) => ({
                    key: entry.id,
                    title: entry.institution,
                    detail: [[entry.qualification, entry.discipline].filter(Boolean).join(", "), [entry.start_year, entry.end_year].filter(Boolean).join(" – ")].filter(Boolean).join(" · "),
                }))}
            />}
        >
            <div className={styles.entryList}>
                {draft.education.map((entry, index) => <EntryCard
                    key={entry.id}
                    index={index}
                    label="Qualification"
                    onRemove={() => patch({ education: draft.education.filter((item) => item.id !== entry.id) })}
                >
                    <div className={styles.entryGrid}>
                        <Field id={`education-institution-${entry.id}`} label="Institution" className={styles.entryGridFull}>
                            {({ describedBy, invalid }) => <>
                                <input
                                    id={`education-institution-${entry.id}`}
                                    className={editorial.input}
                                    value={entry.institution}
                                    list="education-schools"
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    onChange={(event) => patch({ education: draft.education.map((item) => item.id === entry.id ? { ...item, institution: event.target.value } : item) })}
                                />
                                <datalist id="education-schools">
                                    {NIGERIAN_ARCHITECTURE_SCHOOLS.map((school) => <option key={school} value={school} />)}
                                </datalist>
                            </>}
                        </Field>
                        <Field id={`education-qualification-${entry.id}`} label="Qualification">
                            {({ describedBy, invalid }) => <input
                                id={`education-qualification-${entry.id}`}
                                className={editorial.input}
                                value={entry.qualification ?? ""}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ education: draft.education.map((item) => item.id === entry.id ? { ...item, qualification: event.target.value } : item) })}
                            />}
                        </Field>
                        <Field id={`education-discipline-${entry.id}`} label="Discipline">
                            {({ describedBy, invalid }) => <input
                                id={`education-discipline-${entry.id}`}
                                className={editorial.input}
                                value={entry.discipline ?? ""}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ education: draft.education.map((item) => item.id === entry.id ? { ...item, discipline: event.target.value } : item) })}
                            />}
                        </Field>
                        <Field id={`education-start-${entry.id}`} label="From">
                            {({ describedBy, invalid }) => <input
                                id={`education-start-${entry.id}`}
                                className={editorial.input}
                                inputMode="numeric"
                                value={entry.start_year ?? ""}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ education: draft.education.map((item) => item.id === entry.id ? { ...item, start_year: toYear(event.target.value) } : item) })}
                            />}
                        </Field>
                        <Field id={`education-end-${entry.id}`} label="To">
                            {({ describedBy, invalid }) => <input
                                id={`education-end-${entry.id}`}
                                className={editorial.input}
                                inputMode="numeric"
                                value={entry.end_year ?? ""}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ education: draft.education.map((item) => item.id === entry.id ? { ...item, end_year: toYear(event.target.value) } : item) })}
                            />}
                        </Field>
                    </div>
                </EntryCard>)}
            </div>
            <Pill
                size="small"
                variant="quiet"
                onClick={() => patch({
                    education: [...draft.education, { id: newId(), institution: "", qualification: "", discipline: "", start_year: null, end_year: null }],
                })}
            >Add education</Pill>
        </Section>

        <Section
            id="affiliations"
            title="Affiliations"
            note="Professional bodies, studios and organisations you are part of."
            editing={editing === "affiliations"}
            dirty={dirtySections.some((section) => section.id === "affiliations")}
            status={status.affiliations ?? "idle"}
            error={errors.affiliations}
            onEdit={() => setEditing("affiliations")}
            onSave={() => void save("affiliations")}
            onCancel={() => cancel("affiliations")}
            summary={<EntrySummary
                empty="No affiliations added yet."
                rows={draft.affiliations.map((entry) => ({
                    key: entry.id,
                    title: entry.organisation,
                    detail: entry.role ?? "",
                }))}
            />}
        >
            <div className={styles.entryList}>
                {draft.affiliations.map((entry, index) => <EntryCard
                    key={entry.id}
                    index={index}
                    label="Affiliation"
                    onRemove={() => patch({ affiliations: draft.affiliations.filter((item) => item.id !== entry.id) })}
                >
                    <div className={styles.entryGrid}>
                        <Field id={`affiliation-org-${entry.id}`} label="Organisation">
                            {({ describedBy, invalid }) => <input
                                id={`affiliation-org-${entry.id}`}
                                className={editorial.input}
                                value={entry.organisation}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ affiliations: draft.affiliations.map((item) => item.id === entry.id ? { ...item, organisation: event.target.value } : item) })}
                            />}
                        </Field>
                        <Field id={`affiliation-role-${entry.id}`} label="Role">
                            {({ describedBy, invalid }) => <input
                                id={`affiliation-role-${entry.id}`}
                                className={editorial.input}
                                value={entry.role ?? ""}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ affiliations: draft.affiliations.map((item) => item.id === entry.id ? { ...item, role: event.target.value } : item) })}
                            />}
                        </Field>
                        <Field id={`affiliation-url-${entry.id}`} label="Link" hint="Optional." className={styles.entryGridFull}>
                            {({ describedBy, invalid }) => <input
                                id={`affiliation-url-${entry.id}`}
                                className={editorial.input}
                                type="url"
                                value={entry.url ?? ""}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                onChange={(event) => patch({ affiliations: draft.affiliations.map((item) => item.id === entry.id ? { ...item, url: event.target.value } : item) })}
                            />}
                        </Field>
                    </div>
                </EntryCard>)}
            </div>
            <Pill
                size="small"
                variant="quiet"
                onClick={() => patch({
                    affiliations: [...draft.affiliations, { id: newId(), organisation: "", role: "", url: "" }],
                })}
            >Add an affiliation</Pill>
        </Section>

        <Section
            id="links"
            title="Links and files"
            note="Where people can find you and your CV."
            editing={editing === "links"}
            dirty={dirtySections.some((section) => section.id === "links")}
            status={status.links ?? "idle"}
            error={errors.links}
            onEdit={() => setEditing("links")}
            onSave={() => void save("links")}
            onCancel={() => cancel("links")}
            summary={<div className={styles.summary}>
                <SummaryLink label="Website" value={draft.personal_site_url} />
                <SummaryLink label="LinkedIn" value={draft.linkedin_url} />
                <SummaryLink label="Instagram" value={draft.instagram_url} />
                {draft.social_links.filter((row) => row.label && row.url).map((row) => <SummaryLink key={row.label} label={row.label} value={row.url} />)}
                <SummaryLink label="CV" value={draft.cv_url} />
            </div>}
        >
            <div className={editorial.fieldGrid}>
                <Field id="links-site" label="Website">
                    {({ describedBy, invalid }) => <input
                        id="links-site"
                        className={editorial.input}
                        type="url"
                        placeholder="https://"
                        value={draft.personal_site_url}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => patch({ personal_site_url: event.target.value })}
                    />}
                </Field>
                <Field id="links-linkedin" label="LinkedIn">
                    {({ describedBy, invalid }) => <input
                        id="links-linkedin"
                        className={editorial.input}
                        type="url"
                        placeholder="https://linkedin.com/in/…"
                        value={draft.linkedin_url}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => patch({ linkedin_url: event.target.value })}
                    />}
                </Field>
                <Field id="links-instagram" label="Instagram">
                    {({ describedBy, invalid }) => <input
                        id="links-instagram"
                        className={editorial.input}
                        type="url"
                        placeholder="https://instagram.com/…"
                        value={draft.instagram_url}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => patch({ instagram_url: event.target.value })}
                    />}
                </Field>
            </div>

            <div className={styles.entryList}>
                {draft.social_links.map((row, index) => <div key={`social-${index}`} className={styles.entryGrid}>
                    <Field id={`social-label-${index}`} label="Link label">
                        {({ describedBy, invalid }) => <input
                            id={`social-label-${index}`}
                            className={editorial.input}
                            value={row.label}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => patch({ social_links: draft.social_links.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })}
                        />}
                    </Field>
                    <Field id={`social-url-${index}`} label="Link URL">
                        {({ describedBy, invalid }) => <input
                            id={`social-url-${index}`}
                            className={editorial.input}
                            type="url"
                            placeholder="https://"
                            value={row.url}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => patch({ social_links: draft.social_links.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item) })}
                        />}
                    </Field>
                    <div className={styles.entryGridFull}>
                        <Pill size="small" variant="quiet" onClick={() => patch({ social_links: draft.social_links.filter((_, itemIndex) => itemIndex !== index) })}>Remove link</Pill>
                    </div>
                </div>)}
            </div>
            <Pill size="small" variant="quiet" onClick={() => patch({ social_links: [...draft.social_links, { label: "", url: "" }] })}>Add another link</Pill>

            {!isOrganisation && <div className={styles.mediaRow}>
                <div className={styles.mediaActions}>
                    <label className={editorial.fieldLabel} htmlFor="links-cv">CV / résumé</label>
                    <input
                        id="links-cv"
                        type="file"
                        accept="application/pdf,.pdf"
                        className={styles.fileInput}
                        disabled={uploading === "cv"}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadCv(file);
                            event.target.value = "";
                        }}
                    />
                    <p className={editorial.fieldHint}>
                        PDF, up to 5 MB. {uploading === "cv" ? "Uploading…" : draft.cv_url ? "A CV is attached." : "No CV attached."}
                    </p>
                    {draft.cv_url && <Pill size="small" variant="quiet" onClick={() => patch({ cv_url: "" })}>Remove CV</Pill>}
                </div>
            </div>}
        </Section>

        <Section
            id="privacy"
            title="Privacy"
            note="Control how your profile is discovered and contacted."
            editing={editing === "privacy"}
            dirty={dirtySections.some((section) => section.id === "privacy")}
            status={status.privacy ?? "idle"}
            error={errors.privacy}
            onEdit={() => setEditing("privacy")}
            onSave={() => void save("privacy")}
            onCancel={() => cancel("privacy")}
            summary={<div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Search engines</span>
                    <span className={styles.summaryValue}>{draft.search_indexable ? "Profile is listed" : "Profile is hidden from search"}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Product emails</span>
                    <span className={styles.summaryValue}>{draft.marketing_emails ? "Subscribed" : "Not subscribed"}</span>
                </div>
            </div>}
        >
            <ToggleRow
                id="privacy-indexable"
                label="Show my profile in search engines"
                hint="When off, your profile and projects are not indexed and the public link returns not found."
                checked={draft.search_indexable}
                onChange={(search_indexable) => patch({ search_indexable })}
            />
            <ToggleRow
                id="privacy-marketing"
                label="Send me product emails"
                hint="Occasional updates about new ArchiCareer features."
                checked={draft.marketing_emails}
                onChange={(marketing_emails) => patch({ marketing_emails })}
            />
        </Section>
    </>;
}

function toYear(value: string): number | null {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 4);
    if (!digits) return null;
    const year = Number(digits);
    return year >= 1900 && year <= 2100 ? year : null;
}

type SectionProps = {
    id: SectionId;
    title: string;
    note: string;
    editing: boolean;
    dirty: boolean;
    status: SaveState;
    error?: string | null;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    summary: React.ReactNode;
    children: React.ReactNode;
};

function Section({ id, title, note, editing, dirty, status, error, onEdit, onSave, onCancel, summary, children }: SectionProps) {
    const statusText = status === "saving"
        ? "Saving…"
        : status === "error"
            ? error ?? "That didn't save. Try again."
            : status === "saved" && !dirty
                ? "Saved."
                : "";

    return <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
        <div className={styles.sectionHead}>
            <div className={styles.sectionHeadCopy}>
                <h2 id={`${id}-title`} className={styles.sectionTitle}>{title}</h2>
                <p className={styles.sectionNote}>{note}</p>
            </div>
            {!editing && <Pill size="small" onClick={onEdit}>Edit</Pill>}
        </div>

        {editing ? <>
            <div className={styles.fields}>{children}</div>
            <div className={styles.actions}>
                <Pill size="small" variant="blue" onClick={onSave} disabled={!dirty || status === "saving"}>
                    {status === "saving" ? "Saving…" : "Save"}
                </Pill>
                <Pill size="small" variant="quiet" onClick={onCancel} disabled={status === "saving"}>Cancel</Pill>
                <p
                    className={[styles.status, status === "error" ? styles.statusError : status === "saved" ? styles.statusSaved : ""].filter(Boolean).join(" ")}
                    role="status"
                    aria-live="polite"
                >{statusText}</p>
            </div>
        </> : <>
            {summary}
            {status === "error" && <p className={[styles.status, styles.statusError].join(" ")} role="alert">{error}</p>}
        </>}
    </section>;
}

function SummaryChips({ label, values }: { label: string; values: string[] }) {
    return <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>{label}</span>
        <span className={styles.summaryValue}>
            {values.length > 0
                ? <ul className={editorial.chipRow}>{values.map((value) => <li key={value} className={editorial.chip}>{value}</li>)}</ul>
                : <span className={styles.summaryEmpty}>None added</span>}
        </span>
    </div>;
}

function SummaryLink({ label, value }: { label: string; value: string }) {
    return <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>{label}</span>
        <span className={styles.summaryValue}>{value || <span className={styles.summaryEmpty}>Not set</span>}</span>
    </div>;
}

function EntrySummary({ rows, empty }: { rows: Array<{ key: string; title: string; detail: string }>; empty: string }) {
    if (rows.length === 0) return <p className={styles.summaryEmpty}>{empty}</p>;
    return <div className={styles.summary}>
        {rows.map((row) => <div key={row.key} className={styles.summaryRow}>
            <span className={styles.summaryValue}>
                <strong>{row.title}</strong>
                {row.detail && <><br /><span className={styles.summaryEmpty}>{row.detail}</span></>}
            </span>
        </div>)}
    </div>;
}

function ToggleRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (value: boolean) => void }) {
    return <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>{label}</span>
        <span className={styles.summaryValue}>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                aria-describedby={`${id}-hint`}
                onClick={() => onChange(!checked)}
                className={[editorial.chip, editorial.chipButton, checked ? editorial.chipActive : ""].filter(Boolean).join(" ")}
            >{checked ? "On" : "Off"}</button>
            <span id={`${id}-hint`} className={editorial.fieldHint} style={{ display: "block", marginTop: 6 }}>{hint}</span>
        </span>
    </div>;
}
