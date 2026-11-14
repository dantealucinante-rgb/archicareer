import { getCurrentProfile } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Pill from "@/app/components/editorial/Pill";
import editorial from "@/app/components/editorial/editorial.module.css";
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

    return <main className={editorial.page}>
        <div className={editorial.container} style={{ maxWidth: 880 }}>
            <header style={{ display: "flex", flexWrap: "wrap", alignItems: "start", justifyContent: "space-between", gap: 20, paddingBlock: "40px 28px", borderBottom: "var(--stroke)" }}>
                <div style={{ display: "grid", gap: 12 }}>
                    <h1 className={editorial.display}>Settings</h1>
                    <p className={editorial.lede}>Account details and the actions that affect your whole account.</p>
                </div>
                <SettingsBackButton />
            </header>

            <section style={{ display: "grid", gap: 16, paddingBlock: 36, borderBottom: "var(--stroke)" }} aria-labelledby="account-heading">
                <h2 id="account-heading" className={editorial.subTitle}>Your account</h2>
                <dl style={{ display: "grid", margin: 0 }}>
                    {[
                        ["Email", user?.email ?? "Not available"],
                        ["Sign-in method", signInMethod],
                        ["Account type", roleLabel],
                    ].map(([term, value]) => <div key={term} style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingBlock: 14, borderTop: "1px solid rgba(25,25,27,.18)" }}>
                        <dt className={editorial.meta}>{term}</dt>
                        <dd style={{ margin: 0, fontSize: 16, fontWeight: 700, overflowWrap: "anywhere" }}>{value}</dd>
                    </div>)}
                </dl>
            </section>

            <section style={{ display: "grid", gap: 16, paddingBlock: 36, borderBottom: "var(--stroke)" }} aria-labelledby="preferences-heading">
                <h2 id="preferences-heading" className={editorial.subTitle}>Profile preferences</h2>
                <p className={editorial.body}>
                    Search visibility and email preferences now live with the rest of your profile, so everything about how you appear is in one place.
                </p>
                <div className={editorial.pillRow}>
                    <Pill href="/profile/edit#privacy" variant="blue">Open profile preferences</Pill>
                    <Pill href={`/p/${profile.slug}`} variant="quiet">View public profile ↗</Pill>
                </div>
            </section>

            <section style={{ paddingBlock: 36 }} aria-labelledby="danger-heading">
                <h2 id="danger-heading" className={editorial.subTitle} style={{ marginBottom: 16 }}>Delete account</h2>
                <DeleteAccountButton />
            </section>
        </div>
    </main>;
}
