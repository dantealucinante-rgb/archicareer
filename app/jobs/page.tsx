import { getJobListings } from "@/lib/queries/jobs";
import { JobListing } from "@/types";
import JobPostForm from "@/app/components/JobPostForm";
import { getCurrentProfile } from "@/lib/queries/profiles";
import type { Metadata } from "next";
import { safeJsonLd } from "@/lib/seo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Architecture Jobs and Internships in Nigeria",
    description: "Find architecture jobs, internships, competitions, and opportunities shared by studios and companies across Nigeria.",
    alternates: { canonical: "/jobs" },
};

export default async function JobsPage() {
    const [{ data: jobs, error: jobsError }, { data: profile }] = await Promise.all([getJobListings(), getCurrentProfile()]);
    const canPost = profile?.role === "firm";
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
                    <aside id="post-job" className="surface-dark order-first h-fit p-6 text-paper lg:order-2 lg:sticky lg:top-28">
                        <div className="eyebrow mb-3 font-mono text-sand">A-03.1 / FOR STUDIOS & COMPANIES</div>
                        <h2 className="font-display text-2xl font-semibold tracking-tight">Share an opportunity</h2>
                        {canPost ? <><p className="mt-2 text-sm leading-relaxed text-paper/70">Put the right opportunity in front of people who care about the work.</p><JobPostForm /></> : <p className="mt-3 text-sm leading-relaxed text-paper/70">Sign in with a studio or company profile to post an opportunity.</p>}
                    </aside>
                    <section className="space-y-4 lg:order-1">
                        {jobsError ? (
                            <div className="rounded-2xl border border-redline/30 bg-redline/5 p-8 text-center"><p className="font-display text-xl text-ink">Opportunities are taking a moment to load.</p><Link href="/jobs" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-redline underline underline-offset-4">Try again</Link></div>
                        ) : jobs && jobs.length > 0 ? (
                            jobs.map((job: JobListing) => (
                                <Link key={job.id} href={`/jobs/${job.id}`} className="surface card-lift block p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redline">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-redline">
                                                {job.type} {"//"} {job.status}
                                            </div>
                                            <h2 className="line-clamp-2 font-display text-2xl font-semibold tracking-tight text-ink">{job.title}</h2>
                                            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-graphite">
                                                {job.firm_name}
                                            </p>
                                        </div>
                                <span className="inline-flex w-fit items-center justify-center rounded-full border border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink">View opportunity ↗</span>
                                    </div>
                                    <p className="mt-6 max-w-2xl line-clamp-3 text-sm leading-relaxed text-graphite">{job.description}</p>
                                </Link>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-line bg-warm-white p-10 text-center">
                                <p className="font-display text-2xl text-ink">The opportunity board is quiet.</p><p className="mt-3 text-sm text-graphite">Check back soon, or share the first opening from your firm profile.</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div></>
    );
}
