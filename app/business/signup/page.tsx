import type { Metadata } from "next";
import RegistrationExperience from "@/app/components/RegistrationExperience";

export const metadata: Metadata = { title: "Create a business account", robots: { index: false, follow: false } };

export default async function BusinessSignupPage({ searchParams }: { searchParams: Promise<{ account_type?: string; onboarding?: string; oauth_error?: string }> }) {
    const params = await searchParams;
    return <RegistrationExperience kind={params.account_type === "business" ? "business" : null} onboarding={params.onboarding ?? ""} oauthError={params.oauth_error} />;
}
