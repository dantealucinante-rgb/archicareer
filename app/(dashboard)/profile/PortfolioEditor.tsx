"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NextImage from "next/image";
import type { PortfolioItem } from "@/types";
import { compressImageForUpload } from "@/lib/image-compression";

type Props = { initialItems: PortfolioItem[]; variant?: "individual" | "firm"; startCollapsed?: boolean; onboardingExperience?: boolean; onItemsChange?: (items: PortfolioItem[]) => void };
const projectTypes = ["residential", "commercial", "institutional", "urban_design", "interior", "landscape", "competition", "academic_studio"] as const;
const categories = ["residential", "commercial", "institutional", "landscape", "interior", "urban", "academic", "other"] as const;

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
    const [draft, setDraft] = useState("");
    function addTag() {
        const value = draft.trim();
        if (value && !values.includes(value)) onChange([...values, value]);
        setDraft("");
    }
    return <div className="rounded-2xl border border-line bg-warm-white p-3"><div className="mb-2 flex flex-wrap gap-2">{values.map((value) => <button key={value} type="button" onClick={() => onChange(values.filter((item) => item !== value))} className="rounded-full border border-line bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink transition-colors hover:border-redline hover:text-redline">{value} ×</button>)}</div><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} className="w-full bg-transparent px-1 py-1 font-sans text-sm text-ink outline-none" placeholder={placeholder} /></div>;
}

function SelectedImagePreview({ file, previewUrl, index, onRemove }: { file: File; previewUrl: string; index: number; onRemove: () => void }) {
    return <div className="relative aspect-[4/3] overflow-hidden border-2 border-ink bg-paper">
        <NextImage src={previewUrl} alt={`Selected project image ${index + 1}: ${file.name}`} fill unoptimized sizes="(max-width: 640px) 50vw, 220px" className="object-cover" />
        <button type="button" aria-label={`Remove ${file.name}`} onClick={onRemove} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white text-xl font-bold text-ink">×</button>
    </div>;
}

export default function PortfolioEditor({ initialItems, variant = "individual", startCollapsed = false, onboardingExperience = false, onItemsChange }: Props) {
    const [items, setItems] = useState(initialItems);
    const [composerOpen, setComposerOpen] = useState(!startCollapsed || initialItems.length === 0);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [projectType, setProjectType] = useState<(typeof projectTypes)[number]>("academic_studio");
    const [category, setCategory] = useState<(typeof categories)[number]>("academic");
    const [role, setRole] = useState<"individual" | "team">("individual");
    const [teamContribution, setTeamContribution] = useState("");
    const [software, setSoftware] = useState<string[]>([]);
    const [year, setYear] = useState("");
    const [status, setStatus] = useState<"academic" | "professional">("academic");
    const [location, setLocation] = useState("");
    const [processNote, setProcessNote] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number; label: string } | null>(null);
    const [draggingFiles, setDraggingFiles] = useState(false);
    const fileInputId = useId();
    const previewUrls = useRef(new Map<File, string>());

    useEffect(() => { onItemsChange?.(items); }, [items, onItemsChange]);
    useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

    function addFiles(selected: File[]) {
        const next = [...files, ...selected];
        if (next.length > 12) { setMessage("Choose up to 12 images for a project."); return; }
        if (next.some((file) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))) {
            setMessage("Choose JPG, PNG, WebP or GIF images."); return;
        }
        if (next.reduce((total, file) => total + file.size, 0) > 36 * 1024 * 1024) {
            setMessage("Keep the selected images under 36 MB in total."); return;
        }
        selected.forEach((file) => {
            if (!previewUrls.current.has(file)) previewUrls.current.set(file, URL.createObjectURL(file));
        });
        setFiles(next);
        setMessage("");
    }

    async function uploadImages() {
        const maxFiles = 12;
        const maxTotalBytes = 36 * 1024 * 1024;
        if (files.length > maxFiles) throw new Error(`A project can contain at most ${maxFiles} images`);
        if (files.reduce((total, file) => total + file.size, 0) > maxTotalBytes) throw new Error("Portfolio images must total 36 MB or less");
        const compressedFiles: File[] = [];
        for (const [index, file] of files.entries()) {
            setUploadProgress({ done: index, total: files.length, label: `Preparing image ${index + 1} of ${files.length}` });
            setMessage(`Preparing image ${index + 1} of ${files.length}…`);
            compressedFiles.push(await compressImageForUpload(file, "portfolio"));
        }
        const urls: string[] = [];
        const paths: string[] = [];
        try {
            setMessage("Uploading images…");
            for (const [index, file] of compressedFiles.entries()) {
                setUploadProgress({ done: index, total: compressedFiles.length, label: `Uploading image ${index + 1} of ${compressedFiles.length}` });
                if (!file.type.startsWith("image/")) throw new Error("Portfolio files must be images");
                if (file.size > 3 * 1024 * 1024) throw new Error("Image is too large, please try a smaller file");
                const formData = new FormData();
                formData.set("bucket", "portfolio-images");
                formData.set("file", file, file.name);
                const response = await fetch("/api/storage", { method: "POST", body: formData });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error ?? "Unable to upload image");
                paths.push(result.path);
                urls.push(result.url);
                setUploadProgress({ done: index + 1, total: compressedFiles.length, label: `Uploaded image ${index + 1} of ${compressedFiles.length}` });
            }
        } catch (error) {
            if (paths.length > 0) await createClient().storage.from("portfolio-images").remove(paths);
            throw error;
        }
        return { urls, paths };
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true); setMessage("");
        try {
            setMessage(files.length > 0 && !editingId ? "Uploading images..." : "Saving...");
            const uploaded = editingId ? { urls: [], paths: [] } : await uploadImages();
            const imageUrls = uploaded.urls;
            const response = await fetch("/api/portfolio", {
                method: editingId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(editingId ? { id: editingId } : {}),
                    title, description: description || null, category, project_type: projectType, role,
                    team_contribution: role === "team" ? teamContribution || null : null,
                    software_used: software, year: year ? Number(year) : null, status,
                    location: location || null, process_note: processNote || null, imageUrls,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (uploaded.paths.length > 0) await createClient().storage.from("portfolio-images").remove(uploaded.paths);
                throw new Error(payload.error ?? "Unable to save portfolio item");
            }
            const wasEditing = Boolean(editingId);
            setItems((current) => editingId ? current.map((item) => item.id === editingId ? { ...item, ...payload.item } : item) : [...current, payload.item]);
            resetForm(); setMessage(wasEditing ? "Portfolio item updated." : "Portfolio item added.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to save portfolio item");
        } finally { setSaving(false); setUploadProgress(null); }
    }

    function resetForm() {
        previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrls.current.clear();
        setEditingId(null); setTitle(""); setDescription(""); setProjectType("academic_studio"); setCategory("academic"); setRole("individual"); setTeamContribution(""); setSoftware([]); setYear(""); setStatus("academic"); setLocation(""); setProcessNote(""); setFiles([]); setDetailsOpen(false);
    }

    function editItem(item: PortfolioItem) {
        setEditingId(item.id); setTitle(item.title); setDescription(item.description ?? ""); setProjectType(item.project_type); setCategory(item.category); setRole(item.role); setTeamContribution(item.team_contribution ?? ""); setSoftware(item.software_used); setYear(item.year?.toString() ?? ""); setStatus(item.status); setLocation(item.location ?? ""); setProcessNote(item.process_note ?? ""); setDetailsOpen(true); setMessage("Editing selected project.");
    }

    async function moveImage(item: PortfolioItem, index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= item.images.length) return;
        const images = [...item.images];
        [images[index], images[target]] = [images[target], images[index]];
        setMessage("");
        const previousItems = items;
        setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, images } : currentItem));
        try {
            const response = await fetch("/api/portfolio", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, imageOrder: images.map((image) => image.id) }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to reorder portfolio images.");
        } catch (error) {
            setItems(previousItems);
            setMessage(error instanceof Error ? error.message : "Unable to reorder portfolio images.");
        }
    }

    async function removeImage(item: PortfolioItem, imageId: string) {
        if (!window.confirm("Remove this image from the project? This cannot be undone.")) return;
        setMessage("");
        const previousItems = items;
        setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, images: currentItem.images.filter((image) => image.id !== imageId) } : currentItem));
        try {
            const response = await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageId }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to remove portfolio image.");
        } catch (error) {
            setItems(previousItems);
            setMessage(error instanceof Error ? error.message : "Unable to remove portfolio image.");
        }
    }

    async function removeItem(id: string) {
        if (!window.confirm("Remove this project? This cannot be undone.")) return;
        setMessage("");
        const previousItems = items;
        setItems((current) => current.filter((item) => item.id !== id));
        try {
            const response = await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to remove portfolio item.");
        } catch (error) {
            setItems(previousItems);
            setMessage(error instanceof Error ? error.message : "Unable to remove portfolio item.");
        }
    }

    const input = `field-input text-sm ${onboardingExperience ? "rounded-full" : ""}`;
    const label = onboardingExperience ? "mb-2 block text-sm font-semibold text-ink" : "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-graphite";
    const imagePicker = <div>
        <p className={label}>Project images <span className="font-normal text-graphite">(optional)</span></p>
        <div onDragEnter={(event) => { event.preventDefault(); setDraggingFiles(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingFiles(false); }} onDrop={(event) => { event.preventDefault(); setDraggingFiles(false); addFiles(Array.from(event.dataTransfer.files)); }} className={`border-2 border-dashed p-6 text-center transition-colors sm:p-8 ${draggingFiles ? "border-ink" : "border-ink/70 bg-paper"}`} style={draggingFiles ? { backgroundColor: "color-mix(in srgb, var(--teal) 12%, white)" } : undefined}>
            <div className="mx-auto grid h-12 w-12 place-items-center border-2 border-ink text-2xl font-bold text-ink" style={{ backgroundColor: "var(--orange)" }} aria-hidden="true">↑</div>
            <p className="mt-4 font-display text-xl font-semibold text-ink">Drop project images here</p>
            <p className="mt-2 text-sm leading-relaxed text-graphite">JPG, PNG, WebP or GIF · Up to 12 images · 36 MB total</p>
            <input id={fileInputId} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} className="peer sr-only" />
            <label htmlFor={fileInputId} className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-white px-5 font-semibold text-ink transition-colors hover:bg-ink hover:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-redline">Browse files</label>
        </div>
        {files.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Selected project image previews">{files.map((file, index) => <SelectedImagePreview key={`${file.name}-${file.lastModified}-${index}`} file={file} previewUrl={previewUrls.current.get(file) ?? ""} index={index} onRemove={() => { const url = previewUrls.current.get(file); if (url) URL.revokeObjectURL(url); previewUrls.current.delete(file); setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index)); }} />)}</div>}
    </div>;

    return <section id="portfolio" className={onboardingExperience ? "space-y-6" : "scroll-mt-28"}>
        {!onboardingExperience && <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow font-mono text-redline">{variant === "firm" ? "SELECTED WORK" : "PORTFOLIO"}</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{variant === "firm" ? "Company projects" : "Your project work"}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-graphite">{variant === "firm" ? "Add the work that shows what the practice can do." : "Add projects as you finish them. This is the work people come to your profile to see."}</p></div><div className="flex items-center gap-4"><span className="font-mono text-[10px] text-graphite">{String(items.length).padStart(2, "0")} ITEMS</span><button type="button" aria-label={composerOpen ? "Close add project menu" : "Add a new project"} aria-expanded={composerOpen} title={composerOpen ? "Close add project menu" : "Add a new project"} onClick={() => setComposerOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper transition-colors hover:bg-redline" >{composerOpen ? <span aria-hidden="true" className="text-xl leading-none">×</span> : <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" strokeLinecap="round" /></svg>}</button></div></div>}
        {items.length === 0 && !onboardingExperience && <div className="rounded-2xl border border-line bg-warm-white p-8 text-center"><p className="font-display text-xl text-ink">Start with a project you are proud of.</p><p className="mt-2 text-sm text-graphite">Add a title, a few images, and the story behind the work.</p><button type="button" onClick={() => setComposerOpen(true)} className="mt-5 rounded-full bg-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-redline">Add your first project</button></div>}
        {items.length > 0 && <div className="space-y-3">{items.map((item) => <div key={item.id} className={onboardingExperience ? "border-y-2 border-ink py-5" : "rounded-2xl border border-line bg-warm-white p-5"}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="line-clamp-2 font-display text-base font-semibold text-ink">{item.title}</p><p className={onboardingExperience ? "mt-1 text-sm text-graphite" : "mt-1 font-mono text-[10px] uppercase tracking-wider text-graphite"}>{item.status} · {item.images.length} images</p></div><div className={onboardingExperience ? "flex shrink-0 gap-2" : "flex shrink-0 gap-4"}><button type="button" onClick={() => editItem(item)} className={onboardingExperience ? "rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white" : "font-mono text-[10px] uppercase tracking-widest text-ink transition-colors hover:text-redline"}>Edit</button><button type="button" onClick={() => void removeItem(item.id)} className={onboardingExperience ? "rounded-full border border-ink px-4 py-2 text-sm font-semibold text-redline" : "font-mono text-[10px] uppercase tracking-widest text-redline"}>Remove</button></div></div>{item.images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{item.images.map((image, index) => <div key={image.id} className="relative overflow-hidden rounded-xl"><NextImage src={image.image_url} alt={item.title} width={640} height={360} sizes="(max-width: 640px) 50vw, 160px" className="aspect-video w-full object-cover" /><div className="absolute bottom-1 left-1 flex gap-1"><button type="button" aria-label="Move image up" onClick={() => void moveImage(item, index, -1)} className={onboardingExperience ? "grid h-9 w-9 place-items-center rounded-full border border-ink bg-paper text-ink" : "rounded bg-paper px-1.5 font-mono text-[10px] text-ink"}>↑</button><button type="button" aria-label="Move image down" onClick={() => void moveImage(item, index, 1)} className={onboardingExperience ? "grid h-9 w-9 place-items-center rounded-full border border-ink bg-paper text-ink" : "rounded bg-paper px-1.5 font-mono text-[10px] text-ink"}>↓</button><button type="button" onClick={() => void removeImage(item, image.id)} className={onboardingExperience ? "grid h-9 w-9 place-items-center rounded-full border border-ink bg-paper text-redline" : "rounded bg-paper px-1.5 font-mono text-[10px] text-redline"}>×</button></div></div>)}</div>}</div>)}</div>}
        {message && <p role={saving ? "status" : "alert"} aria-live="polite" className={`mt-4 ${onboardingExperience ? "text-sm font-medium" : "font-mono text-[10px] uppercase tracking-widest"} ${message.startsWith("Unable") || message.startsWith("Choose") || message.startsWith("Keep") ? "text-redline" : "text-graphite"}`}>{message}</p>}
        {uploadProgress && <div className="mt-3" role="status" aria-live="polite"><div className={`mb-2 flex justify-between gap-3 text-graphite ${onboardingExperience ? "text-sm" : "font-mono text-[10px] uppercase tracking-wider"}`}><span>{uploadProgress.label}</span><span>{uploadProgress.done}/{uploadProgress.total}</span></div><div className={`overflow-hidden ${onboardingExperience ? "h-2 rounded-full border border-ink bg-paper" : "h-2 border border-ink bg-paper"}`} role="progressbar" aria-label={uploadProgress.label} aria-valuemin={0} aria-valuemax={uploadProgress.total} aria-valuenow={uploadProgress.done}><span className={`block h-full origin-left ${onboardingExperience ? "bg-redline" : "bg-blue"}`} style={{ transform: `scaleX(${uploadProgress.total ? uploadProgress.done / uploadProgress.total : 0})` }} /></div></div>}
        {composerOpen && <form onSubmit={handleSubmit} className={onboardingExperience ? "space-y-5 border-2 border-ink bg-white p-5 sm:p-7" : "surface mt-6 space-y-5 rounded-2xl p-5 sm:p-7"}><div>{!onboardingExperience && <p className="eyebrow font-mono text-redline">{editingId ? "EDIT PROJECT" : "ADD A PROJECT"}</p>}<h3 className="mt-2 font-display text-xl font-semibold tracking-tight">{editingId ? "Update the project" : onboardingExperience ? "Give this project a name" : "What are you working on?"}</h3>{!onboardingExperience && <p className="mt-2 text-sm text-graphite">Start with the name, a short description, and the images people should see first.</p>}</div>
            {!editingId && (onboardingExperience ? imagePicker : <div><label className={label}>Project images</label><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className={`${input} file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:text-paper`} />{files.length > 0 && <p className="mt-1 font-mono text-[10px] text-graphite">{files.length} image(s) selected</p>}<p className="mt-1 text-[11px] text-graphite">Up to 12 images · 36 MB total</p></div>)}
            <div><label className={label}>Project title</label><input required value={title} onChange={(event) => setTitle(event.target.value)} className={input} placeholder="A title people will remember" /></div>
            <div><label className={label}>Short description</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${input} ${onboardingExperience ? "rounded-[24px]" : ""} resize-y`} rows={3} placeholder="What is it, and what were you trying to explore?" /></div>
            <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen} className={onboardingExperience ? "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white" : "flex w-full items-center justify-between border-y border-line py-3 text-left font-mono text-[10px] uppercase tracking-widest text-graphite hover:text-ink"}><span>{detailsOpen ? "Hide" : "Add"} more project details</span>{!onboardingExperience && <span aria-hidden="true" className="text-base">{detailsOpen ? "−" : "+"}</span>}</button>
            {detailsOpen && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Project type</label><select value={projectType} onChange={(event) => setProjectType(event.target.value as typeof projectType)} className={input}>{projectTypes.map((value) => <option key={value}>{value}</option>)}</select></div><div><label className={label}>Category</label><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className={input}>{categories.map((value) => <option key={value}>{value}</option>)}</select></div></div>
                <div className="grid gap-4 sm:grid-cols-3"><div><label className={label}>Status</label><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={input}><option value="academic">Academic</option><option value="professional">Professional</option></select></div><div><label className={label}>Year</label><input type="number" min="1900" max="2100" value={year} onChange={(event) => setYear(event.target.value)} className={input} /></div><div><label className={label}>Location</label><input value={location} onChange={(event) => setLocation(event.target.value)} className={input} placeholder="Optional" /></div></div>
                <div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Role</label><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className={input}><option value="individual">Individual</option><option value="team">Team</option></select></div>{role === "team" && <div><label className={label}>Team contribution</label><input value={teamContribution} onChange={(event) => setTeamContribution(event.target.value)} className={input} placeholder="Concept design, technical drawings..." /></div>}</div>
                <div><label className={label}>Software used</label><TagInput values={software} onChange={setSoftware} placeholder="Type a tool and press Enter" /></div>
                <div><label className={label}>Process note <span className="normal-case tracking-normal">({processNote.length}/280)</span></label><textarea maxLength={280} value={processNote} onChange={(event) => setProcessNote(event.target.value)} className={`${input} resize-y`} rows={2} placeholder="One-line concept note" />{processNote.length >= 280 && <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-redline">Process note is at its 280-character limit.</p>}</div>
            </div>}
            <div className="flex flex-col items-start justify-end gap-4 border-t border-line pt-4 sm:flex-row sm:items-center"><div className="flex w-full gap-3 sm:w-auto">{editingId && <button type="button" onClick={resetForm} className={onboardingExperience ? "min-h-12 rounded-full border-2 border-ink px-5 text-sm font-semibold text-ink" : "border border-line px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-ink"}>Cancel</button>}<button disabled={saving} className={onboardingExperience ? "min-h-12 flex-1 rounded-full border-2 border-ink bg-redline px-6 text-base font-bold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none" : "border border-ink bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"}>{saving ? (files.length > 0 && !editingId ? "Uploading..." : "Saving...") : editingId ? "Update Project" : "Add project"}</button></div></div>
        </form>}
    </section>;
}
