import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getAccountHome, getProfileOnboardingState, isAccountType } from "@/lib/onboarding";
import { getCurrentUser } from "@/lib/auth";
import ProfileRecovery from "@/app/auth/recovery/ProfileRecovery";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default async function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { user } = await getCurrentUser();
    if (!user) redirect("/login?next=%2Fonboarding");
    const { data: profile } = await getCurrentProfile();
    if (!profile) return <ProfileRecovery reason="profile" />;
    if (isAccountType(profile.account_type)) {
        const onboarding = await getProfileOnboardingState(profile.user_id);
        if (onboarding.data?.onboarding_completed) redirect(getAccountHome(profile.account_type));
        if (onboarding.error) return <ProfileRecovery reason="onboarding" />;
    }
    return children;
}
