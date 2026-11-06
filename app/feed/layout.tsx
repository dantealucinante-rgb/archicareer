import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getProfileOnboardingState } from "@/lib/onboarding";

export default async function FeedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { data: profile } = await getCurrentProfile();
    if (profile) {
        const onboarding = await getProfileOnboardingState(profile.user_id);
        if (onboarding.data && !onboarding.data.onboarding_completed) redirect("/onboarding");
    }
    return children;
}
