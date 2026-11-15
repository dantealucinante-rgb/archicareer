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
import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import styles from "@/app/(marketing)/landing.module.css";

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
  <>
   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jobSchema) }} />
   <div className={styles.landingPage}>
    <MarketingHeader />

    <main id="home" className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
     <div className={styles.opportunities}>
      <div className={styles.opportunityHeading}>
       <h2 id="opportunities-title">{job.title}</h2>
       <p>{job.firm_name} · {job.type} · {payLabel(job.pay_type)}</p>
      </div>

      <article className={styles.jobRow}>
       <div className={styles.jobLogo}>
        {avatarUrl ? <Image src={avatarUrl} alt="" width={52} height={52} className="object-cover" /> : <span className={styles.jobLogoFallback}>{firmInitials(job.firm_name)}</span>}
       </div>
       <div className={styles.jobTitle}>
        <h1 className="text-ink font-display text-2xl font-semibold leading-none mb-1">{job.title}</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-graphite">{job.firm_name}</p>
       </div>
       <p className={styles.jobMeta}>
        <span>{job.location}</span>
        <span>{formatApplicantCount(count)} applications</span>
       </p>
       <Link href={`/jobs/${job.id}/edit`} className={`${styles.jobAction} ${styles.jobBrowse}`}>Edit listing</Link>
      </article>

      <dl className="mt-12 border-t border-ink pt-8">
       <div className="flex flex-wrap gap-8 text-graphite font-mono text-[11px] uppercase tracking-widest">
        <div>
         <p className="text-ink font-semibold text-sm">Location</p>
         <p>{job.location}</p>
        </div>
        <div>
         <p className="text-ink font-semibold text-sm">Category</p>
         <p>{job.type}</p>
        </div>
        <div>
         <p className="text-ink font-semibold text-sm">Pay</p>
         <p>{payLabel(job.pay_type)}</p>
        </div>
        <div>
         <p className="text-ink font-semibold text-sm">Posted</p>
         <p>{postedDate(job.created_at)}</p>
        </div>
        <div>
         <p className="text-ink font-semibold text-sm">Applications</p>
         <p>{formatApplicantCount(count)}</p>
        </div>
       </div>
      </dl>

      {job.description && (
       <div className="mt-12 prose prose-ink max-w-none">
        {job.description.split("\n\n").map((block, i) => <p key={i}>{block}</p>)}
       </div>
      )}

      <div className="mt-12 border-t border-ink pt-8 flex flex-wrap gap-4 items-start justify-between sm:flex-nowrap">
       <div>
        <ApplyButton jobListingId={job.id} authenticated={Boolean(user)} />
       </div>
       {externalDestination && (
        <a href={externalDestination} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 border border-ink bg-warm-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink rounded transition-colors hover:border-redline hover:text-redline">
         Apply externally
        </a>
       )}
      </div>

      {isOwner && (
       <div className="mt-12 border-t border-ink pt-8 flex flex-wrap gap-4 items-start justify-between sm:flex-nowrap">
        <div>
         <p className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-4">Listing controls</p>
         <Link href={`/jobs/${job.id}/edit`} className="inline-flex items-center justify-center gap-2 border border-ink bg-warm-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink rounded transition-colors hover:border-redline hover:text-redline">
          Edit listing
         </Link>
        </div>
        <div>
         <CloseJobButton />
        </div>
       </div>
      )}

      <MarketingFooter />
     </div>
    </main>
   </div>
  </>
 );
}
