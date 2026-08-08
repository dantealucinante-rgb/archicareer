import { Application, ApplicationMessage } from "@/types";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { applicationCreateSchema, applicationMessageSchema, applicationStatusSchema } from "@/lib/validations";

type QueryResult<T> = { data: T | null; error: Error | null };

const JOB_COLUMNS = "id, firm_name, title, type, status";
const APPLICATION_COLUMNS = `id, job_listing_id, applicant_id, cover_note, cv_url, status, created_at, updated_at, job_listing:job_listings(${JOB_COLUMNS})`;

async function currentUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    return { supabase, user, error };
}

async function attachApplicants(applications: Application[]): Promise<Application[]> {
    if (applications.length === 0) return applications;
    const profilesClient = createAdminClient();
    const { data: profiles } = await profilesClient
        .from("profiles")
        .select("id, user_id, name, slug, role, bio, cv_url, avatar_url")
        .in("user_id", applications.map((application) => application.applicant_id));
    const byUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    return applications.map((application) => ({ ...application, applicant: byUserId.get(application.applicant_id) })) as Application[];
}

export async function createApplication(raw: unknown): Promise<QueryResult<Application>> {
    const parsed = applicationCreateSchema.safeParse(raw);
    if (!parsed.success) return { data: null, error: new Error(parsed.error.issues.map((issue) => issue.message).join(", ")) };
    const { supabase, user, error: authError } = await currentUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data: allowed, error: limitError } = await supabase.rpc("consume_user_rate_limit", { p_action: "application_create", p_limit: 20 });
    if (limitError) return { data: null, error: new Error("Unable to verify application limit") };
    if (!allowed) return { data: null, error: new Error("Application limit reached. Try again later.") };

    const { data: listing, error: listingError } = await createAdminClient().from("job_listings").select("id, status, user_id").eq("id", parsed.data.job_listing_id).single();
    if (listingError || !listing) {
        await supabase.rpc("release_user_rate_limit", { p_action: "application_create" });
        return { data: null, error: new Error("Job listing not found") };
    }
    if (listing.status !== "open") {
        await supabase.rpc("release_user_rate_limit", { p_action: "application_create" });
        return { data: null, error: new Error("This opportunity is closed") };
    }
    if (listing.user_id === user.id) {
        await supabase.rpc("release_user_rate_limit", { p_action: "application_create" });
        return { data: null, error: new Error("You cannot apply to your own listing") };
    }
    const { data: applicantProfile } = await createAdminClient().from("profiles").select("cv_url").eq("user_id", user.id).maybeSingle();

    const { data, error } = await supabase.from("applications").insert({
        job_listing_id: parsed.data.job_listing_id,
        applicant_id: user.id,
        cover_note: parsed.data.cover_note?.trim() || null,
        cv_url: applicantProfile?.cv_url ?? null,
    }).select(APPLICATION_COLUMNS).single();
    if (error) {
        await supabase.rpc("release_user_rate_limit", { p_action: "application_create" });
        return { data: null, error: new Error(error.code === "23505" ? "You have already applied to this opportunity" : error.message) };
    }
    return { data: data as unknown as Application, error: null };
}

export async function getMyApplications(): Promise<QueryResult<Application[]>> {
    const { supabase, user, error: authError } = await currentUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data, error } = await supabase.from("applications").select(APPLICATION_COLUMNS).eq("applicant_id", user.id).order("created_at", { ascending: false });
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as unknown as Application[], error: null };
}

export async function getFirmApplications(): Promise<QueryResult<Application[]>> {
    const { supabase, user, error: authError } = await currentUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data, error } = await supabase.from("applications").select(APPLICATION_COLUMNS).order("created_at", { ascending: false });
    if (error) return { data: null, error: new Error(error.message) };
    return { data: await attachApplicants(data as unknown as Application[]), error: null };
}

export async function getApplicationMessages(applicationId: string): Promise<QueryResult<ApplicationMessage[]>> {
    const { supabase, user, error: authError } = await currentUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data, error } = await supabase.from("application_messages").select("id, application_id, sender_id, body, created_at").eq("application_id", applicationId).order("created_at", { ascending: true });
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as unknown as ApplicationMessage[], error: null };
}

export async function sendApplicationMessage(applicationId: string, raw: unknown): Promise<QueryResult<ApplicationMessage>> {
    const parsed = applicationMessageSchema.safeParse(raw);
    if (!parsed.success) return { data: null, error: new Error(parsed.error.issues.map((issue) => issue.message).join(", ")) };
    const { supabase, user, error: authError } = await currentUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data: allowed, error: limitError } = await supabase.rpc("consume_user_rate_limit", { p_action: "message_send", p_limit: 60 });
    if (limitError) return { data: null, error: new Error("Unable to verify message limit") };
    if (!allowed) return { data: null, error: new Error("Message limit reached. Try again later.") };
    const { data, error } = await supabase.from("application_messages").insert({ application_id: applicationId, sender_id: user.id, body: parsed.data.body }).select("id, application_id, sender_id, body, created_at").single();
    if (error) {
        await supabase.rpc("release_user_rate_limit", { p_action: "message_send" });
        return { data: null, error: new Error(error.message) };
    }
    return { data: data as unknown as ApplicationMessage, error: null };
}

export async function updateApplicationStatus(applicationId: string, raw: unknown): Promise<QueryResult<Application>> {
    const parsed = applicationStatusSchema.safeParse(raw);
    if (!parsed.success) return { data: null, error: new Error("Invalid application status") };
    const { supabase, user, error: authError } = await currentUser();
    if (authError || !user) return { data: null, error: new Error("Unauthenticated") };
    const { data, error } = await supabase.from("applications").update({ status: parsed.data.status }).eq("id", applicationId).select(APPLICATION_COLUMNS).single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as unknown as Application, error: null };
}
