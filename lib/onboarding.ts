import { createAdminClient } from "@/lib/supabase/server";
import type { AccountType } from "@/types";

export const ACCOUNT_TYPES: readonly AccountType[] = ["student", "professional", "firm", "business"];

export interface ProfileOnboardingState {
    user_id: string;
    profile_id: string;
    onboarding_completed: boolean;
    onboarding_step: number;
    onboarding_started_at: string;
    onboarding_completed_at: string | null;
    onboarding_skipped_steps: string[];
    onboarding_data: Record<string, unknown>;
    professional_interests: string[];
    professional_interest_other: string;
}

export function isAccountType(value: unknown): value is AccountType {
    return typeof value === "string" && ACCOUNT_TYPES.includes(value as AccountType);
}

export function getAccountHome(accountType: AccountType) {
    return accountType === "firm" || accountType === "business" ? "/firms/onboarding" : "/feed";
}

export async function getProfileOnboardingState(userId: string) {
    try {
        const { data, error } = await createAdminClient()
            .from("profile_onboarding")
            .select("user_id, profile_id, onboarding_completed, onboarding_step, onboarding_started_at, onboarding_completed_at, onboarding_skipped_steps, onboarding_data, professional_interests, professional_interest_other")
            .eq("user_id", userId)
            .maybeSingle();
        if (error) return { data: null, error: new Error(error.message) };
        return { data: data as ProfileOnboardingState | null, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
