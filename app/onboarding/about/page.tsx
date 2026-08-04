import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";
import OnboardingFrame from "../OnboardingFrame";
import OnboardingAboutForm from "./OnboardingAboutForm";

export const dynamic = "force-dynamic";

export default async function OnboardingAboutPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/login");
    return <OnboardingFrame step={1}><OnboardingAboutForm profile={profile} /></OnboardingFrame>;
}
