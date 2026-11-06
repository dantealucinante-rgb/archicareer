import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getAccountHome, getProfileOnboardingState, isAccountType } from "@/lib/onboarding";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default async function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/login");
    if (isAccountType(profile.account_type)) {
        const onboarding = await getProfileOnboardingState(profile.user_id);
        if (onboarding.data?.onboarding_completed) redirect(getAccountHome(profile.account_type));
    }
    return children;
}
