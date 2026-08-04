import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const { data: profile } = await getCurrentProfile();
    if (profile?.slug) redirect(`/p/${profile.slug}`);
    redirect("/onboarding/about");
}
