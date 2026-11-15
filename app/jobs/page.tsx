import Link from "next/link";
import type { Metadata } from "next";
import type { JobListing, JobType, JobPayType } from "@/types";
import { getJobListings, getApplicationCounts } from "@/lib/queries/jobs";
import { getCurrentUser } from "@/lib/auth";
import { SortingOptions } from "@/lib/queries/profiles";
import { absoluteUrl, pageMetadata, safeJsonLd } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/server";
import Image from "next/image";
import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import styles from "@/app/(marketing)/landing.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
 title: "Architecture and Construction Jobs",
 description: "Find architecture and construction jobs, internships, competitions, and opportunities from studios and companies across Nigeria.",
 path: "/jobs",
});

function firmInitials(name: string) {
 return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "AC";
}

function payLabel(value: JobPayType) {
 return value === "paid" ? "Paid" : value === "unpaid" ? "Unpaid" : "Pay not disclosed";
}

function formatApplicantCount(n: number): string {
 if (n >= 20) return "20+ applicants";
 if (n >= 5) return "5+ applicants";
 return `${n} applicant${n === 1 ? "" : "s"}`;
}

interface JobsPageProps {
 searchParams: Promise<{
  search?: string;
  location?: string;
  pay?: string;
  type?: string;
  sort?: string;
 }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
 const params = await searchParams;
 const search = params.search?.trim() || undefined;
 const location = params.location?.trim() || undefined;
 const payType = ["paid", "unpaid", "not_disclosed"].includes(params.pay ?? "") ? (params.pay as JobPayType) : undefined;
 const type = ["internship", "job", "competition"].includes(params.type ?? "") ? (params.type as JobType) : undefined;
 const sort = ["newest", "oldest"].includes(params.sort ?? "") ? params.sort : "newest";

 const sorting: SortingOptions =
  sort === "oldest" ? { sortBy: "created_at", ascending: true }
  : { sortBy: "created_at", ascending: false };

 const [{ data: jobs, error: jobsError }, { user }, applicationCounts] = await Promise.all([
  getJobListings({ type, location, pay_type: payType, search }, { limit: 50, offset: 0 }, sorting),
  getCurrentUser(),
  getApplicationCounts(),
 ]);

 const firmUserIds = [...new Set((jobs ?? []).map((job) => job.user_id).filter((userId): userId is string => Boolean(userId)))];
 const { data: firmProfiles } = firmUserIds.length > 0
  ? await createPublicClient().from("profiles").select("user_id, avatar_url").in("user_id", firmUserIds)
  : { data: [] as { user_id: string; avatar_url: string | null }[] };
 const firmAvatars = new Map((firmProfiles ?? []).map((firmProfile) => [firmProfile.user_id, firmProfile.avatar_url]));

 const activeFilters = [Boolean(search), Boolean(location), Boolean(payType), Boolean(type)].filter(Boolean).length;
 const counts = applicationCounts.data ?? {};
 const totalApplications = Object.values(counts).reduce((sum, n) => sum + n, 0);

 const jobsSchema = {
 "@context": "https://schema.org",
 "@type": "CollectionPage",
 url: absoluteUrl("/jobs"),
 name: "Architecture Jobs and Internships in Nigeria",
 description: "Current architecture jobs, internships, competitions, and opportunities across Nigeria.",
 about: { "@type": "Thing", name: "Architecture careers in Nigeria" },
 };

 return (
  <>
   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jobsSchema) }} />
   <div className={styles.landingPage}>
    <MarketingHeader authenticated={Boolean(user)} />

    <main id="home" className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper pb-16 sm:pb-0">
     <div className={styles.opportunities}>
      <div className={styles.opportunityHeading}>
       <h2 id="opportunities-title">Find your next opportunity.</h2>
       <p>The jobs board brings roles and internships from studios and organisations into one place. Check the live listings below.</p>
      </div>

      <form method="get" className={styles.jobFilterBar} onChange={(e) => { const form = e.target.form; if (form) form.requestSubmit(); }}>
       <div className={styles.jobFilterGroup}>
        <span className={styles.jobFilterLabel}>All</span>
        <select name="type" defaultValue={type ?? ""} className={styles.jobFilterSelect}>
         <option value="">Job Type</option>
         <option value="internship">Internships</option>
         <option value="job">Jobs</option>
         <option value="competition">Competitions</option>
        </select>
       </div>
       <div className={styles.jobFilterGroup}>
        <span className={styles.jobFilterLabel}>Location</span>
        <input name="location" defaultValue={location ?? ""} placeholder="Location" className={styles.jobFilterInput} />
       </div>
       <div className={styles.jobFilterGroup}>
        <span className={styles.jobFilterLabel}>Pay</span>
        <select name="pay" defaultValue={payType ?? ""} className={styles.jobFilterSelect}>
         <option value="">Salary</option>
         <option value="paid">Paid</option>
         <option value="unpaid">Unpaid</option>
         <option value="not_disclosed">Not disclosed</option>
        </select>
       </div>
       <div className={styles.jobFilterGroup}>
        <span className={styles.jobFilterLabel}>Sort</span>
        <select name="sort" defaultValue={sort} className={styles.jobFilterSelect}>
         <option value="newest">Newest</option>
         <option value="oldest">Oldest</option>
        </select>
       </div>
       <div className={styles.jobFilterGroup}>
        <span className={styles.jobFilterLabel}>Search</span>
        <input name="search" defaultValue={search ?? ""} placeholder="Search" className={styles.jobFilterInput} />
       </div>
      </form>

      {activeFilters > 0 ? (
       <div className={styles.jobFilterActions}>
        <span className={styles.jobClearFilters}>{activeFilters} active</span>
        <Link href="/jobs" className={`${styles.pillButton} ${styles.jobBrowse}`}>Clear</Link>
       </div>
      ) : null}

      <div className={styles.jobBoard}>
       {jobsError ? (
        <div className={styles.jobEmpty}>
         <p>The current listings could not load.</p>
         <span>Visit the jobs board to check available opportunities.</span>
        </div>
       ) : jobs && jobs.length > 0 ? (
        <>
         {jobs.map((job: JobListing) => {
          const count = counts[job.id] ?? 0;
          const avatarUrl = firmAvatars.get(job.user_id ?? "");
          return (
           <article key={job.id} className={styles.jobRow}>
            <div className={styles.jobLogo}>
             {avatarUrl ? <Image src={avatarUrl} alt="" width={44} height={44} className="object-cover" /> : <span className={styles.jobLogoFallback}>{firmInitials(job.firm_name)}</span>}
            </div>
            <div className={styles.jobTitle}>
             <Link href={`/jobs/${job.id}`} className="text-ink font-display text-lg font-semibold leading-none hover:text-blue">{job.title}</Link>
             <p className="font-mono text-[10px] uppercase tracking-widest text-graphite">{job.firm_name}</p>
            </div>
            <p className={styles.jobMeta}>
             <span>{job.location}</span>
             <span>{job.type} · {payLabel(job.pay_type)}</span>
             <span className={styles.jobApplied}>{formatApplicantCount(count)}</span>
            </p>
            <Link href={`/jobs/${job.id}`} className={`${styles.jobAction} ${styles.jobBrowse}`}>View opportunity</Link>
           </article>
          );
         })}
         <div className={styles.jobBoardFooter}>
          <span>{activeFilters > 0 ? `${totalApplications} total application${totalApplications === 1 ? "" : "s"} across results` : jobs?.length ? "Recently posted openings" : "No open listings are posted right now"}</span>
          <Link href="/jobs" className={`${styles.pillButton} ${styles.jobBrowse}`}>Browse the jobs board</Link>
         </div>
        </>
       ) : (
        <div className={styles.jobEmpty}>
         <p>There are no open opportunities listed right now.</p>
         <span>Visit the jobs board for updates.</span>
        </div>
       )}
      </div>
     </div>

     <MarketingFooter />
    </main>
   </div>
  </>
 );
}
