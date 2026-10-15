"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/types";
import { NIGERIAN_ARCHITECTURE_SCHOOLS, NIGERIAN_STATES } from "@/lib/profile-options";

export default function OnboardingAboutForm({ profile }: { profile: Profile }) {
    const router = useRouter();
    const [name, setName] = useState(profile.name ?? "");
    const [school, setSchool] = useState(profile.school_or_firm ?? "");
    const [location, setLocation] = useState(profile.location ?? "");
    const [bio, setBio] = useState(profile.bio ?? "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!name.trim()) { setMessage("Add your name to continue."); return; }
        setSaving(true); setMessage("");
        const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, school_or_firm: school, location, bio }) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { setMessage(payload.error ?? "Unable to save this step."); setSaving(false); return; }
        router.push("/onboarding/links");
    }

    const input = "field-input mt-2 text-sm";
    const label = "block font-mono text-[10px] uppercase tracking-widest text-graphite";
    return (
        <section className="mx-auto max-w-3xl">
            <div className="mb-7">
                <p className="eyebrow font-mono text-redline">01 / ABOUT YOU</p>
                <h1 className="display-balance mt-2 max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Start with the essentials.</h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-graphite">Give people a clear first impression of who you are and where your work sits.</p>
            </div>
            <form className="space-y-6" onSubmit={submit}>
                <div><label htmlFor="onboarding-name" className={label}>Name</label><input id="onboarding-name" required value={name} onChange={(event) => setName(event.target.value)} className={input} placeholder="Your name" /></div>
                <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="onboarding-school" className={label}>School / firm</label><input id="onboarding-school" list="onboarding-nigerian-schools" value={school} onChange={(event) => setSchool(event.target.value)} className={input} placeholder="Search or type your school / firm" /><datalist id="onboarding-nigerian-schools">{NIGERIAN_ARCHITECTURE_SCHOOLS.map((schoolName) => <option key={schoolName} value={schoolName} />)}</datalist></div><div><label htmlFor="onboarding-location" className={label}>Location / state</label><input id="onboarding-location" list="onboarding-nigerian-states" value={location} onChange={(event) => setLocation(event.target.value)} className={input} placeholder="Select a state or type a city" /><datalist id="onboarding-nigerian-states">{NIGERIAN_STATES.map((state) => <option key={state} value={state} />)}</datalist></div></div>
                <div><label htmlFor="onboarding-bio" className={label}>A little about you</label><textarea id="onboarding-bio" value={bio} onChange={(event) => setBio(event.target.value)} className={`${input} resize-y`} rows={6} placeholder="What do you do, care about, or want to work on?" /></div>
                <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border border-line bg-warm-white/95 p-2.5 shadow-lg backdrop-blur-md sm:bottom-4 sm:flex-row sm:items-center sm:justify-between"><p aria-live="polite" className="px-2 text-xs text-redline">{message}</p><button disabled={saving} className="interactive inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-ink bg-ink px-4 font-mono text-[10px] uppercase tracking-wider text-paper hover:border-redline hover:bg-redline disabled:opacity-60 sm:w-auto">{saving ? "Saving…" : "Continue to links ↗"}</button></div>
                {saving && <div role="status" className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-graphite"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-redline" />Saving your details…</div>}
            </form>
        </section>
    );
}
