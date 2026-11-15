import { notFound, redirect } from "next/navigation";
import { getJobListingById } from "@/lib/queries/jobs";
import { getCurrentUser } from "@/lib/auth";
import EditJobForm from "@/app/components/jobs/EditJobForm";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function JobEditPage({ params }: PageProps) {
 const { id } = await params;
 const [{ data: job }, { user }] = await Promise.all([getJobListingById(id), getCurrentUser()]);
 if (!job) notFound();
 if (!user || !job.user_id || job.user_id !== user.id) redirect(`/jobs/${job.id}`);

 return (
  <div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
   <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
    <EditJobForm job={job} onSaved={() => {}} />
   </main>
  </div>
 );
}
