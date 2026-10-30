import { createClient } from "@/lib/supabase/server";

/**
 * Session state must not be inferred from the presence of an application
 * profile. A user can have a valid Supabase session while profile creation or
 * loading is temporarily unavailable.
 */
export async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}
