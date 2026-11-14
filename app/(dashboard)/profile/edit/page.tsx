import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getProfileOnboardingState } from "@/lib/onboarding";
import editorial from "@/app/components/editorial/editorial.module.css";
import ProfileEditExperience from "./ProfileEditExperience";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/onboarding/about");

    const onboarding = await getProfileOnboardingState(profile.user_id);

    return <main className={editorial.page}>
        <div className={editorial.container}>
            <ProfileEditExperience
                profile={profile}
                interests={onboarding.data?.professional_interests ?? []}
                interestOther={onboarding.data?.professional_interest_other ?? ""}
            />
        </div>
    </main>;
}
