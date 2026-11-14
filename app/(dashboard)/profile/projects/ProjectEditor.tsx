"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import Field from "@/app/components/editorial/Field";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
import { useUnsavedChanges } from "@/app/components/editorial/useUnsavedChanges";
import { compressImageForUpload } from "@/lib/image-compression";
import type { PortfolioItem, PortfolioItemImage } from "@/types";
import styles from "./projects.module.css";

const PROJECT_TYPES = ["residential", "commercial", "institutional", "urban_design", "interior", "landscape", "competition", "academic_studio"] as const;
const CATEGORIES = ["residential", "commercial", "institutional", "landscape", "interior", "urban", "academic", "other"] as const;
const MAX_IMAGES = 12;

type PendingImage = { key: string; url: string };

type ProjectEditorProps = {
    profileId: string;
    project?: PortfolioItem | null;
    onSaved?: (item: PortfolioItem | null) => void;
    /** Pass `null` to hide the cancel action entirely (e.g. inside onboarding). */
    onCancel?: (() => void) | null;
    submitLabel?: string;
};

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ProjectEditor({ profileId, project = null, onSaved, onCancel, submitLabel }: ProjectEditorProps) {
    const router = useRouter();
    const isEdit = Boolean(project);
    const fileInputId = useId();

    const [title, setTitle] = useState(project?.title ?? "");
    const [description, setDescription] = useState(project?.description ?? "");
    const [category, setCategory] = useState<string>(project?.category ?? "academic");
    const [projectType, setProjectType] = useState<string>(project?.project_type ?? "academic_studio");
    const [status, setStatus] = useState<string>(project?.status ?? "academic");
    const [year, setYear] = useState(project?.year ? String(project.year) : "");
    const [location, setLocation] = useState(project?.location ?? "");
    const [role, setRole] = useState<string>(project?.role ?? "individual");
    const [teamContribution, setTeamContribution] = useState(project?.team_contribution ?? "");
    const [software, setSoftware] = useState<string[]>(project?.software_used ?? []);
    const [softwareDraft, setSoftwareDraft] = useState("");
    const [processNote, setProcessNote] = useState(project?.process_note ?? "");
    const [published, setPublished] = useState(project?.is_published ?? true);

    const [existing, setExisting] = useState<PortfolioItemImage[]>(project?.images ?? []);
    const [pending, setPending] = useState<PendingImage[]>([]);
    const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [imageError, setImageError] = useState("");

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [showErrors, setShowErrors] = useState(false);

    const totalImages = existing.length + pending.length;
    const fields = {
        title, description, category, project_type: projectType, status, year, location,
        role, team_contribution: teamContribution, process_note: processNote,
        is_published: published, software_used: software,
    };
    const [snapshot, setSnapshot] = useState(() => JSON.stringify(fields));
    const dirty = JSON.stringify(fields) !== snapshot || pending.length > 0;

    useUnsavedChanges(dirty);

    function addSoftware() {
        const value = softwareDraft.trim();
        if (value && !software.includes(value)) setSoftware([...software, value]);
        setSoftwareDraft("");
    }

    async function handleFiles(files: FileList | File[]) {
        const incoming = Array.from(files);
        if (incoming.length === 0) return;
        setImageError("");
        const room = MAX_IMAGES - totalImages;
        if (room <= 0) {
            setImageError(`A project can contain at most ${MAX_IMAGES} images.`);
            return;
        }
        const accepted = incoming.slice(0, room);
        const rejected = incoming.length - accepted.length;
        if (rejected > 0) setImageError(`Only ${room} more ${room === 1 ? "image" : "images"} can be added to this project.`);

        setUploading({ done: 0, total: accepted.length });
        for (const [index, file] of accepted.entries()) {
            try {
                if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    throw new Error(`${file.name} is not a JPG, PNG or WebP image.`);
                }
                const compressed = await compressImageForUpload(file, "portfolio");
                const formData = new FormData();
                formData.set("bucket", "portfolio-images");
                formData.set("file", compressed, compressed.name || file.name);
                const response = await fetch("/api/storage", { method: "POST", body: formData });
                const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
                if (!response.ok || !result.url) throw new Error(result.error ?? `Unable to upload ${file.name}.`);
                setPending((current) => [...current, { key: `${result.url}-${Date.now()}-${index}`, url: result.url as string }]);
            } catch (uploadError) {
                setImageError(uploadError instanceof Error ? uploadError.message : "An image could not be uploaded.");
            } finally {
                setUploading((current) => current ? { ...current, done: current.done + 1 } : current);
            }
        }
        setUploading(null);
    }

    async function persistOrder(ordered: PortfolioItemImage[]) {
        setExisting(ordered);
        const response = await fetch("/api/portfolio", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: project?.id, imageOrder: ordered.map((image) => image.id) }),
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({})) as { error?: string };
            setImageError(payload.error ?? "Couldn't save the image order.");
        }
    }

    function moveExisting(index: number, delta: number) {
        const next = [...existing];
        const target = index + delta;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        void persistOrder(next);
    }

    function makeCoverExisting(index: number) {
        if (index === 0) return;
        const next = [...existing];
        const [moved] = next.splice(index, 1);
        next.unshift(moved);
        void persistOrder(next);
    }

    async function removeExisting(image: PortfolioItemImage) {
        setImageError("");
        setExisting((current) => current.filter((item) => item.id !== image.id));
        const response = await fetch("/api/portfolio", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId: image.id }),
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({})) as { error?: string };
            setImageError(payload.error ?? "Couldn't remove that image.");
            setExisting((current) => [...current, image]);
        }
    }

    function movePending(index: number, delta: number) {
        const next = [...pending];
        const target = index + delta;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setPending(next);
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setShowErrors(true);
        setError("");
        setImageError("");

        if (title.trim().length < 2) {
            setError("Give the project a title of at least 2 characters.");
            return;
        }

        setSaving(true);
        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            category,
            project_type: projectType,
            status,
            year: year ? Number(year) : null,
            location: location.trim() || null,
            role,
            team_contribution: role === "team" ? (teamContribution.trim() || null) : null,
            software_used: software,
            process_note: processNote.trim() || null,
            is_published: published,
        };

        try {
            if (isEdit && project) {
                const response = await fetch("/api/portfolio", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: project.id, ...payload }),
                });
                const result = await response.json().catch(() => ({})) as { error?: string };
                if (!response.ok) throw new Error(result.error ?? "Couldn't save this project.");

                if (pending.length > 0) {
                    const imageResponse = await fetch("/api/portfolio", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: project.id, imageUrls: pending.map((image) => image.url) }),
                    });
                    const imageResult = await imageResponse.json().catch(() => ({})) as { error?: string; images?: PortfolioItemImage[] };
                    if (!imageResponse.ok) throw new Error(imageResult.error ?? "The project saved, but the new images did not.");
                    // Carry the saved images straight into the list so they can be
                    // reordered or set as cover without leaving the page.
                    setExisting((current) => [...current, ...(imageResult.images ?? [])]);
                    setPending([]);
                }
            } else {
                const response = await fetch("/api/portfolio", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, profile_id: profileId, imageUrls: pending.map((image) => image.url) }),
                });
                const result = await response.json().catch(() => ({})) as { error?: string; item?: PortfolioItem; code?: string };
                if (!response.ok) {
                    throw new Error(result.code === "PORTFOLIO_LIMIT_REACHED"
                        ? "You have reached your portfolio space limit. Remove a project or add more space to continue."
                        : result.error ?? "Couldn't create this project.");
                }
                // Clear the form so the next project can be added straight away.
                setTitle("");
                setDescription("");
                setCategory("academic");
                setProjectType("academic_studio");
                setStatus("academic");
                setYear("");
                setLocation("");
                setRole("individual");
                setTeamContribution("");
                setSoftware([]);
                setProcessNote("");
                setPublished(true);
                setExisting([]);
                setPending([]);
                setSnapshot(JSON.stringify({
                    title: "", description: "", category: "academic", project_type: "academic_studio",
                    status: "academic", year: "", location: "", role: "individual", team_contribution: "",
                    process_note: "", is_published: true, software_used: [],
                }));
                setShowErrors(false);
                setSaved(true);
                onSaved?.(result.item ?? null);
                router.refresh();
                return;
            }

            setSnapshot(JSON.stringify(fields));
            setSaved(true);
            onSaved?.(null);
            router.refresh();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Couldn't save this project.");
        } finally {
            setSaving(false);
        }
    }

    const statusText = saving
        ? "Saving…"
        : error
            ? error
            : saved
                ? "Saved."
                : dirty
                    ? "You have unsaved changes."
                    : "";

    return <form onSubmit={handleSubmit} noValidate>
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Project details</h2>
            <div className={styles.fields}>
                <Field id="project-title" label="Title" hint="What is this project called?" error={showErrors && title.trim().length < 2 ? "A title of at least 2 characters is required." : undefined}>
                    {({ describedBy, invalid }) => <input
                        id="project-title"
                        className={editorial.input}
                        value={title}
                        maxLength={150}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => setTitle(event.target.value)}
                    />}
                </Field>

                <Field id="project-description" label="Description" hint={`${description.length} / 4000 characters`}>
                    {({ describedBy, invalid }) => <textarea
                        id="project-description"
                        className={editorial.textarea}
                        style={{ minHeight: 180 }}
                        value={description}
                        maxLength={4000}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => setDescription(event.target.value)}
                    />}
                </Field>

                <div className={editorial.fieldGrid}>
                    <Field id="project-category" label="Category">
                        {({ describedBy, invalid }) => <select
                            id="project-category"
                            className={editorial.select}
                            value={category}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => setCategory(event.target.value)}
                        >
                            {CATEGORIES.map((option) => <option key={option} value={option}>{label(option)}</option>)}
                        </select>}
                    </Field>

                    <Field id="project-type" label="Project type">
                        {({ describedBy, invalid }) => <select
                            id="project-type"
                            className={editorial.select}
                            value={projectType}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => setProjectType(event.target.value)}
                        >
                            {PROJECT_TYPES.map((option) => <option key={option} value={option}>{label(option)}</option>)}
                        </select>}
                    </Field>

                    <Field id="project-academic" label="Context">
                        {({ describedBy, invalid }) => <select
                            id="project-academic"
                            className={editorial.select}
                            value={status}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="academic">Academic</option>
                            <option value="professional">Professional</option>
                        </select>}
                    </Field>

                    <Field id="project-year" label="Year">
                        {({ describedBy, invalid }) => <input
                            id="project-year"
                            className={editorial.input}
                            inputMode="numeric"
                            placeholder="2025"
                            value={year}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => setYear(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                        />}
                    </Field>

                    <Field id="project-location" label="Location">
                        {({ describedBy, invalid }) => <input
                            id="project-location"
                            className={editorial.input}
                            value={location}
                            maxLength={160}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => setLocation(event.target.value)}
                        />}
                    </Field>

                    <Field id="project-role" label="Contribution">
                        {({ describedBy, invalid }) => <select
                            id="project-role"
                            className={editorial.select}
                            value={role}
                            aria-describedby={describedBy}
                            aria-invalid={invalid}
                            onChange={(event) => setRole(event.target.value)}
                        >
                            <option value="individual">Individual project</option>
                            <option value="team">Team project</option>
                        </select>}
                    </Field>
                </div>

                {role === "team" && <Field id="project-contribution" label="Your contribution" hint="What did you do on this project?">
                    {({ describedBy, invalid }) => <input
                        id="project-contribution"
                        className={editorial.input}
                        value={teamContribution}
                        maxLength={280}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => setTeamContribution(event.target.value)}
                    />}
                </Field>}

                <Field id="project-software" label="Software and tools">
                    {() => <div style={{ display: "grid", gap: 12 }}>
                        {software.length > 0 && <ul className={editorial.chipRow}>
                            {software.map((value) => <li key={value} className={`${editorial.chip} ${editorial.chipActive}`}>
                                {value}
                                <button
                                    type="button"
                                    aria-label={`Remove ${value}`}
                                    onClick={() => setSoftware(software.filter((item) => item !== value))}
                                    style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", marginLeft: 8, font: "inherit" }}
                                >×</button>
                            </li>)}
                        </ul>}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <input
                                id="project-software"
                                className={editorial.input}
                                style={{ flex: "1 1 200px", minWidth: 0 }}
                                value={softwareDraft}
                                placeholder="Add a tool"
                                onChange={(event) => setSoftwareDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        addSoftware();
                                    }
                                }}
                            />
                            <Pill size="small" variant="quiet" onClick={addSoftware} disabled={!softwareDraft.trim()}>Add</Pill>
                        </div>
                    </div>}
                </Field>

                <Field id="project-process" label="Design approach" hint={`${processNote.length} / 280 characters`}>
                    {({ describedBy, invalid }) => <textarea
                        id="project-process"
                        className={editorial.textarea}
                        value={processNote}
                        maxLength={280}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        onChange={(event) => setProcessNote(event.target.value)}
                    />}
                </Field>

                <Field id="project-published" label="Visibility" hint="Drafts stay private. You can publish whenever you're ready.">
                    {() => <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <button
                            type="button"
                            aria-pressed={published}
                            className={[editorial.chip, editorial.chipButton, published ? editorial.chipActive : ""].filter(Boolean).join(" ")}
                            onClick={() => setPublished(true)}
                        >Publish on my profile</button>
                        <button
                            type="button"
                            aria-pressed={!published}
                            className={[editorial.chip, editorial.chipButton, !published ? editorial.chipActive : ""].filter(Boolean).join(" ")}
                            onClick={() => setPublished(false)}
                        >Keep as a draft</button>
                    </div>}
                </Field>
            </div>
        </section>

        <section className={styles.section} aria-labelledby="project-images-title">
            <div>
                <h2 id="project-images-title" className={styles.sectionTitle}>Images</h2>
                <p className={styles.sectionNote}>
                    {totalImages} of {MAX_IMAGES} images. The first image is the cover shown in galleries and listings.
                </p>
            </div>

            {imageError && <p className={editorial.fieldError} role="alert">{imageError}</p>}

            {existing.length > 0 && <ul className={styles.imageGrid}>
                {existing.map((image, index) => <li key={image.id} className={styles.imageCard}>
                    <div className={styles.imageThumb}>
                        <Image src={image.image_url} alt={`Project image ${index + 1}`} fill sizes="200px" />
                        {index === 0 && <span className={styles.imageBadge}>Cover</span>}
                    </div>
                    <div className={styles.imageActions}>
                        <button type="button" className={styles.imageAction} onClick={() => moveExisting(index, -1)} disabled={index === 0} aria-label="Move image earlier">←</button>
                        <button type="button" className={styles.imageAction} onClick={() => moveExisting(index, 1)} disabled={index === existing.length - 1} aria-label="Move image later">→</button>
                        <button type="button" className={styles.imageAction} onClick={() => makeCoverExisting(index)} disabled={index === 0}>Make cover</button>
                        <button type="button" className={`${styles.imageAction} ${styles.imageActionDanger}`} onClick={() => void removeExisting(image)}>Remove</button>
                    </div>
                </li>)}
            </ul>}

            {pending.length > 0 && <ul className={styles.imageGrid}>
                {pending.map((image, index) => <li key={image.key} className={styles.imageCard}>
                    <div className={styles.imageThumb}>
                        <Image src={image.url} alt={`New project image ${index + 1}`} fill sizes="200px" unoptimized />
                        <span className={styles.imageBadge}>New</span>
                    </div>
                    <div className={styles.imageActions}>
                        <button type="button" className={styles.imageAction} onClick={() => movePending(index, -1)} disabled={index === 0} aria-label="Move image earlier">←</button>
                        <button type="button" className={styles.imageAction} onClick={() => movePending(index, 1)} disabled={index === pending.length - 1} aria-label="Move image later">→</button>
                        <button type="button" className={`${styles.imageAction} ${styles.imageActionDanger}`} onClick={() => setPending(pending.filter((item) => item.key !== image.key))}>Remove</button>
                    </div>
                </li>)}
            </ul>}

            <div
                className={[styles.dropzone, dragging ? styles.dropzoneActive : ""].filter(Boolean).join(" ")}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    void handleFiles(event.dataTransfer.files);
                }}
            >
                <label className={editorial.fieldLabel} htmlFor={fileInputId}>Add images</label>
                <input
                    id={fileInputId}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className={styles.fileInput}
                    disabled={Boolean(uploading) || totalImages >= MAX_IMAGES}
                    onChange={(event) => {
                        if (event.target.files) void handleFiles(event.target.files);
                        event.target.value = "";
                    }}
                />
                <p className={editorial.fieldHint}>
                    Drag images here or choose files. JPG, PNG or WebP, up to 3 MB each.
                    {uploading ? ` Uploading ${uploading.done + 1} of ${uploading.total}…` : ""}
                </p>
                {pending.length > 0 && isEdit && <p className={editorial.fieldHint}>
                    New images are added when you save. Set the cover from the image list once they are saved.
                </p>}
            </div>
        </section>

        <div className={styles.footer} role="status" aria-live="polite">
            <p className={[styles.footerStatus, error ? styles.footerError : saved ? styles.footerSaved : ""].filter(Boolean).join(" ")}>{statusText}</p>
            <div className={editorial.pillRow}>
                {onCancel !== null && <Pill variant="quiet" size="small" onClick={onCancel ?? (() => router.push("/profile/projects"))} disabled={saving}>Cancel</Pill>}
                <Pill variant="blue" type="submit" disabled={saving}>
                    {saving ? "Saving…" : submitLabel ?? (isEdit ? "Save project" : "Create project")}
                </Pill>
            </div>
        </div>
    </form>;
}
