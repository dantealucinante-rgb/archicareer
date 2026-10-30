import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ApplyButton from "@/app/components/ApplyButton";
import { getJobListingById } from "@/lib/queries/jobs";
import { getCurrentUser } from "@/lib/auth";

type PageProps = { params: Promise<{ id: string }> };

function applicationDestination(value: string | null) {
    if (!value) return null;
    return value.includes("@") && !value.startsWith("http") ? `mailto:${value}` : value;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const { data: job } = await getJobListingById(id);
    return job ? { title: `${job.title} at ${job.firm_name}` } : { title: "Opportunity not found", robots: { index: false, follow: false } };
}

export default async function JobDetailPage({ params }: PageProps) {
    const { id } = await params;
    const [{ data: job }, { user }] = await Promise.all([getJobListingById(id), getCurrentUser()]);
    if (!job || job.status !== "open") notFound();

    const externalDestination = applicationDestination(job.apply_link_or_email);

    return <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper"><main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16"><Link href="/jobs" className="font-mono text-[10px] uppercase tracking-widest text-graphite hover:text-ink">← All opportunities</Link><article className="surface mt-6 p-6 sm:p-10"><p className="eyebrow font-mono text-redline">{job.type} / {job.status}</p><h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">{job.title}</h1><p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-graphite">{job.firm_name}</p><div className="mt-8 border-y border-line py-6"><h2 className="font-display text-xl font-semibold">About this opportunity</h2><p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-graphite">{job.description}</p></div><div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-graphite">Apply through ArchiCareer</p><p className="mt-2 max-w-lg text-sm leading-relaxed text-graphite">Keep your application connected to your profile and manage follow-up from Applications.</p></div><ApplyButton jobListingId={job.id} authenticated={Boolean(user)} /></div>{externalDestination && <div className="mt-6 border-t border-line pt-5"><a href={externalDestination} target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-widest text-graphite underline underline-offset-4 hover:text-ink">Prefer the company’s external application? Apply externally ↗</a></div>}</article></main></div>;
}
