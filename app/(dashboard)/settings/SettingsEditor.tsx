"use client";

import { useState } from "react";

export default function SettingsEditor({ initialMarketingEmails, initialSearchIndexable }: { initialMarketingEmails: boolean; initialSearchIndexable: boolean }) {
    const [marketingEmails, setMarketingEmails] = useState(initialMarketingEmails);
    const [searchIndexable, setSearchIndexable] = useState(initialSearchIndexable);
    const [toggleInitialized, setToggleInitialized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError(false);
        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ marketing_emails: marketingEmails, search_indexable: searchIndexable }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to save settings");
            setMessage("Settings saved.");
        } catch (submitError) {
            setError(true);
            setMessage(submitError instanceof Error ? submitError.message : "Unable to save settings");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="space-y-5" onSubmit={submit}>
            <section className="surface p-5 sm:p-7" aria-labelledby="notifications-heading">
                <p className="eyebrow font-mono text-redline">Notifications</p>
                <h2 id="notifications-heading" className="mt-2 font-display text-2xl font-semibold tracking-tight">Stay in the loop</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-graphite">Save your preference for future job-alert emails. We do not send alerts yet.</p>
                <div className="mt-6 flex items-center justify-between gap-5 border-y border-line py-4">
                    <div><p className="text-sm font-medium text-ink">Save my job-alert preference</p><p className="mt-1 text-xs leading-relaxed text-graphite">We’ll use this when job alerts become available.</p></div>
                    <button type="button" role="switch" aria-label="Allow job-alert emails" aria-checked={marketingEmails} data-on={marketingEmails} className={`t-toggle interactive relative h-7 w-12 shrink-0 rounded-full bg-line p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D70E8] data-[on=true]:bg-[#1D70E8] ${toggleInitialized ? "is-init" : ""}`} onClick={() => { setToggleInitialized(true); setMarketingEmails((current) => !current); }}><span className="t-toggle-thumb block h-5 w-5 rounded-full bg-warm-white shadow-sm" /></button>
                </div>
            </section>
            <section className="surface p-5 sm:p-7" aria-labelledby="privacy-heading">
                <p className="eyebrow font-mono text-redline">Privacy</p>
                <h2 id="privacy-heading" className="mt-2 font-display text-2xl font-semibold tracking-tight">Control your visibility</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-graphite">Decide whether your public profile can appear in search engines such as Google.</p>
                <div className="mt-6 flex items-center justify-between gap-5 border-y border-line py-4">
                    <div><p className="text-sm font-medium text-ink">Show my profile in search engines</p><p className="mt-1 max-w-xl text-xs leading-relaxed text-graphite">When enabled, your public profile may appear in Google and other search results.</p></div>
                    <button type="button" role="switch" aria-label="Show my profile in search engines" aria-checked={searchIndexable} data-on={searchIndexable} className={`t-toggle interactive relative h-7 w-12 shrink-0 rounded-full bg-line p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D70E8] data-[on=true]:bg-[#1D70E8] ${toggleInitialized ? "is-init" : ""}`} onClick={() => { setToggleInitialized(true); setSearchIndexable((current) => !current); }}><span className="t-toggle-thumb block h-5 w-5 rounded-full bg-warm-white shadow-sm" /></button>
                </div>
                <p className="mt-4 text-sm text-graphite">Your profile remains available on ArchiCareer when this setting is turned off.</p>
            </section>
            <div className="flex flex-col items-start justify-between gap-4 border-t border-line pt-5 sm:flex-row sm:items-center">
                <p aria-live="polite" className={`text-sm ${error ? "text-redline" : "text-graphite"}`}>{message}</p>
                <button type="submit" disabled={saving} className="interactive rounded-full border border-[#1D70E8] bg-[#1D70E8] px-6 py-3 text-sm font-semibold text-paper hover:bg-[#1558B0] disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </form>
    );
}
