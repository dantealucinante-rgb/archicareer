import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { Profile, UserRole } from "@/types";
import { profileUpdateSchema } from "@/lib/validations";

export interface QueryResult<T> {
    data: T | null;
    error: Error | null;
}

export const PROFILE_COLUMNS = "id, user_id, name, slug, role, school_or_firm, bio, location, social_links, software_proficiency, cv_url, instagram_url, personal_site_url, linkedin_url, avatar_url, marketing_emails, created_at, updated_at";
export const PUBLIC_PROFILE_COLUMNS = "id, name, slug, role, school_or_firm, bio, location, social_links, software_proficiency, cv_url, instagram_url, personal_site_url, linkedin_url, avatar_url, created_at, updated_at";
type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function removeCvFile(publicUrl: string): Promise<boolean> {
    try {
        const url = new URL(publicUrl);
        const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!configuredUrl || url.origin !== new URL(configuredUrl).origin) return true;
        const marker = "/storage/v1/object/public/cv-documents/";
        if (!url.pathname.startsWith(marker)) return true;
        const path = url.pathname.slice(marker.length).split("/").map(decodeURIComponent).join("/");
        if (!path) return true;
        const supabase = await createClient();
        const { error } = await supabase.storage.from("cv-documents").remove([path]);
        if (error) {
            console.error("[profiles] Unable to remove previous CV:", error.message);
            return false;
        }
        return true;
    } catch (error) {
        console.error("[profiles] Unable to parse previous CV URL:", error);
        return false;
    }
}

export async function removeAvatarFile(publicUrl: string): Promise<boolean> {
    try {
        const url = new URL(publicUrl);
        const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!configuredUrl || url.origin !== new URL(configuredUrl).origin) return true;
        const marker = "/storage/v1/object/public/avatars/";
        if (!url.pathname.startsWith(marker)) return true;
        const path = url.pathname.slice(marker.length).split("/").map(decodeURIComponent).join("/");
        if (!path) return true;
        const supabase = await createClient();
        const { error } = await supabase.storage.from("avatars").remove([path]);
        if (error) {
            console.error("[profiles] Unable to remove previous avatar:", error.message);
            return false;
        }
        return true;
    } catch (error) {
        console.error("[profiles] Unable to parse previous avatar URL:", error);
        return false;
    }
}

export function isOwnedAvatarUrl(publicUrl: string, userId: string): boolean {
    try {
        const url = new URL(publicUrl);
        const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const marker = "/storage/v1/object/public/avatars/";
        if (!configuredUrl || url.origin !== new URL(configuredUrl).origin || !url.pathname.startsWith(marker)) return false;
        const path = url.pathname.slice(marker.length).split("/").map(decodeURIComponent).join("/");
        return path.split("/")[0] === userId && path.length > userId.length + 1;
    } catch {
        return false;
    }
}

export async function getProfileBySlug(slug: string): Promise<QueryResult<Profile>> {
    try {
        const supabase = createPublicClient();
        const result = await supabase.rpc("get_public_profile_by_slug", { p_slug: slug }).maybeSingle();

        if (!result.error) {
            return { data: result.data as Profile, error: null };
        }
        return { data: null, error: new Error(result.error.message) };
    } catch (err) {
        console.error("Unhandled error in getProfileBySlug:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function getCurrentProfile(): Promise<QueryResult<Profile>> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { data: null, error: authError ? new Error(authError.message) : new Error("Unauthenticated") };
        }

        const existing = await getProfileForUser(supabase, user.id);
        if (existing.data || existing.error) {
            return existing;
        }

        return createProfileForUser(supabase, user);
    } catch (err) {
        console.error("Unhandled error in getCurrentProfile:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export async function getProfileForUser(
    supabase: ServerClient,
    userId: string
): Promise<QueryResult<Profile>> {
    const { data, error } = await supabase.rpc("get_my_profile").maybeSingle();
    if (error) {
        return { data: null, error: new Error(error.message) };
    }
    const profile = data as Profile | null;
    if (!profile) return { data: null, error: null };
    if (profile.user_id !== userId) return { data: null, error: new Error("Profile ownership mismatch") };
    return { data: profile, error: null };
}

async function createProfileForUser(
    supabase: ServerClient,
    user: User
): Promise<QueryResult<Profile>> {
    const metadata = user.user_metadata ?? {};
    const name = String(metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "Architect").trim();
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "architect";
    const slug = `${baseSlug}-${user.id.slice(0, 8)}`;
    const roleValue = metadata.role;
    const role: UserRole = roleValue === "architect" || roleValue === "firm" ? roleValue : "student";

    const { data, error } = await supabase
        .from("profiles")
        .insert({
            user_id: user.id,
            name,
            slug,
            role,
            school_or_firm: typeof metadata.school_or_firm === "string" ? metadata.school_or_firm : null,
            bio: typeof metadata.bio === "string" ? metadata.bio : null,
            location: typeof metadata.location === "string" ? metadata.location : null,
            personal_site_url: typeof metadata.personal_site_url === "string" ? metadata.personal_site_url : null,
            social_links: typeof metadata.social_links === "object" && metadata.social_links !== null
                ? metadata.social_links
                : {},
        })
        .select(PROFILE_COLUMNS)
        .single();

    if (error) {
        return { data: null, error: new Error(error.message) };
    }

    return { data: data as Profile, error: null };
}

export async function updateProfile(
    id: string,
    rawUpdates: Partial<Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<QueryResult<Profile>> {
    try {
        const validation = profileUpdateSchema.safeParse(rawUpdates);
        if (!validation.success) {
            return { data: null, error: new Error(validation.error.issues.map((e: import("zod").ZodIssue) => e.message).join(", ")) };
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: new Error("Unauthenticated") };
        }

        const { error } = await supabase
            .from("profiles")
            .update(validation.data)
            .eq("id", id);

        if (error) {
            return { data: null, error: new Error(error.message) };
        }

        // Reload through the authenticated RPC instead of selecting private
        // columns directly through PostgREST.
        return getProfileForUser(supabase, user.id);
    } catch (err) {
        console.error("Unhandled error in updateProfile:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}

export interface ProfileSearchFilters {
    role?: UserRole;
    location?: string;
    school_or_firm?: string;
}

export interface PaginationOptions {
    limit?: number;
    offset?: number;
}

export function normalizePagination(pagination: PaginationOptions = {}): Required<PaginationOptions> {
    const rawLimit = Number.isFinite(pagination.limit) ? Math.floor(pagination.limit as number) : 20;
    const rawOffset = Number.isFinite(pagination.offset) ? Math.floor(pagination.offset as number) : 0;
    return { limit: Math.min(Math.max(rawLimit, 1), 100), offset: Math.max(rawOffset, 0) };
}

export interface SortingOptions {
    sortBy?: "created_at" | "name" | "location";
    ascending?: boolean;
}

export async function searchProfiles(
    filters: ProfileSearchFilters,
    pagination: PaginationOptions = { limit: 20, offset: 0 },
    sorting: SortingOptions = { sortBy: "created_at", ascending: false }
): Promise<QueryResult<Profile[]>> {
    try {
        const supabase = createPublicClient();
        let query = supabase.from("profiles").select("id, name, slug, role, bio, location, school_or_firm");

        if (filters.role) {
            query = query.eq("role", filters.role);
        }
        if (filters.location) {
            query = query.ilike("location", `%${filters.location}%`);
        }
        if (filters.school_or_firm) {
            query = query.ilike("school_or_firm", `%${filters.school_or_firm}%`);
        }

        const sortBy = sorting.sortBy || "created_at";
        const ascending = sorting.ascending ?? false;
        query = query.order(sortBy, { ascending });

        const { limit, offset } = normalizePagination(pagination);
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            return { data: null, error: new Error(error.message) };
        }
        return { data: data as Profile[], error: null };
    } catch (err) {
        console.error("Unhandled error in searchProfiles:", err);
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
}
