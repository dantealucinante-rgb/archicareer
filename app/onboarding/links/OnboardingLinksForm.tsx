"use client";
/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile } from "@/types";
import { ARCHITECTURE_SOFTWARE } from "@/lib/profile-options";
import { compressImageForUpload } from "@/lib/image-compression";
import { ArrowLeft, ArrowRight, Check, Close } from "@/app/components/UiIcon";

const COMMON_TOOLS = ARCHITECTURE_SOFTWARE.slice(0, 10);

function SelectedTools({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
    if (values.length === 0) return <p className="rounded-xl border border-dashed border-line px-3 py-2.5 text-xs text-graphite">No tools selected yet.</p>;
    return <div className="flex flex-wrap gap-1.5">{values.map((value) => <button key={value} type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((item) => item !== value))} className="interactive inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink bg-ink px-2.5 font-mono text-[10px] uppercase tracking-wide text-paper hover:border-redline hover:bg-redline"><span>{value}</span><Close className="h-3 w-3" /></button>)}</div>;
}

function ToolEntry({ value, onAdd }: { value: string; onAdd: () => void }) {
    return <button type="button" aria-label={`Add ${value}`} onClick={onAdd} className="interactive min-h-10 rounded-lg border border-line bg-warm-white px-3 text-left text-xs text-ink hover:border-redline hover:text-redline focus-visible:border-redline focus-visible:ring-2 focus-visible:ring-redline/20">{value}<span className="ml-1 text-graphite">+</span></button>;
}

function CustomToolInput({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
    const [draft, setDraft] = useState("");
    function addTag() { const value = draft.trim(); if (value && !values.includes(value)) onChange([...values, value]); setDraft(""); }
    return <div className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} className="field-input mt-0 min-h-10 text-sm" placeholder="Add another tool" aria-label="Add a custom tool" /><button type="button" onClick={addTag} className="interactive min-h-10 shrink-0 rounded-lg border border-ink bg-ink px-3 font-mono text-[10px] uppercase tracking-wider text-paper hover:border-redline hover:bg-redline">Add</button></div>;
}

function FileUploadCard({ kind, file, existingUrl, onChange, onClear }: { kind: "avatar" | "cv"; file: File | null; existingUrl?: string | null; onChange: (file: File | null) => void; onClear: () => void }) {
    const inputId = `onboarding-${kind}-upload`;
    const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
    useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const nextFile = event.target.files?.[0] ?? null;
        if (kind === "avatar" && nextFile) setPreview(URL.createObjectURL(nextFile));
        onChange(nextFile);
    }
    function handleClear() { setPreview(existingUrl ?? null); onClear(); }
    return <div className="rounded-xl border border-line bg-warm-white p-3.5">
        <div className="mb-3 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{kind === "avatar" ? "Profile photo" : "CV / resume"}</p><p className="mt-0.5 text-[11px] text-graphite">{kind === "avatar" ? "JPG, PNG, or WebP · 2 MB max" : "PDF only"}</p></div>{(file || existingUrl) && <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-redline"><Check className="h-3 w-3" /> Added</span>}</div>
        <label htmlFor={inputId} className="group flex min-h-[76px] cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line bg-paper px-3 transition-colors hover:border-redline focus-within:border-redline focus-within:ring-2 focus-within:ring-redline/20">
            {kind === "avatar" && preview ? <img src={preview} alt="Profile preview" className="h-12 w-12 rounded-lg object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-sand text-sm font-semibold text-redline">{kind === "avatar" ? "＋" : "PDF"}</span>}
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-ink">{file?.name ?? (existingUrl ? (kind === "avatar" ? "Current profile photo" : "Current CV attached") : `Choose ${kind === "avatar" ? "a photo" : "a PDF"}`)}</span><span className="mt-1 block text-[11px] text-graphite">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ready to upload` : "Tap to browse files"}</span></span>
            <span className="shrink-0 rounded-md border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-graphite group-hover:border-redline group-hover:text-redline">Browse</span>
            <input id={inputId} type="file" accept={kind === "avatar" ? "image/jpeg,image/png,image/webp" : "application/pdf,.pdf"} className="sr-only" onChange={handleChange} />
        </label>
        {file && <button type="button" onClick={handleClear} className="mt-2 inline-flex min-h-8 items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-graphite hover:text-redline"><Close className="h-3 w-3" /> Remove selection</button>}
    </div>;
}

export default function OnboardingLinksForm({ profile }: { profile: Profile }) {
    const router = useRouter();
    const [software, setSoftware] = useState(profile.software_proficiency ?? []);
    const [instagram, setInstagram] = useState(profile.instagram_url ?? "");
    const [site, setSite] = useState(profile.personal_site_url ?? "");
    const [linkedin, setLinkedin] = useState(profile.linkedin_url ?? "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [toolSearch, setToolSearch] = useState("");

    async function uploadFile(bucket: "avatars" | "cv-documents", file: File, filename: string) {
        const formData = new FormData(); formData.set("bucket", bucket); formData.set("file", file, filename);
        const response = await fetch("/api/storage", { method: "POST", body: formData });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? "Unable to upload file.");
        return payload.url as string;
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); setSaving(true); setMessage("");
        for (const value of [instagram, site, linkedin]) { if (!value.trim()) continue; try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { setMessage("Use full links beginning with https://."); setSaving(false); return; } }
        try {
            let avatarUrl: string | undefined; let cvUrl: string | undefined;
            if (avatarFile) { if (!["image/jpeg", "image/png", "image/webp"].includes(avatarFile.type)) throw new Error("Profile image must be a JPG, PNG, or WebP file."); if (avatarFile.size > 2 * 1024 * 1024) throw new Error("Profile image must be 2 MB or smaller."); setMessage("Compressing profile image..."); const compressedAvatar = await compressImageForUpload(avatarFile, "avatar"); setMessage("Uploading profile image..."); avatarUrl = await uploadFile("avatars", compressedAvatar, compressedAvatar.name); }
            if (cvFile) { setMessage("Uploading CV..."); if (cvFile.type !== "application/pdf") throw new Error("CV must be a PDF file."); cvUrl = await uploadFile("cv-documents", cvFile, "resume.pdf"); }
            const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ software_proficiency: software, instagram_url: instagram, personal_site_url: site, linkedin_url: linkedin, ...(avatarUrl ? { avatar_url: avatarUrl } : {}), ...(cvUrl ? { cv_url: cvUrl } : {}) }) });
            const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error ?? "Unable to save this step.");
            router.push("/onboarding/portfolio");
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save this step."); setSaving(false); }
    }

    const input = "field-input mt-2 text-sm";
    const label = "block font-mono text-[10px] uppercase tracking-widest text-graphite";
    const additionalTools = ARCHITECTURE_SOFTWARE.filter((tool) => !COMMON_TOOLS.includes(tool) && !software.includes(tool) && tool.toLowerCase().includes(toolSearch.toLowerCase().trim()));
    const toggleTool = (tool: string) => setSoftware((current) => current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool]);
    return <section className="mx-auto max-w-3xl">
        <div className="mb-7"><p className="eyebrow font-mono text-redline">02 / LINKS & FILES</p><h1 className="display-balance mt-2 max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Show us what you work with.</h1><p className="mt-2 max-w-lg text-sm leading-relaxed text-graphite">Add the tools, links, and files that help people understand your practice.</p></div>
        <form className="space-y-5" onSubmit={submit}>
            <section className="surface p-4 sm:p-5" aria-labelledby="software-heading"><div className="flex items-start justify-between gap-4"><div><h2 id="software-heading" className="text-sm font-semibold">Software & tools</h2><p className="mt-1 text-xs text-graphite">Pick the tools you use most. Add anything else below.</p></div><span className="font-mono text-[9px] uppercase tracking-wider text-graphite">{software.length} selected</span></div><div className="mt-4"><p className={label}>Selected tools</p><div className="mt-2"><SelectedTools values={software} onChange={setSoftware} /></div></div><div className="mt-4"><p className={label}>Common tools</p><div className="mt-2 flex flex-wrap gap-2">{COMMON_TOOLS.filter((tool) => !software.includes(tool)).map((tool) => <ToolEntry key={tool} value={tool} onAdd={() => toggleTool(tool)} />)}</div></div><div className="mt-4"><label htmlFor="tool-search" className={label}>Find another tool</label><input id="tool-search" value={toolSearch} onChange={(event) => setToolSearch(event.target.value)} className="field-input mt-2 text-sm" placeholder="Search the full tool list" />{toolSearch.trim() && <div className="mt-2 flex flex-wrap gap-2">{additionalTools.length > 0 ? additionalTools.map((tool) => <ToolEntry key={tool} value={tool} onAdd={() => { toggleTool(tool); setToolSearch(""); }} />) : <p className="text-xs text-graphite">No matching tool. Add it below.</p>}</div>}</div><div className="mt-4 border-t border-line pt-4"><p className={label}>Custom tool</p><div className="mt-2"><CustomToolInput values={software} onChange={setSoftware} /></div></div></section>
            <section className="surface p-4 sm:p-5" aria-labelledby="links-heading"><div className="mb-4"><h2 id="links-heading" className="text-sm font-semibold">Links <span className="font-normal text-graphite">· optional</span></h2><p className="mt-1 text-xs text-graphite">Give people a few more ways to find your work.</p></div><div className="grid gap-4 sm:grid-cols-3"><div><label htmlFor="onboarding-instagram" className={label}>Instagram</label><input id="onboarding-instagram" type="url" value={instagram} onChange={(event) => setInstagram(event.target.value)} className={input} placeholder="https://instagram.com/..." /></div><div><label htmlFor="onboarding-site" className={label}>Portfolio website</label><input id="onboarding-site" type="url" value={site} onChange={(event) => setSite(event.target.value)} className={input} placeholder="https://..." /></div><div><label htmlFor="onboarding-linkedin" className={label}>LinkedIn</label><input id="onboarding-linkedin" type="url" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} className={input} placeholder="https://linkedin.com/in/..." /></div></div></section>
            <section className="surface p-4 sm:p-5" aria-labelledby="files-heading"><div className="mb-4"><h2 id="files-heading" className="text-sm font-semibold">Files <span className="font-normal text-graphite">· optional</span></h2><p className="mt-1 text-xs text-graphite">A clear photo and CV make your profile easier to trust.</p></div><div className="grid gap-3 sm:grid-cols-2"><FileUploadCard kind="avatar" file={avatarFile} existingUrl={profile.avatar_url} onChange={setAvatarFile} onClear={() => setAvatarFile(null)} /><FileUploadCard kind="cv" file={cvFile} existingUrl={profile.cv_url} onChange={setCvFile} onClear={() => setCvFile(null)} /></div></section>
            <div className="sticky bottom-3 z-10 -mx-1 flex flex-col gap-3 rounded-xl border border-line bg-warm-white/95 p-2.5 shadow-lg backdrop-blur-md sm:bottom-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-2 px-2"><a href="/onboarding/about" className="interactive inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 font-mono text-[10px] uppercase tracking-wider text-graphite hover:bg-paper hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back</a><p aria-live="polite" className={`truncate text-xs ${message.startsWith("Unable") || message.startsWith("Use full") || message.includes("must") ? "text-redline" : "text-graphite"}`}>{message}</p></div><button type="submit" disabled={saving} className="interactive inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-ink bg-ink px-4 font-mono text-[10px] uppercase tracking-wider text-paper hover:border-redline hover:bg-redline disabled:opacity-60 sm:w-auto">{saving ? "Saving…" : "Continue to portfolio"}<ArrowRight className="h-3.5 w-3.5" /></button></div>
            {saving && <div role="status" className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-graphite"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-redline" />{message || "Saving your profile…"}</div>}
        </form>
    </section>;
}
