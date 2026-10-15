import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profiles";

export const dynamic = "force-dynamic";

/** Preserve old bookmarks while routing the legacy profile URL to the redesigned profile. */
export default async function LegacyProfileRedirect() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) redirect("/onboarding/about");
    redirect(`/p/${profile.slug}`);
}
