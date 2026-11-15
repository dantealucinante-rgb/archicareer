import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ApplyButton from "@/app/components/ApplyButton";
import CloseJobButton from "@/app/components/jobs/CloseJobButton";
import { getJobListingById, getApplicationCounts } from "@/lib/queries/jobs";
import { getCurrentUser } from "@/lib/auth";
import { absoluteUrl, cleanDescription, pageMetadata, safeJsonLd } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/server";
import Image from "next/image";
import styles from "../../components/jobs/jobs.module.css";

function firmInitials(name: string) {
 return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "AC";
}

function postedDate(value: string) {
 return new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function payLabel(value: string) {
 return value === "paid" ? "Paid" : value === "unpaid" ? "Unpaid" : "Pay not disclosed";
}

function formatApplicantCount(n: number): string {
 if (n >= 20) return "20+ applicants";
 if (n >= 5) return "5+ applicants";
 return `${n} applicant${n === 1 ? "" : "s"}`;
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
 const { id } = await params;
 const { data: job } = await getJobListingById(id);
 if (!job || job.status !== "open") return { title: { absolute: "Opportunity not found | Archicareer" }, robots: { index: false, follow: false } };
 return pageMetadata({
  title: `${job.title} at ${job.firm_name}`,
  description: cleanDescription(job.description, `${job.title} at ${job.firm_name}. Explore this ${job.type} opportunity on Archicareer.`),
  path: `/jobs/${job.id}`,
 });
}

export default async function JobDetailPage({ params }: PageProps) {
 const { id } = await params;
 const [{ data: job }, { user }, applicationCounts] = await Promise.all([getJobListingById(id), getCurrentUser(), getApplicationCounts()]);
 if (!job || job.status !== "open") notFound();

 const count = applicationCounts.data?.[job.id] ?? 0;
 const isOwner = Boolean(user && job.user_id && job.user_id === user.id);

 let avatarUrl: string | null = null;
 if (job.user_id) {
  const { data: profiles } = await createPublicClient().from("profiles").select("avatar_url").eq("user_id", job.user_id).maybeSingle();
  avatarUrl = profiles?.avatar_url ?? null;
 }

 const externalDestination = job.apply_link_or_email
  ? (job.apply_link_or_email.includes("@") && !job.apply_link_or_email.startsWith("http") ? `mailto:${job.apply_link_or_email}` : job.apply_link_or_email)
  : null;

 const jobSchema = {
 "@context": "https://schema.org",
 "@type": "JobPosting",
 title: job.title,
 description: job.description,
 datePosted: job.created_at,
 hiringOrganization: { "@type": "Organization", name: job.firm_name },
 url: absoluteUrl(`/jobs/${job.id}`),
 directApply: true,
 ...(job.location ? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } } } : {}),
 };

 return (
  <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jobSchema) }} />
   <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
    <Link href="/jobs" className="mb-6 inline-block font-mono text-[10px] uppercase tracking-widest text-graphite hover:text-ink">
     ← All opportunities
    </Link>

    <div className={styles.detailBack}>
     <p className={styles.detailKicker}>{job.type} / {job.status}</p>
     <h1 className={styles.detailTitle}>{job.title}</h1>
     <div className={styles.detailFirm}>
      <div className={styles.detailFirmLogo}>
       {avatarUrl ? <Image src={avatarUrl} alt="" width={44} height={44} className="object-cover" /> : <span className={styles.detailFirmFallback}>{firmInitials(job.firm_name)}</span>}
      </div>
      <p className={styles.detailFirmName}>{job.firm_name}</p>
     </div>
    </div>

    <dl className={styles.detailMeta}>
     <div className={styles.detailMetaItem}>
      <p className={styles.detailMetaLabel}>Location</p>
      <p className={styles.detailMetaValue}>{job.location}</p>
     </div>
     <div className={styles.detailMetaItem}>
      <p className={styles.detailMetaLabel}>Category</p>
      <p className={styles.detailMetaValue}>{job.type}</p>
     </div>
     <div className={styles.detailMetaItem}>
      <p className={styles.detailMetaLabel}>Pay</p>
      <p className={styles.detailMetaValue}>{payLabel(job.pay_type)}</p>
     </div>
     <div className={styles.detailMetaItem}>
      <p className={styles.detailMetaLabel}>Posted</p>
      <p className={styles.detailMetaValue}>{postedDate(job.created_at)}</p>
     </div>
     <div className={styles.detailMetaItem}>
      <p className={styles.detailMetaLabel}>Applications</p>
      <p className={styles.detailMetaValue}>{formatApplicantCount(count)}</p>
     </div>
    </dl>

    {job.description && (
     <div className={styles.detailBody}>{job.description.split("\n\n").map((block, i) => <p key={i}>{block}</p>)}</div>
    )}

    <div className={styles.detailApply}>
     <ApplyButton jobListingId={job.id} authenticated={Boolean(user)} />
     {externalDestination && (
      <a href={externalDestination} target="_blank" rel="noreferrer" className={styles.applyExternal}>
       Prefer the company’s external application? Apply externally
      </a>
     )}
    </div>

    {isOwner && (
     <div className="mt-12 border-t border-line pt-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-4">Listing controls</p>
      <div className="flex flex-wrap gap-4">
       <Link href={`/jobs/${job.id}/edit`} className="inline-flex items-center justify-center gap-2 border border-line bg-warm-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink rounded transition-colors hover:border-redline hover:text-redline">
        Edit listing
       </Link>
       <CloseJobButton />
      </div>
     </div>
    )}
   </main>
  </div>
 );
}
