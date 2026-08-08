"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { ARCHITECTURE_SOFTWARE, NIGERIAN_ARCHITECTURE_SCHOOLS, NIGERIAN_STATES } from "@/lib/profile-options";

type Props = { profile: Profile | null; variant?: "individual" | "firm" };

function TagsInput({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
    const [draft, setDraft] = useState("");

    function addTag() {
        const value = draft.trim();
        if (value && !values.includes(value)) onChange([...values, value]);
        setDraft("");
    }

    return (
        <div className="rounded-2xl border border-line bg-warm-white p-3">
            <div className="mb-2 flex flex-wrap gap-2">
                {values.map((value) => (
                    <button key={value} type="button" onClick={() => onChange(values.filter((item) => item !== value))} className="rounded-full border border-line bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink transition-colors hover:border-redline hover:text-redline">
                        {value} x
                    </button>
                ))}
            </div>
            <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }}
                className="w-full bg-transparent px-1 py-1 font-sans text-sm text-ink outline-none"
                placeholder={placeholder}
            />
        </div>
    );
}

export default function ProfileEditor({ profile, variant = "individual" }: Props) {
    const router = useRouter();
    const canUploadAvatar = variant === "individual";
    const [name, setName] = useState(profile?.name ?? "");
    const [bio, setBio] = useState(profile?.bio ?? "");
    const [schoolOrFirm, setSchoolOrFirm] = useState(profile?.school_or_firm ?? "");
    const [location, setLocation] = useState(profile?.location ?? "");
    const [slug, setSlug] = useState(profile?.slug ?? "");
    const [software, setSoftware] = useState(profile?.software_proficiency ?? []);
    const [cvUrl] = useState(profile?.cv_url ?? "");
    const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url ?? "");
    const [siteUrl, setSiteUrl] = useState(profile?.personal_site_url ?? "");
    const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? "");
    const [avatarUrl] = useState(profile?.avatar_url ?? "");
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [publicSlug, setPublicSlug] = useState(profile?.slug ?? "");

    async function uploadCv() {
        if (!cvFile || !profile) return { url: cvUrl || null, path: null };
        if (cvFile.type !== "application/pdf") throw new Error("CV must be a PDF file");
        const formData = new FormData();
        formData.set("bucket", "cv-documents");
        formData.set("file", cvFile, "resume.pdf");
        const response = await fetch("/api/storage", { method: "POST", body: formData });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error ?? "Unable to upload CV");
        return { url: result.url, path: result.path };
    }

    async function uploadAvatar() {
        if (!canUploadAvatar || !avatarFile || !profile) return { url: avatarUrl || null, path: null };
        const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
        if (!allowedTypes.has(avatarFile.type)) throw new Error("Avatar must be a JPG, PNG, or WebP image");
        if (avatarFile.size > 2 * 1024 * 1024) throw new Error("Avatar must be 2 MB or smaller");
        const extension = avatarFile.type === "image/png" ? "png" : avatarFile.type === "image/webp" ? "webp" : "jpg";
        const formData = new FormData();
        formData.set("bucket", "avatars");
        formData.set("file", avatarFile, `avatar.${extension}`);
        const response = await fetch("/api/storage", { method: "POST", body: formData });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error ?? "Unable to upload avatar");
        return { url: result.url, path: result.path };
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!profile) { setStatus("error"); setMessage("No profile record is available."); return; }
        const nextErrors: Record<string, string> = {};
        if (!name.trim()) nextErrors.name = "Name is required.";
        for (const [field, value] of [["instagram", instagramUrl], ["site", siteUrl], ["linkedin", linkedinUrl]] as const) {
            if (!value.trim()) continue;
            try {
                const url = new URL(value);
                if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
            } catch { nextErrors[field] = "Enter a valid URL beginning with https://."; }
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) { setStatus("error"); setMessage("Please correct the highlighted fields."); return; }
        setStatus("saving"); setMessage("");
        try {
            const uploadedCv = await uploadCv();
            const uploadedAvatar = await uploadAvatar();
            const response = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, bio, school_or_firm: schoolOrFirm, location, slug, software_proficiency: software, cv_url: uploadedCv.url, avatar_url: uploadedAvatar.url, instagram_url: instagramUrl, personal_site_url: siteUrl, linkedin_url: linkedinUrl }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (uploadedCv.path) await createClient().storage.from("cv-documents").remove([uploadedCv.path]);
                if (uploadedAvatar.path) await createClient().storage.from("avatars").remove([uploadedAvatar.path]);
                throw new Error(payload.error ?? "Unable to save profile");
            }
            setPublicSlug(payload.profile.slug);
            setStatus("saved"); setMessage("Profile saved successfully.");
            router.refresh();
        } catch (error) {
            setStatus("error"); setMessage(error instanceof Error ? error.message : "Unable to save profile");
        }
    }

    const fieldClass = "field-input mt-2 text-sm";
    const labelClass = "block font-mono text-[10px] uppercase tracking-widest text-graphite";

    return (
        <form className="space-y-12" onSubmit={handleSubmit}>
            <section id="about" className="scroll-mt-28">
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-4"><div><p className="eyebrow font-mono text-redline">01 / {variant === "firm" ? "ABOUT THE PRACTICE" : "ABOUT YOU"}</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{variant === "firm" ? "The organisation essentials" : "The essentials"}</h2></div><span className="hidden text-right text-xs leading-relaxed text-graphite sm:block">{variant === "firm" ? <>A clear introduction<br />to the practice.</> : <>A clear first impression<br />for people who find you.</>}</span></div>
                <div className="space-y-5">
                    <div><label className={labelClass}>{variant === "firm" ? "Organisation name" : "Name"}</label><input required aria-invalid={Boolean(errors.name)} type="text" value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: "" })); }} className={fieldClass} placeholder={variant === "firm" ? "Studio or company name" : "Your Name"} />{errors.name && <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-redline">{errors.name}</p>}</div>
                    <div className="grid gap-5 sm:grid-cols-2"><div><label className={labelClass}>{variant === "firm" ? "Practice focus / firm" : "School / Firm"}</label><input list="nigerian-schools" value={schoolOrFirm} onChange={(event) => setSchoolOrFirm(event.target.value)} className={fieldClass} placeholder={variant === "firm" ? "Practice focus or organisation group" : "Search or type your school / firm"} /><datalist id="nigerian-schools">{NIGERIAN_ARCHITECTURE_SCHOOLS.map((school) => <option key={school} value={school} />)}</datalist></div><div><label className={labelClass}>Location / state</label><input list="nigerian-states" value={location} onChange={(event) => setLocation(event.target.value)} className={fieldClass} placeholder="Select a state or type a city" /><datalist id="nigerian-states">{NIGERIAN_STATES.map((state) => <option key={state} value={state} />)}</datalist></div></div>
                    <div><label className={labelClass}>Short public link</label><input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} className={fieldClass} pattern="[a-z0-9-]+" minLength={2} /><p className="mt-2 text-xs text-graphite">Your profile will be available at archicareer.ng/p/{slug || "your-name"}</p></div>
                    <div><label className={labelClass}>{variant === "firm" ? "About the organisation" : "Bio"}</label><textarea value={bio} onChange={(event) => setBio(event.target.value)} className={`${fieldClass} resize-y`} rows={5} placeholder={variant === "firm" ? "What does the organisation do, and what kind of work does it take on?" : "What do you do, care about, or want to work on?"} /></div>
                    <div><label className={labelClass}>{variant === "firm" ? "Tools & capabilities" : "Software proficiency"}</label><p className="mt-2 text-xs text-graphite">Choose common tools below or add your own.</p><div className="mt-3 flex flex-wrap gap-2">{ARCHITECTURE_SOFTWARE.map((tool) => <button key={tool} type="button" onClick={() => setSoftware((current) => current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool])} className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${software.includes(tool) ? "border-ink bg-ink text-paper" : "border-line bg-warm-white text-graphite hover:border-redline hover:text-redline"}`}>{tool}</button>)}</div><div className="mt-3"><TagsInput values={software} onChange={setSoftware} placeholder={variant === "firm" ? "Add another capability or tool" : "Add another tool and press Enter"} /></div></div>
                </div>
            </section>

            <section id="links" className="scroll-mt-28">
                <div className="mb-6 border-b border-line pb-4"><p className="eyebrow font-mono text-redline">02 / {variant === "firm" ? "CONTACT & LINKS" : "LINKS & FILES"}</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{variant === "firm" ? "Help people reach the practice" : "Give people more ways in"}</h2></div>
                <div className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2"><div><label className={labelClass}>Instagram URL</label><input type="url" aria-invalid={Boolean(errors.instagram)} value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className={fieldClass} placeholder="https://instagram.com/..." />{errors.instagram && <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-redline">{errors.instagram}</p>}</div><div><label className={labelClass}>Personal site URL</label><input type="url" aria-invalid={Boolean(errors.site)} value={siteUrl} onChange={(event) => setSiteUrl(event.target.value)} className={fieldClass} placeholder="https://..." />{errors.site && <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-redline">{errors.site}</p>}</div><div><label className={labelClass}>LinkedIn URL</label><input type="url" aria-invalid={Boolean(errors.linkedin)} value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} className={fieldClass} placeholder="https://linkedin.com/in/..." />{errors.linkedin && <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-redline">{errors.linkedin}</p>}</div></div>
                    <div className="grid gap-5 sm:grid-cols-2">{canUploadAvatar && <div><label className={labelClass}>Add or replace profile photo</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} className={`${fieldClass} file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:text-paper`} />{avatarUrl && <p className="mt-2 text-xs text-graphite">Choose a new photo to replace the current one.</p>}<p className="mt-1 text-[11px] text-graphite">JPG, PNG, or WebP · max 2 MB</p></div>}<div><label className={labelClass}>CV / resume PDF</label><input type="file" accept="application/pdf,.pdf" onChange={(event) => setCvFile(event.target.files?.[0] ?? null)} className={`${fieldClass} file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:text-paper`} />{cvUrl && <p className="mt-2 text-xs text-graphite">Existing CV attached.</p>}</div></div>
                </div>
            </section>

            <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-line bg-warm-white/95 p-3 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                <div aria-live="polite" className="flex flex-wrap items-center gap-3 px-2 font-mono text-[10px] uppercase tracking-widest"><p className={status === "error" ? "text-redline" : "text-graphite"}>{status === "saving" ? "Saving..." : status === "idle" ? "Changes apply to your profile." : message}</p>{status === "saved" && publicSlug && <a href={`/p/${publicSlug}`} className="text-ink underline underline-offset-4">View public profile</a>}</div>
                <button type="submit" disabled={status === "saving"} className="interactive inline-flex items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-mono text-xs uppercase tracking-widest text-paper hover:border-redline hover:bg-redline disabled:cursor-not-allowed disabled:opacity-70">{status === "saving" ? "Saving..." : "Save profile"}</button>
            </div>
        </form>
    );
}
