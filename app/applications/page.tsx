import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getFirmApplications, getMyApplications } from "@/lib/queries/applications";
import ApplicationWorkspace from "@/app/components/ApplicationWorkspace";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/login");
    const firmView = profile.role === "firm";
    const { data: applications, error } = firmView ? await getFirmApplications() : await getMyApplications();
    return <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper"><main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16"><div className="mb-10 border-b border-line pb-8"><p className="eyebrow font-mono text-redline">{firmView ? "COMPANY WORKSPACE" : "YOUR WORKSPACE"}</p><h1 className="display-balance mt-3 max-w-2xl font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">{firmView ? "Meet the people applying." : "Keep your opportunities moving."}</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-graphite">{firmView ? "Review applicants, update their status, and keep the conversation close to the work." : "Applications and conversations stay in one place, connected to your profile."}</p></div>{error ? <div className="border border-dashed border-redline p-10 text-center font-mono text-xs uppercase tracking-widest text-redline">Unable to load applications right now.</div> : <ApplicationWorkspace applications={applications ?? []} currentUserId={profile.user_id} firmView={firmView} />}</main></div>;
}
