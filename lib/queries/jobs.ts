import { createClient, createPublicClient } from "@/lib/supabase/server";
import { JobListing, JobType, JobStatus } from "@/types";
import { jobListingCreateSchema } from "@/lib/validations";
import { QueryResult, PaginationOptions, SortingOptions, normalizePagination } from "@/lib/queries/profiles";

const JOB_LIST_COLS = "id, firm_name, title, type, description, apply_link_or_email, status, created_at, updated_at";
const JOB_DETAIL_COLS = "id, firm_name, title, type, description, apply_link_or_email, status, created_at, updated_at";

export async function getJobListings(
    filters?: { type?: JobType; status?: JobStatus },
    pagination: PaginationOptions = { limit: 20, offset: 0 },
    sorting: SortingOptions = { sortBy: "created_at", ascending: false }
): Promise<QueryResult<JobListing[]>> {
    try {
        const supabase = createPublicClient();
        let query = supabase.from("job_listings").select(JOB_LIST_COLS);

        if (filters?.type) {
            query = query.eq("type", filters.type);
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
            .select(JOB_LIST_COLS)
            .single();

        if (error) return { data: null, error: new Error(error.message) };
        return { data: data as JobListing, error: null };
    } catch (err) {
        console.error("[jobs] createJobListing:", err);
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
