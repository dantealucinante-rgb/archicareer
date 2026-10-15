import { getCurrentProfile } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsEditor from "./SettingsEditor";
import DeleteAccountButton from "./DeleteAccountButton";
import SettingsBackButton from "./SettingsBackButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/login");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const providers = [...new Set((user?.identities ?? []).map((identity) => identity.provider))];
    const signInMethod = providers.includes("google") && providers.includes("email")
        ? "Google and magic link"
        : providers.includes("google")
            ? "Google"
            : "Magic link";
    const roleLabel = profile.role === "firm" ? "Firm" : profile.role === "architect" ? "Architect" : "Student";

    return (
        <div className="settings-panel-enter min-h-full bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 sm:py-10">
                <header className="mb-8 flex items-start justify-between gap-5 border-b border-line pb-6">
                    <div>
                        <p className="eyebrow font-mono text-redline">Account controls</p>
                        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-graphite">Manage how your account appears and how ArchiCareer stays in touch.</p>
                    </div>
                    <SettingsBackButton />
                </header>

                <div className="space-y-5">
                    <section className="surface p-5 sm:p-7" aria-labelledby="account-heading">
                        <p className="eyebrow font-mono text-redline">Account</p>
                        <h2 id="account-heading" className="mt-2 font-display text-2xl font-semibold tracking-tight">Your account</h2>
                        <dl className="mt-6 divide-y divide-line border-y border-line">
                            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"><dt className="text-sm text-graphite">Email</dt><dd className="break-all text-sm font-medium text-ink sm:text-right">{user?.email ?? "Not available"}</dd></div>
                            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"><dt className="text-sm text-graphite">Sign-in method</dt><dd className="text-sm font-medium text-ink sm:text-right">{signInMethod}</dd></div>
                            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"><dt className="text-sm text-graphite">Account type</dt><dd className="text-sm font-medium text-ink sm:text-right">{roleLabel}</dd></div>
                        </dl>
                    </section>

                    <SettingsEditor initialMarketingEmails={profile.marketing_emails} initialSearchIndexable={profile.search_indexable} />

                    <DeleteAccountButton />
                </div>
            </main>
        </div>
    );
}
