import { createClient, createPublicClient, createAdminClient } from "@/lib/supabase/server";
import { JobListing, JobType, JobStatus, JobPayType } from "@/types";
import { jobListingCreateSchema, jobListingUpdateSchema } from "@/lib/validations";
import { QueryResult, PaginationOptions, SortingOptions, normalizePagination } from "@/lib/queries/profiles";

const JOB_LIST_COLS = "id, user_id, firm_name, title, type, description, location, pay_type, status, created_at, updated_at";
const JOB_DETAIL_COLS = "id, user_id, firm_name, title, type, description, location, pay_type, apply_link_or_email, status, created_at, updated_at";

export interface JobListingFilters {
 type?: JobType;
 status?: JobStatus;
 location?: string;
 pay_type?: JobPayType;
 search?: string;
}

export async function getJobListings(
 filters?: JobListingFilters,
 pagination: PaginationOptions = { limit: 20, offset: 0 },
 sorting: SortingOptions = { sortBy: "created_at", ascending: false }
): Promise<QueryResult<JobListing[]>> {
 try {
 const supabase = createPublicClient();
 let query = supabase.from("job_listings").select(JOB_LIST_COLS);

 if (filters?.type) {
 query = query.eq("type", filters.type);
 }
 if (filters?.location) {
 query = query.ilike("location", `%${filters.location}%`);
 }
 if (filters?.pay_type) {
 query = query.eq("pay_type", filters.pay_type);
 }
 if (filters?.search) {
 const term = `%${filters.search}%`;
 query = query.or(`title.ilike.${term},firm_name.ilike.${term},description.ilike.${term}`);
 }
 // Default to open listings unless caller explicitly passes a status
 query = query.eq("status", filters?.status ?? "open");

 const sortBy = (sorting.sortBy === "location" ? "created_at" : sorting.sortBy) ?? "created_at";
 query = query.order(sortBy, { ascending: sorting.ascending ?? false });

 const { limit, offset } = normalizePagination(pagination);
 query = query.range(offset, offset + limit - 1);

 const { data, error } = await query;
 if (error) return { data: null, error: new Error(error.message) };
 return { data: data as JobListing[], error: null };
 } catch (err) {
 console.error("[jobs] getJobListings:", err);
 return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
 }
}

export async function getJobListingById(id: string): Promise<QueryResult<JobListing>> {
 try {
 const supabase = createPublicClient();
 const { data, error } = await supabase
 .from("job_listings")
 .select(JOB_DETAIL_COLS)
 .eq("id", id)
 .single();

 if (error) return { data: null, error: new Error(error.message) };
 return { data: data as JobListing, error: null };
 } catch (err) {
 console.error("[jobs] getJobListingById:", err);
 return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
 }
}

/**
 * Returns the number of applications per job listing, keyed by listing id.
 * Uses the admin client so public discovery pages can show counts without
 * exposing applicant identities or requiring the viewer to be authenticated.
 */
export async function getApplicationCounts(): Promise<QueryResult<Record<string, number>>> {
 try {
 const supabase = createAdminClient();
 const { data, error } = await supabase.from("applications").select("job_listing_id");
 if (error) return { data: null, error: new Error(error.message) };
 const counts: Record<string, number> = {};
 for (const row of data ?? []) {
 counts[row.job_listing_id] = (counts[row.job_listing_id] ?? 0) + 1;
 }
 return { data: counts, error: null };
 } catch (err) {
 console.error("[jobs] getApplicationCounts:", err);
 return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
 }
}

export async function createJobListing(
 rawItem: Omit<JobListing, "id" | "created_at" | "updated_at">
): Promise<QueryResult<JobListing>> {
 try {
 const validation = jobListingCreateSchema.safeParse(rawItem);
 if (!validation.success) {
 return { data: null, error: new Error(validation.error.issues.map((e: import("zod").ZodIssue) => e.message).join(", ")) };
 }

 const supabase = await createClient();
 const { data, error } = await supabase
 .from("job_listings")
 .insert(validation.data)
 .select(JOB_DETAIL_COLS)
 .single();

 if (error) return { data: null, error: new Error(error.message) };
 return { data: data as JobListing, error: null };
 } catch (err) {
 console.error("[jobs] createJobListing:", err);
 return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
 }
}

/**
 * Update a job listing. Only the poster may edit, and only the fields in the
 * update schema are mutable (title, description, location, type, pay_type,
 * apply_link_or_email, status).
 */
export async function updateJobListing(
 id: string,
 rawItem: unknown
): Promise<QueryResult<JobListing>> {
 try {
 const validation = jobListingUpdateSchema.safeParse(rawItem);
 if (!validation.success) {
 return { data: null, error: new Error(validation.error.issues.map((e: import("zod").ZodIssue) => e.message).join(", ")) };
 }

 const supabase = await createClient();
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) {
 return { data: null, error: new Error("Unauthenticated") };
 }

 const { data, error } = await supabase
 .from("job_listings")
 .update(validation.data)
 .eq("id", id)
 .eq("user_id", user.id)
 .select(JOB_DETAIL_COLS)
 .single();

 if (error) return { data: null, error: new Error(error.message) };
 if (!data) return { data: null, error: new Error("Job listing not found or you do not own it") };
 return { data: data as JobListing, error: null };
 } catch (err) {
 console.error("[jobs] updateJobListing:", err);
 return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
 }
}

/**
 * Toggle a bookmark for a given job listing.
 * Inserts if not bookmarked, deletes if already bookmarked.
 * Returns { data: true } if the listing is now bookmarked, { data: false } if it was removed.
 */
export async function toggleBookmark(
 jobListingId: string
): Promise<QueryResult<boolean>> {
 try {
 const supabase = await createClient();
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) {
 return { data: null, error: new Error("Unauthenticated: cannot bookmark") };
 }

 const { data, error } = await supabase.rpc("toggle_job_bookmark", { p_job_listing_id: jobListingId });
 if (error) return { data: null, error: new Error(error.message) };
 return { data: Boolean(data), error: null };
 } catch (err) {
 console.error("[jobs] toggleBookmark:", err);
 return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
 }
}

export async function getBookmarkedListings(
 pagination: PaginationOptions = { limit: 20, offset: 0 }
): Promise<QueryResult<JobListing[]>> {
 try {
 const supabase = await createClient();
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) {
 return { data: null, error: new Error("Unauthenticated") };
 }

 const { limit, offset } = normalizePagination(pagination);

 const { data, error } = await supabase
 .from("bookmarks")
 .select(`job_listing_id, job_listings!inner(${JOB_LIST_COLS})`)
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .range(offset, offset + limit - 1);

 if (error) return { data: null, error: new Error(error.message) };

 const listings = data.map((b) => b.job_listings) as unknown as JobListing[];
 return { data: listings, error: null };
 } catch (err) {
 console.error("[jobs] getBookmarkedListings:", err);
 return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
 }
}

export async function getBookmarkedListingIds(): Promise<QueryResult<string[]>> {
 try {
 const supabase = await createClient();
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) {
 return { data: null, error: new Error("Unauthenticated") };
 }

 const { data, error } = await supabase
 .from("bookmarks")
 .select("job_listing_id")
 .eq("user_id", user.id);

 if (error) return { data: null, error: new Error(error.message) };
 return { data: data.map((b) => b.job_listing_id), error: null };
 } catch (err) {
 console.error("[jobs] getBookmarkedListingIds:", err);
 return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
 }
}
