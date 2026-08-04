"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NextImage from "next/image";
import type { PortfolioItem } from "@/types";

type Props = { initialItems: PortfolioItem[]; variant?: "individual" | "firm" };
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

export default function PortfolioEditor({ initialItems, variant = "individual" }: Props) {
    const [items, setItems] = useState(initialItems);
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

    async function uploadImages() {
        const maxFiles = 12;
        const maxTotalBytes = 50 * 1024 * 1024;
        if (files.length > maxFiles) throw new Error(`A project can contain at most ${maxFiles} images`);
        if (files.reduce((total, file) => total + file.size, 0) > maxTotalBytes) throw new Error("Portfolio images must total 50 MB or less");
        const urls: string[] = [];
        const paths: string[] = [];
        try {
            for (const file of files) {
                if (!file.type.startsWith("image/")) throw new Error("Portfolio files must be images");
                if (file.size > 10 * 1024 * 1024) throw new Error("Each portfolio image must be 10 MB or smaller");
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "image";
                const formData = new FormData();
                formData.set("bucket", "portfolio-images");
                formData.set("file", file, safeName);
                const response = await fetch("/api/storage", { method: "POST", body: formData });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error ?? "Unable to upload image");
                paths.push(result.path);
                urls.push(result.url);
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
        } finally { setSaving(false); }
    }

    function resetForm() {
        setEditingId(null); setTitle(""); setDescription(""); setProjectType("academic_studio"); setCategory("academic"); setRole("individual"); setTeamContribution(""); setSoftware([]); setYear(""); setStatus("academic"); setLocation(""); setProcessNote(""); setFiles([]);
    }

    function editItem(item: PortfolioItem) {
        setEditingId(item.id); setTitle(item.title); setDescription(item.description ?? ""); setProjectType(item.project_type); setCategory(item.category); setRole(item.role); setTeamContribution(item.team_contribution ?? ""); setSoftware(item.software_used); setYear(item.year?.toString() ?? ""); setStatus(item.status); setLocation(item.location ?? ""); setProcessNote(item.process_note ?? ""); setMessage("Editing selected project.");
    }

    async function moveImage(item: PortfolioItem, index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= item.images.length) return;
        const images = [...item.images];
        [images[index], images[target]] = [images[target], images[index]];
        const response = await fetch("/api/portfolio", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, imageOrder: images.map((image) => image.id) }) });
        if (response.ok) setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, images } : currentItem));
    }

    async function removeImage(item: PortfolioItem, imageId: string) {
        const response = await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageId }) });
        if (response.ok) setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, images: currentItem.images.filter((image) => image.id !== imageId) } : currentItem));
    }

    async function removeItem(id: string) {
        const response = await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
    }

    const input = "field-input text-sm";
    const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-graphite";

    return <section id="portfolio" className="mt-16 scroll-mt-28 border-t border-line pt-12">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow font-mono text-redline">03 / {variant === "firm" ? "SELECTED WORK" : "PORTFOLIO"}</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{variant === "firm" ? "Company projects" : "Your project work"}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-graphite">{variant === "firm" ? "Add the work that shows what the practice can do." : "Add the projects that help people understand how you think and what you can do."}</p></div><span className="font-mono text-[10px] text-graphite">{String(items.length).padStart(2, "0")} ITEMS</span></div>
        <div className="space-y-3">{items.length === 0 ? <div className="rounded-2xl border border-dashed border-line p-7 text-center text-sm text-graphite">No projects yet. Add your first one below.</div> : items.map((item) => <div key={item.id} className="rounded-2xl border border-line bg-warm-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-base font-semibold text-ink">{item.title}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-graphite">{item.status}{" // "}{item.images.length} images</p></div><div className="flex gap-4"><button type="button" onClick={() => editItem(item)} className="font-mono text-[10px] uppercase tracking-widest text-ink transition-colors hover:text-redline">Edit</button><button type="button" onClick={() => removeItem(item.id)} className="font-mono text-[10px] uppercase tracking-widest text-redline">Remove</button></div></div>{item.images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{item.images.map((image, index) => <div key={image.id} className="relative overflow-hidden rounded-xl"><NextImage src={image.image_url} alt={item.title} width={640} height={360} className="aspect-video w-full object-cover" /><div className="absolute bottom-1 left-1 flex gap-1"><button type="button" aria-label="Move image up" onClick={() => moveImage(item, index, -1)} className="rounded bg-paper px-1.5 font-mono text-[10px] text-ink">↑</button><button type="button" aria-label="Move image down" onClick={() => moveImage(item, index, 1)} className="rounded bg-paper px-1.5 font-mono text-[10px] text-ink">↓</button><button type="button" aria-label="Remove image" onClick={() => removeImage(item, image.id)} className="rounded bg-paper px-1.5 font-mono text-[10px] text-redline">×</button></div></div>)}</div>}</div>)}</div>
        <form onSubmit={handleSubmit} className="surface mt-6 space-y-5 rounded-2xl p-5 sm:p-7"><p className="eyebrow font-mono text-redline">{editingId ? "EDIT PROJECT" : "ADD A PROJECT"}</p>
            <div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Title</label><input required value={title} onChange={(event) => setTitle(event.target.value)} className={input} /></div><div><label className={label}>Project Type</label><select value={projectType} onChange={(event) => setProjectType(event.target.value as typeof projectType)} className={input}>{projectTypes.map((value) => <option key={value}>{value}</option>)}</select></div></div>
            <div><label className={label}>Description</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${input} resize-y`} rows={3} /></div>
            <div className="grid gap-4 sm:grid-cols-3"><div><label className={label}>Category</label><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className={input}>{categories.map((value) => <option key={value}>{value}</option>)}</select></div><div><label className={label}>Status</label><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={input}><option value="academic">Academic</option><option value="professional">Professional</option></select></div><div><label className={label}>Year</label><input type="number" min="1900" max="2100" value={year} onChange={(event) => setYear(event.target.value)} className={input} /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Role</label><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className={input}><option value="individual">Individual</option><option value="team">Team</option></select></div><div><label className={label}>Location</label><input value={location} onChange={(event) => setLocation(event.target.value)} className={input} /></div></div>
            {role === "team" && <div className="sheet-reveal"><label className={label}>Team Contribution</label><input value={teamContribution} onChange={(event) => setTeamContribution(event.target.value)} className={input} placeholder="Concept design, technical drawings..." /></div>}
            <div><label className={label}>Software Used</label><TagInput values={software} onChange={setSoftware} placeholder="Type a tool and press Enter" /></div>
            <div><label className={label}>Process Note <span className="normal-case tracking-normal">({processNote.length}/280)</span></label><textarea maxLength={280} value={processNote} onChange={(event) => setProcessNote(event.target.value)} className={`${input} resize-y`} rows={2} placeholder="One-line concept note" />{processNote.length >= 280 && <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-redline">Process note is at its 280-character limit.</p>}</div>
            {!editingId && <div><label className={label}>Project Images</label><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className={`${input} file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:text-paper`} />{files.length > 0 && <p className="mt-1 font-mono text-[10px] text-graphite">{files.length} image(s) selected</p>}</div>}
            <div className="flex flex-col items-start justify-between gap-4 border-t border-line pt-4 sm:flex-row sm:items-center"><p aria-live="polite" className={`font-mono text-[10px] uppercase tracking-widest ${message.startsWith("Unable") || message.includes("must be") ? "text-redline" : "text-graphite"}`}>{message}</p><div className="flex gap-3">{editingId && <button type="button" onClick={resetForm} className="border border-line px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-ink">Cancel</button>}<button disabled={saving} className="border border-ink bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-60">{saving ? (files.length > 0 && !editingId ? "Uploading..." : "Saving...") : editingId ? "Update Project" : "Add Project"}</button></div></div>
        </form>
    </section>;
}
