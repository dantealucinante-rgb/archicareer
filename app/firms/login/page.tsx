import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignInExperience, { type SignInAccountType } from "@/app/components/SignInExperience";

export const metadata: Metadata = { title: "Firm sign in | ArchiCareer", robots: { index: false, follow: false } };

export default async function FirmLoginPage({ searchParams }: { searchParams: Promise<{ account_type?: string; next?: string; error?: string; selected?: string }> }) {
    const params = await searchParams;
    if (params.account_type === "student" || params.account_type === "professional") {
        const query = new URLSearchParams({ account_type: params.account_type });
        if (params.next) query.set("next", params.next);
        redirect(`/login?${query.toString()}`);
    }
    const accountType: SignInAccountType = params.account_type === "business" ? "business" : "firm";
    return <SignInExperience accountType={accountType} nextPath={params.next} callbackError={params.error} selectedType={params.selected} />;
}
