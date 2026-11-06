import type { Metadata } from "next";
import RegistrationExperience, { type RegistrationKind } from "@/app/components/RegistrationExperience";

export const metadata: Metadata = { title: "Create your ArchiCareer account", robots: { index: false, follow: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ account_type?: string; onboarding?: string }> }) {
    const params = await searchParams;
    const kind = params.account_type === "student" || params.account_type === "professional" ? params.account_type as RegistrationKind : null;
    return <RegistrationExperience kind={kind} onboarding={params.onboarding ?? ""} />;
}
