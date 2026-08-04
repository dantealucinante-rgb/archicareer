import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import OnboardingFrame from "../OnboardingFrame";
import OnboardingLinksForm from "./OnboardingLinksForm";

export const dynamic = "force-dynamic";

export default async function OnboardingLinksPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/login");
    return <OnboardingFrame step={2}><OnboardingLinksForm profile={profile} /></OnboardingFrame>;
}
