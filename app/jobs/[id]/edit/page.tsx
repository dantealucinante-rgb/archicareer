import { notFound, redirect } from "next/navigation";
import { getJobListingById } from "@/lib/queries/jobs";
import { getCurrentUser } from "@/lib/auth";
import EditJobForm from "@/app/components/jobs/EditJobForm";
import { MarketingFooter, MarketingHeader } from "@/app/components/MarketingChrome";
import styles from "@/app/(marketing)/landing.module.css";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function JobEditPage({ params }: PageProps) {
 const { id } = await params;
 const [{ data: job }, { user }] = await Promise.all([getJobListingById(id), getCurrentUser()]);
 if (!job) notFound();
 if (!user || !job.user_id || job.user_id !== user.id) redirect(`/jobs/${job.id}`);

 return (
  <>
   <div className={styles.landingPage}>
    <MarketingHeader />

    <main id="home" className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
     <div className={styles.opportunities}>
      <div className={styles.opportunityHeading}>
       <h2 id="opportunities-title">Edit listing</h2>
       <p>Make changes to “{job.title}” at {job.firm_name} below.</p>
      </div>
      <div className={styles.jobBoard}>
       <EditJobForm job={job} onSaved={() => {}} />
      </div>
     </div>

     <MarketingFooter />
    </main>
   </div>
  </>
 );
}
