import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getPortfolioEntitlements } from "@/lib/billing";
import PricingExperience from "./PricingExperience";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({ title: "Membership and Pricing", description: "Compare Archicareer membership plans and portfolio space bundles.", path: "/pricing" });

export default async function PricingPage() {
    const { data: profile } = await getCurrentProfile();
    if (!profile) return <PricingExperience account={{ kind: "signed-out" }} />;

    const { data, error } = await getPortfolioEntitlements(profile.user_id, profile.id);
    if (error || !data) return <PricingExperience account={{ kind: "error" }} />;

    return <PricingExperience account={{ kind: "ready", summary: data }} />;
}
