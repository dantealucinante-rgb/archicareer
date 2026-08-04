import Link from "next/link";
import { getJobListings } from "@/lib/queries/jobs";
import { JobListing } from "@/types";
import JobPostForm from "@/app/components/JobPostForm";
import { getCurrentProfile } from "@/lib/queries/profiles";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
    const [{ data: jobs, error: jobsError }, { data: profile }] = await Promise.all([getJobListings(), getCurrentProfile()]);
    const canPost = profile?.role === "firm";

    return (
        <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
            <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
                <div className="mb-10 grid gap-6 border-b border-line pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div><div className="eyebrow mb-4 font-mono text-redline">A-03 / OPPORTUNITIES</div><h1 className="display-balance max-w-2xl font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">Find the work worth moving toward.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-graphite">Explore roles, collaborations, and opportunities shared by studios and companies.</p></div>
                    <div className="rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-graphite">{jobs?.length ?? 0} listings shown</div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_0.8fr]">
                    <section className="space-y-4">
                        {jobsError ? (
                            <div className="border border-dashed border-redline p-10 text-center font-mono text-xs uppercase tracking-widest text-redline">Unable to load listings right now. Please try again.</div>
                        ) : jobs && jobs.length > 0 ? (
                            jobs.map((job: JobListing) => (
                                <article key={job.id} className="surface card-lift p-6">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-redline">
                                                {job.type} {"//"} {job.status}
                                            </div>
                                            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                                                {job.title}
                                            </h2>
                                            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-graphite">
                                                {job.firm_name}
                                            </p>
                                        </div>
                                        {job.apply_link_or_email && <Link
                                            href={/^https?:\/\//i.test(job.apply_link_or_email) ? job.apply_link_or_email : `mailto:${job.apply_link_or_email}`}
                                                className="inline-flex items-center justify-center rounded-full border border-ink bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper transition-all duration-300 hover:-translate-y-0.5 hover:bg-redline"
                                        >Apply Externally</Link>}
                                    </div>
                                    <p className="mt-6 max-w-2xl text-sm leading-relaxed text-graphite">{job.description}</p>
                                </article>
                            ))
                        ) : (
                            <div className="border border-dashed border-line p-10 text-center font-mono text-xs uppercase tracking-widest text-graphite">
                                <p>No open roles yet.</p><p className="mt-3 font-sans text-sm normal-case tracking-normal">Check back soon or post the first opportunity.</p>
                            </div>
                        )}
                    </section>

                    <aside id="post-job" className="surface-dark h-fit p-6 text-paper lg:sticky lg:top-28">
                        <div className="eyebrow mb-4 font-mono text-sand">A-03.1 / FOR STUDIOS & COMPANIES</div>
                        <h2 className="display-balance font-display text-3xl font-semibold tracking-tight">Have an opportunity to share?</h2>
                        {canPost ? (
                            <>
                                <p className="text-sm leading-relaxed text-paper/70">Put the right opportunity in front of people who care about the work.</p>
                                <JobPostForm />
                            </>
                        ) : (
                            <p className="text-sm leading-relaxed text-graphite">Sign in with a studio or company profile to post an opportunity.</p>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}
