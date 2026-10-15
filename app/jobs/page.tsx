import { getJobListings } from "@/lib/queries/jobs";
import { JobListing, JobPayType, JobType } from "@/types";
import ApplyButton from "@/app/components/ApplyButton";
import { getCurrentProfile } from "@/lib/queries/profiles";
import type { Metadata } from "next";
import { safeJsonLd } from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Architecture Jobs and Internships in Nigeria",
    description: "Find architecture jobs, internships, competitions, and opportunities shared by studios and companies across Nigeria.",
    alternates: { canonical: "/jobs" },
};

function firmInitials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "AC";
}

function postedDate(value: string) {
    return new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function payLabel(value: JobPayType) {
    return value === "paid" ? "Paid" : value === "unpaid" ? "Unpaid" : "Pay not disclosed";
}

interface JobsPageProps {
    searchParams: Promise<{ location?: string; pay?: string; type?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
    const params = await searchParams;
    const type = ["internship", "job", "competition"].includes(params.type ?? "") ? params.type as JobType : undefined;
    const payType = ["paid", "unpaid", "not_disclosed"].includes(params.pay ?? "") ? params.pay as JobPayType : undefined;
    const location = params.location?.trim() || undefined;
    const [{ data: jobs, error: jobsError }, { data: profile }] = await Promise.all([getJobListings({ type, location, pay_type: payType }), getCurrentProfile()]);
    const firmUserIds = [...new Set((jobs ?? []).map((job) => job.user_id).filter((userId): userId is string => Boolean(userId)))];
    const { data: firmProfiles } = firmUserIds.length > 0
        ? await createPublicClient().from("profiles").select("user_id, avatar_url").in("user_id", firmUserIds)
        : { data: [] as { user_id: string; avatar_url: string | null }[] };
    const firmAvatars = new Map((firmProfiles ?? []).map((firmProfile) => [firmProfile.user_id, firmProfile.avatar_url]));
    const jobsSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Architecture Jobs and Internships in Nigeria",
        description: "Current architecture jobs, internships, competitions, and opportunities across Nigeria.",
        about: { "@type": "Thing", name: "Architecture careers in Nigeria" },
    };

    return (
        <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jobsSchema) }} /><div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
                <div className="mb-10 grid gap-6 border-b border-line pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="min-w-0"><div className="eyebrow mb-4 font-mono text-redline">A-03 / OPPORTUNITIES</div><h1 className="display-balance max-w-2xl break-words font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">Find the work worth moving toward.</h1><p className="mt-5 max-w-xl break-words text-base leading-relaxed text-graphite">Explore roles, collaborations, and opportunities shared by studios and companies.</p></div>
                    <div className="rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-graphite">{jobs?.length ?? 0} listings shown</div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_0.8fr]">
                    <aside className="surface order-first h-fit p-5 lg:order-2 lg:sticky lg:top-28">
                        <div className="eyebrow mb-3 font-mono text-redline">A-03.1 / FILTER OPPORTUNITIES</div>
                        <h2 className="font-display text-2xl font-semibold tracking-tight">Find the right opening.</h2>
                        <form method="get" className="mt-5 space-y-4">
                            <div><label htmlFor="job-location" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-graphite">Location</label><input id="job-location" name="location" defaultValue={location ?? ""} placeholder="Lagos, Nigeria or Remote" className="field-input text-sm" /></div>
                            <div><label htmlFor="job-pay" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-graphite">Pay</label><select id="job-pay" name="pay" defaultValue={payType ?? ""} className="field-input text-sm"><option value="">Any pay status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="not_disclosed">Pay not disclosed</option></select></div>
                            <div><label htmlFor="job-type" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-graphite">Opportunity type</label><select id="job-type" name="type" defaultValue={type ?? ""} className="field-input text-sm"><option value="">All opportunities</option><option value="internship">Internships</option><option value="job">Jobs</option><option value="competition">Competitions</option></select></div>
                            <button type="submit" className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-ink bg-ink px-4 font-mono text-[10px] uppercase tracking-widest text-paper transition-colors hover:border-redline hover:bg-redline">Apply filters</button>
                            {(location || payType || type) && <Link href="/jobs" className="block text-center font-mono text-[10px] uppercase tracking-widest text-graphite underline underline-offset-4 hover:text-ink">Clear filters</Link>}
                        </form>
                    </aside>
                    <section className="lg:order-1">
                        {jobsError ? (
                            <div className="rounded-2xl border border-redline/30 bg-redline/5 p-8 text-center"><p className="font-display text-xl text-ink">Opportunities are taking a moment to load.</p><Link href="/jobs" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-redline underline underline-offset-4">Try again</Link></div>
                        ) : jobs && jobs.length > 0 ? (
                            <div className="border-y border-line bg-warm-white">
                                {jobs.map((job: JobListing) => (
                                    <article key={job.id} className="relative flex min-h-[104px] items-center gap-3 border-b border-line px-3 py-4 last:border-b-0 sm:gap-4 sm:px-4">
                                        <Link href={`/jobs/${job.id}`} aria-label={`View ${job.title} at ${job.firm_name}`} className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redline" />
                                        <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-start gap-3 pr-1 sm:gap-4">
                                            <div aria-hidden="true" className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-paper font-display text-sm font-semibold text-redline sm:h-14 sm:w-14">{firmAvatars.get(job.user_id ?? "") ? <Image src={firmAvatars.get(job.user_id ?? "") as string} alt="" fill sizes="56px" className="object-cover" /> : firmInitials(job.firm_name)}</div>
                                            <div className="min-w-0 pt-0.5">
                                                <h2 className="break-words text-base font-semibold leading-tight text-ink sm:text-lg">{job.title}</h2>
                                                <p className="mt-1 break-words text-sm font-medium leading-tight text-graphite">{job.firm_name}</p>
                                                <p className="mt-1.5 text-xs leading-tight text-graphite/80">{job.location} <span aria-hidden="true">·</span> {job.type}</p>
                                                <p className="mt-1 text-xs leading-tight text-graphite/80">{payLabel(job.pay_type)}</p>
                                                <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-graphite/70">Posted {postedDate(job.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="relative z-20 shrink-0">
                                            <ApplyButton jobListingId={job.id} authenticated={Boolean(profile)} compact />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="border-y border-line bg-warm-white p-10 text-center">
                                <p className="font-display text-2xl text-ink">The opportunity board is quiet.</p><p className="mt-3 text-sm text-graphite">Check back soon, or share the first opening from your firm profile.</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div></>
    );
}
