"use client";

import { useState } from "react";

export default function SettingsEditor({ initialMarketingEmails }: { initialMarketingEmails: boolean }) {
    const [marketingEmails, setMarketingEmails] = useState(initialMarketingEmails);
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
                body: JSON.stringify({ marketing_emails: marketingEmails }),
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
        <form className="space-y-6" onSubmit={submit}>
            <div className="flex items-center">
                <input
                    id="marketing_emails"
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(event) => setMarketingEmails(event.target.checked)}
                    className="h-4 w-4 accent-redline border-line rounded-[2px] cursor-pointer bg-paper"
                />
                <label htmlFor="marketing_emails" className="ml-2 block font-mono text-xs uppercase tracking-wider text-graphite select-none cursor-pointer">
                    Allow future job-alert emails
                </label>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
                <p aria-live="polite" className={`font-mono text-[10px] uppercase tracking-widest ${error ? "text-redline" : "text-graphite"}`}>{message}</p>
                <button type="submit" disabled={saving} className="bg-redline text-paper px-6 py-2.5 rounded-[2px] font-mono text-xs uppercase tracking-widest hover:bg-opacity-90 border border-redline cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </form>
    );
}
