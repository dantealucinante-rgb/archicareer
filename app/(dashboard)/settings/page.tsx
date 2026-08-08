import { getCurrentProfile } from "@/lib/queries/profiles";
import SettingsEditor from "./SettingsEditor";
import DeleteAccountButton from "./DeleteAccountButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const { data: profile } = await getCurrentProfile();

    return (
        <div className="bg-paper text-ink flex flex-col font-sans selection:bg-redline selection:text-paper">
            <main className="max-w-4xl w-full mx-auto px-6 py-12 border-x border-line border-dashed">
                <div className="border-b border-line pb-6 mb-8 flex justify-between items-end">
                    <h1 className="font-display text-2xl uppercase tracking-tight text-ink font-normal">Settings</h1>
                    <div className="font-mono text-[10px] text-graphite uppercase tracking-widest">[ SECURITY STATE: ACTIVE ]</div>
                </div>

                <div className="border border-line bg-paper p-8 rounded-[2px]">
                    <p className="font-mono text-xs text-graphite uppercase tracking-widest mb-6">[ PREFERENCES METADATA DETAILS ]</p>
                    <p className="mb-6 text-sm leading-relaxed text-graphite">Your preference is saved now. Email delivery will activate when notifications are connected.</p>
                    <SettingsEditor initialMarketingEmails={profile?.marketing_emails ?? false} initialSearchIndexable={profile?.search_indexable ?? true} />
                    <DeleteAccountButton />
                </div>
            </main>
        </div>
    );
}
