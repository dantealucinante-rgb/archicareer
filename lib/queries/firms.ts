import { createPublicClient } from "@/lib/supabase/server";
import type { Firm } from "@/types";
import type { QueryResult } from "@/lib/queries/profiles";

const FIRM_COLUMNS = "id, name, slug, logo_url, verified, created_at, updated_at";

export async function getFirmBySlug(slug: string): Promise<QueryResult<Firm>> {
    try {
        const { data, error } = await createPublicClient()
            .from("firms")
            .select(FIRM_COLUMNS)
            .eq("slug", slug)
            .maybeSingle();
        if (error) return { data: null, error: new Error(error.message) };
        if (!data) return { data: null, error: new Error("Firm not found") };
        return { data: data as Firm, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
