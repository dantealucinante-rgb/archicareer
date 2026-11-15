import Link from "next/link";
import type { Metadata } from "next";
import type { JobListing, JobType, JobPayType } from "@/types";
import { getJobListings, getApplicationCounts } from "@/lib/queries/jobs";
import { getCurrentUser } from "@/lib/auth";
import { SortingOptions } from "@/lib/queries/profiles";
import { absoluteUrl, pageMetadata, safeJsonLd } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/server";
import Image from "next/image";
import ApplyButton from "@/app/components/ApplyButton";
import styles from "../components/jobs/jobs.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
 title: "Architecture and Construction Jobs",
 description: "Find architecture and construction jobs, internships, competitions, and opportunities from studios and companies across Nigeria.",
 path: "/jobs",
});

function firmInitials(name: string) {
	return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "AC";
}

function postedDate(value: string) {
	return new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function payLabel(value: JobPayType) {
	return value === "paid" ? "Paid" : value === "unpaid" ? "Unpaid" : "Pay not disclosed";
}

function formatApplicantCount(n: number): string {
	if (n >= 20) return "20+ applicants";
	if (n >= 5) return "5+ applicants";
	return `${n} applicant${n === 1 ? "" : "s"}`;
}

const TYPES: { value: JobType | ""; label: string }[] = [
	{ value: "", label: "All opportunity types" },
	{ value: "internship", label: "Internships" },
	{ value: "job", label: "Jobs" },
	{ value: "competition", label: "Competitions" },
];

const PAY_TYPES: { value: JobPayType | ""; label: string }[] = [
	{ value: "", label: "All pay statuses" },
	{ value: "paid", label: "Paid" },
	{ value: "unpaid", label: "Unpaid" },
	{ value: "not_disclosed", label: "Pay not disclosed" },
];

const SORTS: { value: string; label: string }[] = [
	{ value: "newest", label: "Newest first" },
	{ value: "oldest", label: "Oldest first" },
];

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

	const activeFilters = [search, location, payType, type].filter(Boolean).length;
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
			<div className="min-h-screen bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
				<main className={styles.root}>
					<div className={styles.page}>
						<div className="mb-2">
							<p className={styles.kicker}>Opportunities / Nigeria</p>
							<h1 className={styles.title}>Jobs</h1>
						</div>

						<form method="get" className={styles.filterBar}>
							<div className={styles.filterGroup}>
								<label htmlFor="job-search">Search</label>
								<input id="job-search" name="search" defaultValue={search ?? ""} placeholder="Role, firm or location" className={styles.filterInput} />
							</div>
							<div className={styles.filterGroup}>
								<label htmlFor="job-type">Category</label>
								<select id="job-type" name="type" defaultValue={type ?? ""} className={styles.filterSelect}>
									{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
								</select>
							</div>
							<div className={styles.filterGroup}>
								<label htmlFor="job-location">Location</label>
								<input id="job-location" name="location" defaultValue={location ?? ""} placeholder="City or Remote" className={styles.filterInput} />
							</div>
							<div className={styles.filterGroup}>
								<label htmlFor="job-pay">Pay</label>
								<select id="job-pay" name="pay" defaultValue={payType ?? ""} className={styles.filterSelect}>
									{PAY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
								</select>
							</div>
							<div className={styles.filterGroup}>
								<div className={styles.sortLabel}>Sort</div>
								<select name="sort" defaultValue={sort} className={styles.filterSelect}>
									{SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
								</select>
							</div>
							<div className={styles.filterActions}>
								<button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-full border border-ink bg-ink px-4 font-mono text-[10px] uppercase tracking-widest text-paper transition-colors hover:border-redline hover:bg-redline">
									Apply filters
								</button>
								{activeFilters > 0 && <Link href="/jobs" className={styles.clearFilters}>Clear filters</Link>}
							</div>
						</form>

						<div className={styles.section}>
							<p className={styles.resultsMeta}>
								{jobs?.length ?? 0} listing{jobs?.length === 1 ? "" : "s"} shown{activeFilters > 0 ? ` · ${totalApplications} total application${totalApplications === 1 ? "" : "s"} across results` : ""}
							</p>
						</div>

						{jobsError ? (
							<div className={styles.errorState}>
								<p className="font-display text-xl text-ink">Opportunities are taking a moment to load.</p>
								<Link href="/jobs" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-redline underline underline-offset-4">
									Try again
								</Link>
							</div>
						) : jobs && jobs.length > 0 ? (
							<div className={styles.list}>
								{jobs.map((job: JobListing) => {
									const count = counts[job.id] ?? 0;
									const avatarUrl = firmAvatars.get(job.user_id ?? "");
									return (
										<article key={job.id} className={styles.job}>
											<Link href={`/jobs/${job.id}`} className={styles.jobLogo} aria-label={`Firm mark for ${job.firm_name}`}>
												{avatarUrl ? <Image src={avatarUrl} alt="" width={64} height={64} className="object-cover" /> : <span className={styles.jobLogoFallback}>{firmInitials(job.firm_name)}</span>}
											</Link>
											<div className={styles.jobCopy}>
												<Link href={`/jobs/${job.id}`} className={styles.jobTitle}>{job.title}</Link>
												<p className={styles.jobFirm}>{job.firm_name}</p>
												<p className={styles.jobMeta}>
													{job.location}<span>{` · ${job.type} · ${payLabel(job.pay_type)}`}</span>
												</p>
												<p className={styles.jobPosted}>Posted {postedDate(job.created_at)}</p>
											</div>
											<div className={styles.jobActions}>
												<p className={styles.applicantCount}>{formatApplicantCount(count)}</p>
												<ApplyButton jobListingId={job.id} authenticated={Boolean(user)} compact />
											</div>
										</article>
									);
								})}
							</div>
						) : (
							<div className={styles.emptyState}>
								<p>The opportunity board is quiet.</p>
								<p>Check back soon, or share the first opening from your firm profile.</p>
							</div>
						)}
					</div>
				</main>
			</div>
		</>
	);
}
