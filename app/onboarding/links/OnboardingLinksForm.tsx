"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/types";
import { ARCHITECTURE_SOFTWARE } from "@/lib/profile-options";
import { compressImageForUpload } from "@/lib/image-compression";

function TagsInput({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
    const [draft, setDraft] = useState("");
    function addTag() { const value = draft.trim(); if (value && !values.includes(value)) onChange([...values, value]); setDraft(""); }
    return <div className="rounded-2xl border border-line bg-warm-white p-3"><div className="mb-2 flex flex-wrap gap-2">{values.map((value) => <button key={value} type="button" onClick={() => onChange(values.filter((item) => item !== value))} className="rounded-full border border-line bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink hover:border-redline hover:text-redline">{value} ×</button>)}</div><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} className="w-full bg-transparent px-1 py-1 text-sm text-ink outline-none" placeholder="Type a tool and press Enter" /></div>;
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

    async function uploadFile(bucket: "avatars" | "cv-documents", file: File, filename: string) {
        const formData = new FormData();
        formData.set("bucket", bucket);
        formData.set("file", file, filename);
        const response = await fetch("/api/storage", { method: "POST", body: formData });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? "Unable to upload file.");
        return payload.url as string;
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); setSaving(true); setMessage("");
        for (const value of [instagram, site, linkedin]) { if (!value.trim()) continue; try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { setMessage("Use full links beginning with https://."); setSaving(false); return; } }
        try {
            let avatarUrl: string | undefined;
            let cvUrl: string | undefined;
            if (avatarFile) {
                if (!["image/jpeg", "image/png", "image/webp"].includes(avatarFile.type)) throw new Error("Profile image must be a JPG, PNG, or WebP file.");
                if (avatarFile.size > 2 * 1024 * 1024) throw new Error("Profile image must be 2 MB or smaller.");
                setMessage("Compressing profile image...");
                const compressedAvatar = await compressImageForUpload(avatarFile, "avatar");
                setMessage("Uploading profile image...");
                avatarUrl = await uploadFile("avatars", compressedAvatar, compressedAvatar.name);
            }
            if (cvFile) {
                setMessage("Uploading CV...");
                if (cvFile.type !== "application/pdf") throw new Error("CV must be a PDF file.");
                cvUrl = await uploadFile("cv-documents", cvFile, "resume.pdf");
            }
            const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ software_proficiency: software, instagram_url: instagram, personal_site_url: site, linkedin_url: linkedin, ...(avatarUrl ? { avatar_url: avatarUrl } : {}), ...(cvUrl ? { cv_url: cvUrl } : {}) }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to save this step.");
            router.push("/onboarding/portfolio");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to save this step.");
            setSaving(false);
        }
    }

    const input = "field-input mt-2 text-sm";
    const label = "block font-mono text-[10px] uppercase tracking-widest text-graphite";
    return (
        <section className="surface mx-auto max-w-3xl p-6 sm:p-10">
            <div className="mb-8 border-b border-line pb-6"><p className="eyebrow font-mono text-redline">02 / LINKS & FILES</p><h1 className="display-balance mt-3 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl">Give people more ways in.</h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-graphite">Add the tools, links, and files that help people understand your range.</p></div>
            <form className="space-y-6" onSubmit={submit}>
                <div><label className={label}>Software proficiency</label><p className="mt-2 text-xs text-graphite">Choose common tools below or add your own.</p><div className="mt-3 flex flex-wrap gap-2">{ARCHITECTURE_SOFTWARE.map((tool) => <button key={tool} type="button" onClick={() => setSoftware((current) => current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool])} className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${software.includes(tool) ? "border-ink bg-ink text-paper" : "border-line bg-warm-white text-graphite hover:border-redline hover:text-redline"}`}>{tool}</button>)}</div><div className="mt-3"><TagsInput values={software} onChange={setSoftware} /></div></div>
                <div className="grid gap-5 sm:grid-cols-2"><div><label className={label}>Instagram URL</label><input type="url" value={instagram} onChange={(event) => setInstagram(event.target.value)} className={input} placeholder="https://instagram.com/..." /></div><div><label className={label}>Personal site URL</label><input type="url" value={site} onChange={(event) => setSite(event.target.value)} className={input} placeholder="https://..." /></div><div><label className={label}>LinkedIn URL</label><input type="url" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} className={input} placeholder="https://linkedin.com/in/..." /></div></div>
                <div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-2"><div><label className={label}>Profile image</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} className={`${input} file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:text-paper`} />{profile.avatar_url && <p className="mt-2 text-xs text-graphite">Existing image attached.</p>}</div><div><label className={label}>CV / resume PDF</label><input type="file" accept="application/pdf,.pdf" onChange={(event) => setCvFile(event.target.files?.[0] ?? null)} className={`${input} file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:text-paper`} />{profile.cv_url && <p className="mt-2 text-xs text-graphite">Existing CV attached.</p>}</div></div>
                <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><a href="/onboarding/about" className="font-mono text-[10px] uppercase tracking-widest text-graphite hover:text-ink">← Back</a><p aria-live="polite" className="font-mono text-[10px] uppercase tracking-widest text-redline">{message}</p></div><button disabled={saving} className="interactive inline-flex items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-mono text-xs uppercase tracking-widest text-paper hover:border-redline hover:bg-redline disabled:opacity-60">{saving ? "Saving..." : "Continue to portfolio ↗"}</button></div>
            </form>
        </section>
    );
}
