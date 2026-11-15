import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getFirmApplications, getMyApplications } from "@/lib/queries/applications";
import ApplicationWorkspace from "@/app/components/ApplicationWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Applications and conversations",
    robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/login");
    const firmView = profile.role === "firm";
    const { data: applications, error } = firmView ? await getFirmApplications() : await getMyApplications();
    return <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper"><main className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-8"><div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5"><p className="eyebrow font-mono text-redline">{firmView ? "COMPANY WORKSPACE" : "YOUR WORKSPACE"}</p><h1 className="display-balance m-0 font-display text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Applications</h1></div>{error ? <div className="border border-dashed border-redline p-10 text-center font-mono text-xs uppercase tracking-widest text-redline">Unable to load applications right now.</div> : <ApplicationWorkspace applications={applications ?? []} currentUserId={profile.user_id} firmView={firmView} />}</main></div>;
}
